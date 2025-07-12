import { 
  SecretKingBootGameState, 
  GameAction, 
  Reserve,
  RESERVE_LIMITS,
  EXCHANGE_COSTS
} from './types';

/**
 * Applique une action validée sur l'état du jeu
 */
export function applyAction(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  const newState = JSON.parse(JSON.stringify(gameState)) as SecretKingBootGameState;
  
  // Ajouter l'action à l'historique
  newState.moveHistory.push(action);
  
  switch (action.type) {
    case 'place_king':
      return applyPlaceKing(newState, action);
    
    case 'generate_pawn':
      return applyGeneratePawn(newState, action);
    
    case 'move_piece':
      return applyMovePiece(newState, action);
    
    case 'move_king_and_place':
      return applyMoveKingAndPlace(newState, action);
    
    case 'place_piece':
      return applyPlacePiece(newState, action);
    
    case 'exchange_pieces':
      return applyExchangePieces(newState, action);
    
    case 'promote_pawn':
      return applyPromotePawn(newState, action);
    
    default:
      return newState;
  }
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
  
  return gameState;
}

/**
 * Applique le déplacement d'une pièce
 */
function applyMovePiece(
  gameState: SecretKingBootGameState, 
  action: GameAction
): SecretKingBootGameState {
  
  const [fromFile, fromRank] = parsePosition(action.from!);
  const [toFile, toRank] = parsePosition(action.to!);
  
  // Récupérer la pièce
  const piece = gameState.board[fromRank][fromFile];
  
  // Gérer la capture
  const capturedPiece = gameState.board[toRank][toFile];
  if (capturedPiece) {
    // Remettre la pièce capturée en réserve (si c'est autorisé)
    addCapturedPieceToReserve(gameState, capturedPiece, action.player);
  }
  
  // Effectuer le déplacement
  gameState.board[toRank][toFile] = piece;
  gameState.board[fromRank][fromFile] = null;
  
  // Passer au joueur suivant
  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  if (gameState.currentPlayer === 'white') {
    gameState.turn++;
  }
  
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
  
  // Passer au joueur suivant
  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  if (gameState.currentPlayer === 'white') {
    gameState.turn++;
  }
  
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
  
  // Passer au joueur suivant
  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  if (gameState.currentPlayer === 'white') {
    gameState.turn++;
  }
  
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
  
  // Passer au joueur suivant
  gameState.currentPlayer = gameState.currentPlayer === 'white' ? 'black' : 'white';
  
  if (gameState.currentPlayer === 'white') {
    gameState.turn++;
  }
  
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
  return prefix + pieceType.replace(/white|black/i, '');
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
  const key = pieceType.toLowerCase() + 's';
  if (key in reserve) {
    (reserve[key as keyof Reserve] as number)++;
  }
}

function removePieceFromReserve(reserve: Reserve, pieceType: string): void {
  const key = pieceType.toLowerCase().replace(/white|black/, '') + 's';
  if (key in reserve && (reserve[key as keyof Reserve] as number) > 0) {
    (reserve[key as keyof Reserve] as number)--;
  }
}
