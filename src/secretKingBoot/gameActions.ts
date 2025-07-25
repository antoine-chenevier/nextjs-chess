import { 
  SecretKingBootGameState, 
  GameAction, 
  Reserve,
  RESERVE_LIMITS,
  EXCHANGE_COSTS
} from './types';
import { getGameStatus, updateGameStateWithChessLogic, isChessMoveLegal, validateGameIntegrity, isValidEnPassantCapture } from './gameLogic';

/**
 * Applique une action validée sur l'état du jeu
 */
export function applyAction(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  // VALIDATION CRITIQUE : Empêcher toute action qui mettrait le roi en échec
  // SEULEMENT pendant la phase de jeu (pas pendant le setup)
  if (gameState.gamePhase === 'playing' && 
      (action.type === 'move_piece' || action.type === 'move_king_and_place')) {
    
    // Vérifier que le mouvement est légal selon les règles d'échecs
    if (action.from && action.to && !isChessMoveLegal(gameState, action.from, action.to)) {
      console.error(`MOUVEMENT ILLÉGAL BLOQUÉ: ${action.from} -> ${action.to}`);
      console.error('Action:', action);
      console.error('État du jeu:', gameState.gameStatus);
      
      // Retourner l'état inchangé
      return gameState;
    }
  }
  
  const newState = JSON.parse(JSON.stringify(gameState)) as SecretKingBootGameState;
  
  // Ajouter l'action à l'historique
  newState.moveHistory.push(action);
  
  let intermediateState: SecretKingBootGameState;
  
  switch (action.type) {
    case 'place_king':
      intermediateState = applyPlaceKing(newState, action);
      break;
    
    case 'generate_pawn':
      intermediateState = applyGeneratePawn(newState, action);
      break;
    
    case 'move_piece':
      intermediateState = applyMovePiece(newState, action);
      break;
    
    case 'move_king_and_place':
      intermediateState = applyMoveKingAndPlace(newState, action);
      break;
    
    case 'place_piece':
      intermediateState = applyPlacePiece(newState, action);
      break;
    
    case 'exchange_pieces':
      intermediateState = applyExchangePieces(newState, action);
      break;
    
    case 'promote_pawn':
      intermediateState = applyPromotePawn(newState, action);
      break;
    
    case 'select_promotion':
      intermediateState = applySelectPromotion(newState, action);
      break;
    
    default:
      intermediateState = newState;
      break;
  }
  
  // Toujours mettre à jour le statut du jeu après une action
  const finalState = updateGameStatus(intermediateState);
  return finalState;
}

/**
 * Met à jour le statut du jeu (échec, échec et mat, pat)
 */
function updateGameStatus(gameState: SecretKingBootGameState): SecretKingBootGameState {
  // VALIDATION CRITIQUE : Vérifier l'intégrité du jeu SEULEMENT pendant la phase de jeu
  if (gameState.gamePhase === 'playing') {
    const integrity = validateGameIntegrity(gameState);
    if (!integrity.valid) {
      console.error('🚨 INTÉGRITÉ DU JEU COMPROMISE!');
      integrity.errors.forEach(error => console.error(error));
      
      // Alerter l'utilisateur
      alert('ERREUR CRITIQUE: ' + integrity.errors.join('\n'));
      
      // Retourner l'état avec un marqueur d'erreur
      return {
        ...gameState,
        gameStatus: {
          status: 'checkmate',
          winner: 'draw',
          reason: 'Erreur de jeu: ' + integrity.errors[0]
        },
        gamePhase: 'ended'
      };
    }
  }

  // Pendant la phase de setup, juste copier l'état
  let updatedState = { ...gameState };
  
  // Ne changer de joueur que si ce n'est pas une action de placement de roi (phase setup)
  // et si la partie n'est pas terminée (échec et mat ou pat)
  // et si aucune promotion n'est en attente
  if (updatedState.gamePhase === 'playing' && !updatedState.promotionRequired) {
    // Pour certaines actions, changer de joueur
    const lastAction = updatedState.moveHistory[updatedState.moveHistory.length - 1];
    
    if (lastAction && ['move_piece', 'move_king_and_place', 'place_piece', 'select_promotion'].includes(lastAction.type)) {
      // RÈGLE CRITIQUE: Toujours changer de joueur après un mouvement valide
      // Même si le joueur était en échec, après avoir joué un mouvement valide, c'est au tour de l'adversaire
      updatedState.currentPlayer = updatedState.currentPlayer === 'white' ? 'black' : 'white';
      
      if (updatedState.currentPlayer === 'white') {
        updatedState.turn += 1;
      }
    }
    
    // Maintenant recalculer l'état d'échec pour le nouveau joueur actuel
    updatedState = updateGameStateWithChessLogic(updatedState);
    
    // Si la partie est terminée (échec et mat ou pat), ne pas permettre d'autres actions
    if (updatedState.gameStatus?.status === 'checkmate' || updatedState.gameStatus?.status === 'stalemate') {
      updatedState.gamePhase = 'ended';
    }
  }
  
  return updatedState;
}

/**
 * Applique le placement initial du roi
 */
function applyPlaceKing(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  if (action.player === 'white') {
    gameState.whiteKingPosition = action.to as 'D1' | 'E1';
  } else {
    gameState.blackKingPosition = action.to as 'D8' | 'E8';
  }
  
  // Placer le roi sur l'échiquier
  const [file, rank] = parsePosition(action.to!);
  gameState.board[rank][file] = action.player === 'white' ? 'WhiteKing' : 'BlackKing';
  
  // Passer au joueur suivant ou démarrer la partie si les deux rois sont placés
  if (gameState.whiteKingPosition && gameState.blackKingPosition) {
    gameState.gamePhase = 'playing';
    gameState.currentPlayer = 'white'; // Blanc commence
  } else {
    gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  }
  
  return gameState;
}

/**
 * Applique la génération d'un pion en réserve
 */
function applyGeneratePawn(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  reserve.pawns++;
  
  // Passer au joueur suivant
  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  if (gameState.currentPlayer === 'white') {
    gameState.turn++;
  }
  
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

/**
 * Applique le déplacement d'une pièce
 */
function applyMovePiece(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  console.log('🎬 applyMovePiece appelé avec action:', action);
  console.log('📋 action.isEnPassant:', action.isEnPassant);
  
  const [fromFile, fromRank] = parsePosition(action.from!);
  const [toFile, toRank] = parsePosition(action.to!);
  
  // Récupérer la pièce
  const piece = gameState.board[fromRank][fromFile];
  
  // Détecter automatiquement la prise en passant si elle n'est pas déjà marquée
  if (!action.isEnPassant && piece && piece.includes('Pawn')) {
    // Vérifier si c'est un mouvement diagonal vers une case vide (signe de prise en passant)
    const isDiagonal = Math.abs(toFile - fromFile) === 1 && Math.abs(toRank - fromRank) === 1;
    const isEmptyDestination = gameState.board[toRank][toFile] === null;
    
    console.log(`🔍 Détection prise en passant: isDiagonal=${isDiagonal}, isEmptyDestination=${isEmptyDestination}`);
    
    if (isDiagonal && isEmptyDestination) {
      // C'est probablement une prise en passant, vérifier qu'elle est valide
      const isWhitePawn = piece.includes('White');
      console.log(`🧪 Test validité prise en passant pour pion ${isWhitePawn ? 'blanc' : 'noir'}: ${action.from} → ${action.to}`);
      if (isValidEnPassantCapture(gameState, action.from!, action.to!, isWhitePawn)) {
        console.log('🎯 Prise en passant détectée et marquée dans l\'action');
        action.isEnPassant = true;
      } else {
        console.log('❌ Prise en passant non valide selon isValidEnPassantCapture');
      }
    }
  }
  
  // Vérifier la légalité du mouvement selon les règles d'échecs (après avoir marqué la prise en passant)
  if (gameState.gamePhase === 'playing' && !isChessMoveLegal(gameState, action.from!, action.to!, action.isEnPassant)) {
    // Mouvement illégal, retourner l'état inchangé
    console.warn(`Mouvement illégal tenté: ${action.from} -> ${action.to}`);
    return gameState;
  }
  
  // Si c'est un roi, mettre à jour sa position stockée
  if (piece && piece.includes('King')) {
    if (piece === 'WhiteKing') {
      gameState.whiteKingPosition = action.to! as 'D1' | 'E1';
    } else if (piece === 'BlackKing') {
      gameState.blackKingPosition = action.to! as 'D8' | 'E8';
    }
  }
  
  // Gérer la capture
  const capturedPiece = gameState.board[toRank][toFile];
  if (capturedPiece) {
    // VÉRIFICATION CRITIQUE : Un roi ne doit JAMAIS être capturé
    if (capturedPiece.includes('King')) {
      console.error('🚨 ERREUR CRITIQUE: Tentative de capture du roi!');
      console.error('Pièce qui attaque:', piece);
      console.error('Roi attaqué:', capturedPiece);
      console.error('Position:', action.to);
      console.error('État du jeu:', gameState.gameStatus);
      
      // Arrêter immédiatement et retourner l'état inchangé
      alert('ERREUR: Le roi ne peut pas être capturé! Vérifiez la logique d\'échec.');
      return gameState;
    }
    
    // Remettre la pièce capturée en réserve (si c'est autorisé)
    addCapturedPieceToReserve(gameState, capturedPiece, action.player);
  }
  
  // Gérer la prise en passant
  if (action.isEnPassant) {
    console.log('🔄 Traitement prise en passant...');
    // En cas de prise en passant, le pion capturé n'est pas sur la case d'arrivée
    // mais sur la même colonne que la case d'arrivée et sur la même rangée que le pion qui capture (avant le mouvement)
    const capturedPawnFile = toFile;
    const capturedPawnRank = fromRank; // Même rangée que le pion qui capture AVANT le mouvement
    
    console.log(`🎯 Position du pion à capturer: (${capturedPawnFile}, ${capturedPawnRank}) = ${String.fromCharCode(65 + capturedPawnFile)}${capturedPawnRank + 1}`);
    
    const capturedPawn = gameState.board[capturedPawnRank][capturedPawnFile];
    console.log(`🔍 Pion trouvé à cette position: ${capturedPawn}`);
    
    if (capturedPawn && capturedPawn.includes('Pawn')) {
      // VÉRIFICATION CRITIQUE : Un roi ne doit JAMAIS être capturé
      if (capturedPawn.includes('King')) {
        console.error('🚨 ERREUR CRITIQUE: Tentative de capture du roi en prise en passant!');
        return gameState;
      }
      
      console.log(`✅ Suppression du pion ${capturedPawn} à la position ${String.fromCharCode(65 + capturedPawnFile)}${capturedPawnRank + 1}`);
      // Supprimer le pion capturé
      gameState.board[capturedPawnRank][capturedPawnFile] = null;
      
      // Remettre le pion capturé en réserve
      addCapturedPieceToReserve(gameState, capturedPawn, action.player);
    } else {
      console.warn(`❌ Prise en passant: aucun pion trouvé à la position ${String.fromCharCode(65 + capturedPawnFile)}${capturedPawnRank + 1}`);
      console.warn('Contenu actuel:', capturedPawn);
    }
  }
  
  // Effectuer le déplacement
  console.log(`🚀 Déplacement: ${action.from} (${piece}) → ${action.to}`);
  gameState.board[toRank][toFile] = piece;
  gameState.board[fromRank][fromFile] = null;
  console.log(`✅ Pièce déplacée de (${fromFile},${fromRank}) vers (${toFile},${toRank})`);
  
  // Vérifier si c'est un pion qui atteint la dernière rangée (nécessite une promotion)
  if (piece && piece.includes('Pawn') && isPawnPromotion(action.from!, action.to!, action.player)) {
    // Marquer que ce mouvement nécessite une promotion, mais ne pas l'appliquer automatiquement
    // La promotion sera gérée par l'interface utilisateur
    gameState.promotionRequired = {
      from: action.from!,
      to: action.to!,
      player: action.player
    };
  }
  
  // Ne pas changer de joueur ici - sera géré par updateGameStatus selon l'état d'échec
  // Le changement de tour se fait seulement si le joueur n'est plus en échec
  
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

/**
 * Applique le déplacement du roi avec placement d'une pièce
 */
function applyMoveKingAndPlace(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  // D'abord déplacer le roi
  const moveAction: GameAction = {
    ...action,
    type: 'move_piece'
  };
  gameState = applyMovePiece(gameState, moveAction);
  
  // Ensuite placer la pièce sur la case quittée par le roi
  const [fromFile, fromRank] = parsePosition(action.from!);
  gameState.board[fromRank][fromFile] = formatPieceForBoard(action.piece!, action.player);
  
  // Retirer la pièce de la réserve
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  removePieceFromReserve(reserve, action.piece!);
  
  // Mettre à jour le statut du jeu après le placement
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

/**
 * Applique le placement d'une pièce de la réserve
 */
function applyPlacePiece(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  const [file, rank] = parsePosition(action.to!);
  
  // Placer la pièce sur l'échiquier
  gameState.board[rank][file] = formatPieceForBoard(action.piece!, action.player);
  
  // Retirer la pièce de la réserve
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  removePieceFromReserve(reserve, action.piece!);
  
  // Ne pas changer de joueur ici - sera géré par updateGameStatus selon l'état d'échec
  
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

/**
 * Applique l'échange de pions contre une autre pièce
 */
function applyExchangePieces(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  // Retirer les pions
  reserve.pawns -= action.cost!;
  
  // Ajouter la nouvelle pièce
  addPieceToReserve(reserve, action.exchangeTo!);
  
  // Ne pas changer de joueur ici - sera géré par updateGameStatus selon l'état d'échec
  
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

/**
 * Applique la promotion d'un pion
 */
function applyPromotePawn(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  const [file, rank] = parsePosition(action.to!);
  
  // Remplacer le pion par la pièce promue
  gameState.board[rank][file] = formatPieceForBoard(action.piece!, action.player);
  
  // Ne pas changer de joueur ici - sera géré par updateGameStatus selon l'état d'échec
  
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

/**
 * Applique la sélection d'une pièce pour la promotion
 */
function applySelectPromotion(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  if (!gameState.promotionRequired) {
    console.error('Aucune promotion en attente');
    return gameState;
  }
  
  const { from, to, player } = gameState.promotionRequired;
  const [file, rank] = parsePosition(to);
  
  // Appliquer la promotion avec la pièce choisie
  const promotionPiece = formatPieceForBoard(action.piece!, player);
  gameState.board[rank][file] = promotionPiece;
  
  // Supprimer l'état de promotion en attente
  delete gameState.promotionRequired;
  
  // Ne pas changer de joueur ici - sera géré par updateGameStatus selon l'état d'échec
  
  // Ne pas appeler updateGameStatus ici - sera fait dans applyAction
  return gameState;
}

// Fonctions utilitaires

function parsePosition(position: string): [number, number] {
  const file = position.charCodeAt(0) - 65; // A=0, B=1, ...
  const rank = parseInt(position[1]) - 1;   // 1=0, 2=1, ...
  return [file, rank];
}

function formatPieceForBoard(pieceType: string, player: 'white' | 'black'): string {
  const prefix = player === 'white' ? 'White' : 'Black';
  // Nettoyer le type de pièce et s'assurer qu'il a la bonne casse
  const cleanType = pieceType.replace(/White|Black/gi, '');
  const capitalizedType = cleanType.charAt(0).toUpperCase() + cleanType.slice(1).toLowerCase();
  return prefix + capitalizedType;
}

function addCapturedPieceToReserve(
  gameState: SecretKingBootGameState, 
  capturedPiece: string, 
  capturingPlayer: 'white' | 'black'
): void {
  
  // La pièce capturée va dans la réserve du joueur qui capture
  const reserve = capturingPlayer === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  const pieceType = capturedPiece.replace(/White|Black/, '').toLowerCase();
  
  // Vérifier les limites avant d'ajouter
  const currentCount = reserve[pieceType as keyof Reserve] as number;
  const limit = RESERVE_LIMITS[pieceType as keyof Reserve] as number;
  
  if (currentCount < limit) {
    addPieceToReserve(reserve, pieceType);
  }
}

function addPieceToReserve(reserve: Reserve, pieceType: string): void {
  // Mapping vers les clés de la réserve
  const typeMap: { [key: string]: keyof Reserve } = {
    'pawn': 'pawns',
    'knight': 'knights', 
    'bishop': 'bishops',
    'rook': 'rooks',
    'queen': 'queens'
  };
  
  const baseType = pieceType.toLowerCase().replace(/white|black/, '');
  const reserveKey = typeMap[baseType];
  
  if (reserveKey && reserveKey in reserve) {
    (reserve[reserveKey] as number)++;
  }
}

function removePieceFromReserve(reserve: Reserve, pieceType: string): void {
  // Mapping vers les clés de la réserve
  const typeMap: { [key: string]: keyof Reserve } = {
    'pawn': 'pawns',
    'knight': 'knights', 
    'bishop': 'bishops',
    'rook': 'rooks',
    'queen': 'queens'
  };
  
  const baseType = pieceType.toLowerCase().replace(/white|black/, '');
  const reserveKey = typeMap[baseType];
  
  if (reserveKey && reserveKey in reserve && (reserve[reserveKey] as number) > 0) {
    (reserve[reserveKey] as number)--;
  }
}

/**
 * Vérifie si un mouvement de pion nécessite une promotion
 */
export function isPawnPromotion(
  from: string,
  to: string,
  player: 'white' | 'black'
): boolean {
  const toRank = parseInt(to[1]);
  const promotionRank = player === 'white' ? 8 : 1;
  return toRank === promotionRank;
}

/**
 * Crée une action de promotion automatique
 */
export function createPromotionAction(
  from: string,
  to: string,
  player: 'white' | 'black',
  promoteTo: string = 'queen' // Promotion par défaut en dame
): GameAction {
  return {
    type: 'promote_pawn',
    player,
    turn: 0, // Sera mis à jour par le système
    from,
    to,
    piece: player === 'white' ? `White${promoteTo}` : `Black${promoteTo}`
  };
}
