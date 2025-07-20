import { SecretKingBootGameState, GameAction, ActionType } from './types';
import { isChessMoveLegal } from './gameLogic';
import { isKingInCheck } from './improvedCheckLogic';

/**
 * Actions disponibles pour le joueur selon l'état actuel du jeu
 */
export function getAvailableActions(gameState: SecretKingBootGameState): ActionType[] {
  const actions: ActionType[] = [];
  
  // Phase de setup : placement des rois
  if (gameState.gamePhase === 'setup') {
    const kingPosition = gameState.currentPlayer === 'white' ? 
      gameState.whiteKingPosition : gameState.blackKingPosition;
    
    if (kingPosition === null) {
      actions.push('place_king');
    }
    
    // Premier coup : peut aussi générer un pion
    if (gameState.turn === 1) {
      actions.push('generate_pawn');
    }
    
    return actions;
  }
  
  // Phase de jeu normal
  if (gameState.gamePhase === 'playing') {
    
    // RÈGLE CRITIQUE: Si le roi est en échec, seuls certains mouvements sont autorisés
    if (gameState.gameStatus?.status === 'check' && gameState.gameStatus?.player === gameState.currentPlayer) {
      // En échec, on peut déplacer des pièces pour sortir d'échec
      if (hasMovablePieces(gameState)) {
        actions.push('move_piece');
      }
      
      // On peut aussi déplacer le roi et placer une pièce (stratégie défensive)
      // Cette action permet de fuir l'échec tout en renforçant sa position
      if (hasKingOnBoard(gameState) && hasReservePieces(gameState)) {
        actions.push('move_king_and_place');
      }
      
      return actions; // Pas d'autres actions possibles en échec
    }
    
    // Jeu normal (pas en échec)
    // Toujours possible de générer un pion
    actions.push('generate_pawn');
    
    // Déplacements si il y a des pièces sur l'échiquier
    if (hasMovablePieces(gameState)) {
      actions.push('move_piece');
      
      // Déplacement du roi avec placement
      if (hasKingOnBoard(gameState) && hasReservePieces(gameState)) {
        actions.push('move_king_and_place');
      }
    }
    
    // Échange de pions contre des pièces
    if (canExchangePieces(gameState)) {
      actions.push('exchange_pieces');
    }
    
    // Promotion si il y a des pions sur la dernière rangée
    if (hasPromotablePawns(gameState)) {
      actions.push('promote_pawn');
    }
  }
  
  return actions;
}

/**
 * Génère les coups possibles pour une action donnée
 */
export function getPossibleMoves(
  gameState: SecretKingBootGameState, 
  actionType: ActionType
): GameAction[] {
  
  const moves: GameAction[] = [];
  const player = gameState.currentPlayer;
  const turn = gameState.turn;
  
  switch (actionType) {
    case 'place_king':
      return getKingPlacementMoves(player, turn);
    
    case 'generate_pawn':
      return [{
        type: 'generate_pawn',
        player,
        turn
      }];
    
    case 'move_piece':
      return getPieceMovementMoves(gameState);
    
    case 'move_king_and_place':
      return getKingMoveAndPlaceMoves(gameState);
    
    case 'exchange_pieces':
      return getExchangeMoves(gameState);
    
    default:
      return [];
  }
}

/**
 * Calcule les coûts d'une action
 */
export function getActionCost(action: GameAction): number {
  switch (action.type) {
    case 'generate_pawn':
    case 'move_piece':
    case 'exchange_pieces':
    case 'promote_pawn':
      return 1; // 1 coup
    
    case 'move_king_and_place':
      return 1; // 1 coup pour déplacer le roi ET placer une pièce
    
    case 'place_king':
      return 0; // Gratuit en phase de setup
    
    default:
      return 1;
  }
}

/**
 * Analyse l'état du jeu pour la stratégie
 */
export function analyzeGameState(gameState: SecretKingBootGameState) {
  const analysis = {
    // Matériel sur l'échiquier
    whitePiecesOnBoard: countPiecesOnBoard(gameState, 'white'),
    blackPiecesOnBoard: countPiecesOnBoard(gameState, 'black'),
    
    // Matériel en réserve
    whiteReserveValue: calculateReserveValue(gameState.whiteReserve),
    blackReserveValue: calculateReserveValue(gameState.blackReserve),
    
    // Contrôle du centre
    centerControl: analyzeCenterControl(gameState),
    
    // Sécurité des rois
    kingSafety: analyzeKingSafety(gameState),
    
    // Mobilité des pièces
    mobility: analyzeMobility(gameState),
    
    // Potentiel d'attaque
    attackPotential: analyzeAttackPotential(gameState)
  };
  
  return analysis;
}

// Fonctions utilitaires privées

function hasMovablePieces(gameState: SecretKingBootGameState): boolean {
  const player = gameState.currentPlayer;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && isPieceOwnedBy(piece, player)) {
        return true;
      }
    }
  }
  
  return false;
}

function hasKingOnBoard(gameState: SecretKingBootGameState): boolean {
  const kingPosition = gameState.currentPlayer === 'white' ? 
    gameState.whiteKingPosition : gameState.blackKingPosition;
  return kingPosition !== null;
}

function hasReservePieces(gameState: SecretKingBootGameState): boolean {
  const reserve = gameState.currentPlayer === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  return Object.values(reserve).some(count => count > 0);
}

function canExchangePieces(gameState: SecretKingBootGameState): boolean {
  const reserve = gameState.currentPlayer === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  // Besoin d'au moins 2 pions pour le plus petit échange (cavalier)
  return reserve.pawns >= 2;
}

function hasPromotablePawns(gameState: SecretKingBootGameState): boolean {
  const player = gameState.currentPlayer;
  const promotionRank = player === 'white' ? 7 : 0;
  
  for (let file = 0; file < 8; file++) {
    const piece = gameState.board[promotionRank][file];
    if (piece && piece.includes('Pawn') && isPieceOwnedBy(piece, player)) {
      return true;
    }
  }
  
  return false;
}

function getKingPlacementMoves(player: 'white' | 'black', turn: number): GameAction[] {
  const positions = player === 'white' ? ['D1', 'E1'] : ['D8', 'E8'];
  
  return positions.map(to => ({
    type: 'place_king' as ActionType,
    player,
    turn,
    to
  }));
}

function getPieceMovementMoves(gameState: SecretKingBootGameState): GameAction[] {
  const moves: GameAction[] = [];
  const player = gameState.currentPlayer;
  const turn = gameState.turn;
  
  // Parcourir l'échiquier pour trouver les pièces du joueur actuel
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && isPieceOwnedBy(piece, player)) {
        const fromPosition = String.fromCharCode(65 + file) + (rank + 1);
        
        // Générer les coups possibles pour cette pièce
        const pieceMoves = generateMovesForPiece(
          piece, 
          { x: file, y: rank }, 
          gameState.board,
          player
        );
        
        // Convertir en GameAction et filtrer les mouvements légaux
        for (const move of pieceMoves) {
          const toPosition = String.fromCharCode(65 + move.x) + (move.y + 1);
          
          // Vérifier si le mouvement est légal selon les règles d'échecs
          if (isChessMoveLegal(gameState, fromPosition, toPosition)) {
            moves.push({
              type: 'move_piece',
              player,
              turn,
              from: fromPosition,
              to: toPosition,
              piece: piece
            });
          }
        }
        
        // Ajouter les prises en passant pour les pions
        if (piece.includes('Pawn')) {
          const enPassantMoves = getEnPassantMovesForPawn(gameState, { x: file, y: rank }, player);
          moves.push(...enPassantMoves);
        }
      }
    }
  }
  
  return moves;
}

/**
 * Génère les mouvements de prise en passant pour un pion
 */
function getEnPassantMovesForPawn(
  gameState: SecretKingBootGameState, 
  pawnPosition: { x: number, y: number }, 
  player: 'white' | 'black'
): GameAction[] {
  const moves: GameAction[] = [];
  
  console.log(`🔍 Vérification prise en passant pour pion ${player} en position (${pawnPosition.x}, ${pawnPosition.y})`);
  
  // Vérifier qu'il y a au moins un mouvement dans l'historique
  if (gameState.moveHistory.length === 0) {
    console.log('❌ Pas d\'historique de mouvements');
    return moves;
  }
  
  // Récupérer le dernier mouvement
  const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];
  console.log('📜 Dernier mouvement:', lastMove);
  
  // La prise en passant n'est possible que si le dernier mouvement était un mouvement de pion
  if (lastMove.type !== 'move_piece' || !lastMove.piece?.includes('Pawn')) {
    console.log('❌ Le dernier mouvement n\'était pas un mouvement de pion');
    return moves;
  }
  
  // Vérifier que le dernier mouvement était du joueur adverse
  if (lastMove.player === player) {
    console.log('❌ Le dernier mouvement était du même joueur');
    return moves;
  }
  
  // Analyser le dernier mouvement pour voir si c'était un bond de pion
  if (!lastMove.from || !lastMove.to) {
    console.log('❌ Positions manquantes dans le dernier mouvement');
    return moves;
  }
  
  // Convertir les positions en coordonnées
  const fromFile = lastMove.from.charCodeAt(0) - 65; // A=0, B=1, etc.
  const fromRank = parseInt(lastMove.from.charAt(1)) - 1; // 1=0, 2=1, etc.
  const toFile = lastMove.to.charCodeAt(0) - 65;
  const toRank = parseInt(lastMove.to.charAt(1)) - 1;
  
  console.log(`📊 Dernier mouvement: ${lastMove.from} (${fromFile},${fromRank}) → ${lastMove.to} (${toFile},${toRank})`);
  
  // Vérifier que c'était un mouvement vertical (même colonne)
  if (fromFile !== toFile) {
    console.log('❌ Mouvement non vertical');
    return moves;
  }
  
  // Vérifier que c'était un bond de au moins 2 cases
  const moveDistance = Math.abs(toRank - fromRank);
  console.log(`📏 Distance du mouvement: ${moveDistance}`);
  if (moveDistance < 2) {
    console.log('❌ Bond trop petit (< 2 cases)');
    return moves;
  }
  
  // CORRECTION: Vérifier que le pion adverse est maintenant adjacent horizontalement à notre pion
  // et sur la même rangée
  const horizontalDistance = Math.abs(toFile - pawnPosition.x);
  const sameRank = toRank === pawnPosition.y;
  console.log(`📐 Distance horizontale: ${horizontalDistance}, même rangée: ${sameRank}`);
  
  if (horizontalDistance !== 1 || !sameRank) {
    console.log('❌ Pion adverse pas adjacent ou pas sur la même rangée');
    return moves;
  }
  
  // Déterminer la direction de la prise en passant
  const direction = player === 'white' ? 1 : -1;
  const captureRank = pawnPosition.y + direction;
  
  console.log(`⬆️ Direction: ${direction}, case de capture: (${toFile}, ${captureRank})`);
  
  // Vérifier que la case de capture est valide
  if (captureRank < 0 || captureRank > 7) {
    console.log('❌ Case de capture hors échiquier');
    return moves;
  }
  
  // CORRECTION: La case de capture doit être libre (c'est là où notre pion va aller)
  if (gameState.board[captureRank][toFile] !== null) {
    console.log('❌ Case de capture occupée');
    return moves;
  }
  
  // Générer le mouvement de prise en passant
  const fromPosition = String.fromCharCode(65 + pawnPosition.x) + (pawnPosition.y + 1);
  const toPosition = String.fromCharCode(65 + toFile) + (captureRank + 1);
  
  console.log(`✅ Mouvement prise en passant généré: ${fromPosition} → ${toPosition}`);
  
  // Vérifier que le mouvement est légal selon les règles d'échecs (ne met pas le roi en échec)
  if (isChessMoveLegal(gameState, fromPosition, toPosition)) {
    console.log('✅ Mouvement légal selon les règles d\'échecs');
    moves.push({
      type: 'move_piece',
      player,
      turn: gameState.turn,
      from: fromPosition,
      to: toPosition,
      piece: gameState.board[pawnPosition.y][pawnPosition.x]!,
      isEnPassant: true // Marquer comme prise en passant
    });
  } else {
    console.log('❌ Mouvement illégal selon les règles d\'échecs');
  }
  
  console.log(`🎯 Nombre de mouvements prise en passant générés: ${moves.length}`);
  return moves;
}

/**
 * Génère les coups possibles pour une pièce spécifique
 */
function generateMovesForPiece(
  piece: string, 
  position: { x: number, y: number }, 
  board: (string | null)[][],
  player: 'white' | 'black'
): { x: number, y: number }[] {
  
  const moves: { x: number, y: number }[] = [];
  
  if (piece.includes('King')) {
    // Mouvements du roi : une case dans toutes les directions
    const kingMoves = [
      { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 },                     { dx: 1, dy: 0 },
      { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
    ];
    
    for (const move of kingMoves) {
      const newX = position.x + move.dx;
      const newY = position.y + move.dy;
      
      if (isValidSquare(newX, newY)) {
        const targetPiece = board[newY][newX];
        
        // Case vide ou pièce ennemie
        if (!targetPiece || !isPieceOwnedBy(targetPiece, player)) {
          moves.push({ x: newX, y: newY });
        }
      }
    }
  }
  
  else if (piece.includes('Pawn')) {
    // Mouvements des pions - version Secret King Boot
    const direction = player === 'white' ? 1 : -1;
    const currentRank = position.y;
    
    // NOUVELLES RÈGLES SECRET KING BOOT:
    // - Pions blancs sur la 1ère rangée (rang 0) peuvent aller jusqu'à la 4ème rangée (rang 3)
    // - Pions noirs sur la 8ème rangée (rang 7) peuvent aller jusqu'à la 5ème rangée (rang 4)
    let maxSteps = 1; // Par défaut, 1 case
    let maxTargetRank = currentRank + direction;
    
    if (player === 'white' && currentRank === 0) {
      // Pion blanc sur la 1ère rangée peut aller jusqu'à la 4ème rangée
      maxSteps = 4;
      maxTargetRank = 3;
    } else if (player === 'white' && currentRank === 1) {
      // Pion blanc sur la 2ème rangée peut aller jusqu'à la 4ème rangée
      maxSteps = 3;
      maxTargetRank = 3;
    } else if (player === 'black' && currentRank === 6) {
      // Pion noir sur la 7ème rangée peut aller jusqu'à la 5ème rangée
      maxSteps = 3;
      maxTargetRank = 4;
    } else if (player === 'black' && currentRank === 7) {
      // Pion noir sur la 8ème rangée peut aller jusqu'à la 5ème rangée
      maxSteps = 4;
      maxTargetRank = 4;
    }
    
    // Générer tous les mouvements possibles
    for (let steps = 1; steps <= maxSteps; steps++) {
      const newY = currentRank + (steps * direction);
      
      // Vérifier les limites de l'échiquier
      if (!isValidSquare(position.x, newY)) {
        break;
      }
      
      // Vérifier les limites spéciales pour les pions initiaux
      if (maxSteps > 1) {
        if (player === 'white' && newY > maxTargetRank) {
          break;
        }
        if (player === 'black' && newY < maxTargetRank) {
          break;
        }
      }
      
      // Vérifier que la case est libre
      if (board[newY][position.x]) {
        break; // Chemin bloqué
      }
      
      moves.push({ x: position.x, y: newY });
    }
    
    // Captures diagonales (toujours possible)
    for (const dx of [-1, 1]) {
      const captureX = position.x + dx;
      const captureY = position.y + direction;
      
      if (isValidSquare(captureX, captureY)) {
        const targetPiece = board[captureY][captureX];
        if (targetPiece && !isPieceOwnedBy(targetPiece, player)) {
          moves.push({ x: captureX, y: captureY });
        }
      }
    }
    
    // Prise en passant (nécessite l'état du jeu pour connaître le dernier mouvement)
    // Cette fonctionnalité sera ajoutée dans getPieceMovementMoves qui a accès à gameState
  }
  
  else if (piece.includes('Knight')) {
    // Mouvements du cavalier
    const knightMoves = [
      { dx: -2, dy: -1 }, { dx: -2, dy: 1 }, { dx: -1, dy: -2 }, { dx: -1, dy: 2 },
      { dx: 1, dy: -2 },  { dx: 1, dy: 2 },  { dx: 2, dy: -1 },  { dx: 2, dy: 1 }
    ];
    
    for (const move of knightMoves) {
      const newX = position.x + move.dx;
      const newY = position.y + move.dy;
      
      if (isValidSquare(newX, newY)) {
        const targetPiece = board[newY][newX];
        if (!targetPiece || !isPieceOwnedBy(targetPiece, player)) {
          moves.push({ x: newX, y: newY });
        }
      }
    }
  }
  
  else if (piece.includes('Bishop')) {
    // Mouvements du fou : diagonales
    const directions = [
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];
    
    for (const dir of directions) {
      for (let i = 1; i < 8; i++) {
        const newX = position.x + (dir.dx * i);
        const newY = position.y + (dir.dy * i);
        
        if (!isValidSquare(newX, newY)) break;
        
        const targetPiece = board[newY][newX];
        
        if (!targetPiece) {
          moves.push({ x: newX, y: newY });
        } else {
          if (!isPieceOwnedBy(targetPiece, player)) {
            moves.push({ x: newX, y: newY });
          }
          break; // Arrêter dans cette direction
        }
      }
    }
  }
  
  else if (piece.includes('Rook')) {
    // Mouvements de la tour : lignes et colonnes
    const directions = [
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }
    ];
    
    for (const dir of directions) {
      for (let i = 1; i < 8; i++) {
        const newX = position.x + (dir.dx * i);
        const newY = position.y + (dir.dy * i);
        
        if (!isValidSquare(newX, newY)) break;
        
        const targetPiece = board[newY][newX];
        
        if (!targetPiece) {
          moves.push({ x: newX, y: newY });
        } else {
          if (!isPieceOwnedBy(targetPiece, player)) {
            moves.push({ x: newX, y: newY });
          }
          break; // Arrêter dans cette direction
        }
      }
    }
  }
  
  else if (piece.includes('Queen')) {
    // Mouvements de la dame : combinaison tour + fou
    const directions = [
      { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
      { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];
    
    for (const dir of directions) {
      for (let i = 1; i < 8; i++) {
        const newX = position.x + (dir.dx * i);
        const newY = position.y + (dir.dy * i);
        
        if (!isValidSquare(newX, newY)) break;
        
        const targetPiece = board[newY][newX];
        
        if (!targetPiece) {
          moves.push({ x: newX, y: newY });
        } else {
          if (!isPieceOwnedBy(targetPiece, player)) {
            moves.push({ x: newX, y: newY });
          }
          break; // Arrêter dans cette direction
        }
      }
    }
  }
  
  return moves;
}

/**
 * Vérifie si une case est valide sur l'échiquier
 */
function isValidSquare(x: number, y: number): boolean {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

function getExchangeMoves(gameState: SecretKingBootGameState): GameAction[] {
  const moves: GameAction[] = [];
  const reserve = gameState.currentPlayer === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  // Cavalier = 2 pions
  if (reserve.pawns >= 2 && reserve.knights < 1) {
    moves.push({
      type: 'exchange_pieces',
      player: gameState.currentPlayer,
      turn: gameState.turn,
      exchangeFrom: 'pawn',
      exchangeTo: 'knight',
      cost: 2
    });
  }
  
  // Fou = 3 pions
  if (reserve.pawns >= 3 && reserve.bishops < 1) {
    moves.push({
      type: 'exchange_pieces',
      player: gameState.currentPlayer,
      turn: gameState.turn,
      exchangeFrom: 'pawn',
      exchangeTo: 'bishop',
      cost: 3
    });
  }
  
  // Tour = 4 pions
  if (reserve.pawns >= 4 && reserve.rooks < 1) {
    moves.push({
      type: 'exchange_pieces',
      player: gameState.currentPlayer,
      turn: gameState.turn,
      exchangeFrom: 'pawn',
      exchangeTo: 'rook',
      cost: 4
    });
  }
  
  // Note: Les dames ne peuvent être obtenues que par promotion de pions,
  // pas par échange direct de pions
  // Dame = promotion uniquement (pas d'échange de pions contre dame)
  
  return moves;
}

function isPieceOwnedBy(piece: string, player: 'white' | 'black'): boolean {
  const isWhitePiece = piece.includes('White');
  const isBlackPiece = piece.includes('Black');
  
  if (player === 'white') {
    return isWhitePiece;
  } else {
    return isBlackPiece;
  }
}

function countPiecesOnBoard(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let count = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && isPieceOwnedBy(piece, player)) {
        count++;
      }
    }
  }
  
  return count;
}

function calculateReserveValue(reserve: any): number {
  // Valeurs approximatives des pièces
  return reserve.pawns * 1 + 
         reserve.knights * 3 + 
         reserve.bishops * 3 + 
         reserve.rooks * 5 + 
         reserve.queens * 9;
}

function analyzeCenterControl(gameState: SecretKingBootGameState): any {
  // TODO: Analyser le contrôle des cases centrales (D4, D5, E4, E5)
  return { white: 0, black: 0 };
}

function analyzeKingSafety(gameState: SecretKingBootGameState): any {
  // TODO: Analyser la sécurité des rois
  return { white: 'safe', black: 'safe' };
}

function analyzeMobility(gameState: SecretKingBootGameState): any {
  // TODO: Analyser la mobilité des pièces
  return { white: 0, black: 0 };
}

function analyzeAttackPotential(gameState: SecretKingBootGameState): any {
  // TODO: Analyser le potentiel d'attaque
  return { white: 0, black: 0 };
}

function getKingMoveAndPlaceMoves(gameState: SecretKingBootGameState): GameAction[] {
  const moves: GameAction[] = [];
  const player = gameState.currentPlayer;
  const turn = gameState.turn;
  const reserve = player === 'white' ? gameState.whiteReserve : gameState.blackReserve;
  
  // Trouver la position du roi
  let kingPosition: { x: number, y: number } | null = null;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && piece.includes('King') && isPieceOwnedBy(piece, player)) {
        kingPosition = { x: file, y: rank };
        break;
      }
    }
    if (kingPosition) break;
  }
  
  if (!kingPosition) {
    return moves; // Pas de roi trouvé
  }
  
  // Générer les mouvements possibles du roi
  const kingMoves = generateMovesForPiece(
    player === 'white' ? 'WhiteKing' : 'BlackKing',
    kingPosition,
    gameState.board,
    player
  );
  
  // Types de pièces disponibles en réserve
  const availablePieces: { type: string; count: number }[] = [
    { type: 'Pawn', count: reserve.pawns },
    { type: 'Knight', count: reserve.knights },
    { type: 'Bishop', count: reserve.bishops },
    { type: 'Rook', count: reserve.rooks },
    { type: 'Queen', count: reserve.queens }
  ];
  
  // Pour chaque mouvement possible du roi
  for (const kingMove of kingMoves) {
    const fromPosition = String.fromCharCode(65 + kingPosition.x) + (kingPosition.y + 1);
    const toPosition = String.fromCharCode(65 + kingMove.x) + (kingMove.y + 1);
    
    // Vérifier si le mouvement du roi est légal selon les règles d'échecs
    if (!isChessMoveLegal(gameState, fromPosition, toPosition)) {
      continue; // Passer ce mouvement s'il n'est pas légal
    }
    
    // Si le joueur est en échec, vérifier que ce mouvement résout l'échec
    if (gameState.gameStatus?.status === 'check' && gameState.gameStatus?.player === player) {
      // Simuler le mouvement pour voir si cela résout l'échec
      const tempState = JSON.parse(JSON.stringify(gameState));
      
      // Effectuer le mouvement du roi temporairement
      tempState.board[kingMove.y][kingMove.x] = tempState.board[kingPosition.y][kingPosition.x];
      tempState.board[kingPosition.y][kingPosition.x] = null;
      
      // Mettre à jour la position du roi
      if (player === 'white') {
        tempState.whiteKingPosition = `${String.fromCharCode(65 + kingMove.x)}${kingMove.y + 1}`;
      } else {
        tempState.blackKingPosition = `${String.fromCharCode(65 + kingMove.x)}${kingMove.y + 1}`;
      }
      
      // Vérifier si le roi est encore en échec après ce mouvement
      if (isKingInCheck(tempState, player)) {
        continue; // Ce mouvement ne résout pas l'échec, le passer
      }
    }
    
    // Pour chaque type de pièce disponible en réserve
    for (const pieceInfo of availablePieces) {
      if (pieceInfo.count > 0) {
        // Vérifier les règles spéciales pour les pions
        if (pieceInfo.type === 'Pawn') {
          const allowedRanks = player === 'white' ? [1, 2, 3, 4] : [5, 6, 7, 8];
          if (!allowedRanks.includes(kingPosition.y + 1)) {
            continue; // Passer cette pièce si elle ne peut pas être placée sur la case du roi
          }
        }
        
        moves.push({
          type: 'move_king_and_place',
          player,
          turn,
          from: fromPosition,
          to: toPosition,
          piece: pieceInfo.type
        });
      }
    }
  }
  
  return moves;
}
