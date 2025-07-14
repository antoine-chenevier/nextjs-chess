import { SecretKingBootGameState, GameAction, ActionType } from './types';

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
    
    // Placement de pièces de la réserve
    if (hasReservePieces(gameState)) {
      actions.push('place_piece');
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
    
    case 'place_piece':
      return getPiecePlacementMoves(gameState);
    
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
    case 'place_piece':
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
        
        // Convertir en GameAction
        for (const move of pieceMoves) {
          const toPosition = String.fromCharCode(65 + move.x) + (move.y + 1);
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
    }
  }
  
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
    // Mouvements des pions - version simplifiée
    const direction = player === 'white' ? 1 : -1;
    const startRank = player === 'white' ? 1 : 6;
    
    // Avancement d'une case
    const oneStep = position.y + direction;
    if (isValidSquare(position.x, oneStep) && !board[oneStep][position.x]) {
      moves.push({ x: position.x, y: oneStep });
      
      // Avancement de deux cases depuis la position initiale
      if (position.y === startRank) {
        const twoSteps = position.y + (2 * direction);
        if (isValidSquare(position.x, twoSteps) && !board[twoSteps][position.x]) {
          moves.push({ x: position.x, y: twoSteps });
        }
      }
    }
    
    // Captures diagonales
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

function getPiecePlacementMoves(gameState: SecretKingBootGameState): GameAction[] {
  // TODO: Implémenter la génération des coups de placement
  // En vérifiant les cases libres et les règles spécifiques (zones pions)
  return [];
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
  
  return moves;
}

function isPieceOwnedBy(piece: string, player: 'white' | 'black'): boolean {
  const isWhitePiece = piece.startsWith('White');
  return (player === 'white' && isWhitePiece) || (player === 'black' && !isWhitePiece);
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
