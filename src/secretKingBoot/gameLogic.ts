import { 
  SecretKingBootGameState, 
  Reserve, 
  GameAction, 
  ActionType,
  RESERVE_LIMITS,
  EXCHANGE_COSTS,
  VALID_KING_POSITIONS,
  PAWN_ZONES,
  MIDDLE_LINE
} from './types';

import {
  Board,
  Piece,
  PieceType,
  PieceName,
  GameState as ChessGameState,
  CompleteGameState,
  isInCheck as chessIsInCheck,
  isCheckmate as chessIsCheckmate,
  isStalemate as chessIsStalemate,
  getGameState as chessGetGameState,
  getAllLegalMoves as chessGetAllLegalMoves,
  Action as ChessAction
} from '../logic/index';

/**
 * Crée un état initial pour une partie "La botte secrète du roi"
 */
export function createInitialGameState(): SecretKingBootGameState {
  return {
    currentPlayer: 'white',
    turn: 1,
    gamePhase: 'setup',
    
    whiteReserve: {
      pawns: 4,
      knights: 1,
      bishops: 1,
      rooks: 1,
      queens: 0
    },
    
    blackReserve: {
      pawns: 4,
      knights: 1,
      bishops: 1,
      rooks: 1,
      queens: 0
    },
    
    whiteKingPosition: null,
    blackKingPosition: null,
    
    moveHistory: [],
    
    // Échiquier vide au départ
    board: Array(8).fill(null).map(() => Array(8).fill(null))
  };
}

/**
 * Convertit la notation de position Secret King Boot vers les coordonnées d'échecs
 */
function positionToCoordinates(position: string): { x: number; y: number } {
  const file = position.charCodeAt(0) - 'A'.charCodeAt(0); // A=0, B=1, ..., H=7
  const rank = parseInt(position[1]) - 1; // 1=0, 2=1, ..., 8=7
  return { x: file, y: rank };
}

/**
 * Convertit les coordonnées d'échecs vers la notation de position Secret King Boot
 */
function coordinatesToPosition(x: number, y: number): string {
  const file = String.fromCharCode('A'.charCodeAt(0) + x);
  const rank = (y + 1).toString();
  return file + rank;
}

/**
 * Convertit une pièce Secret King Boot vers le format de pièce d'échecs classique
 */
function convertToChessPiece(pieceString: string, x: number, y: number): Piece | null {
  if (!pieceString) return null;
  
  const isWhite = pieceString.includes('White');
  const group = isWhite ? 2 : 3; // Groupe 2 pour blanc, 3 pour noir
  
  let type: PieceType;
  let name: PieceName;
  
  if (pieceString.includes('Pawn')) {
    type = isWhite ? PieceType.WhitePawn : PieceType.BlackPawn;
    name = isWhite ? PieceName.WhitePawn : PieceName.BlackPawn;
  } else if (pieceString.includes('Knight')) {
    type = PieceType.Knight;
    name = isWhite ? PieceName.WhiteKnight : PieceName.BlackKnight;
  } else if (pieceString.includes('Bishop')) {
    type = PieceType.Bishop;
    name = isWhite ? PieceName.WhiteBishop : PieceName.BlackBishop;
  } else if (pieceString.includes('Rook')) {
    type = PieceType.Rook;
    name = isWhite ? PieceName.WhiteRook : PieceName.BlackRook;
  } else if (pieceString.includes('Queen')) {
    type = PieceType.Queen;
    name = isWhite ? PieceName.WhiteQueen : PieceName.BlackQueen;
  } else if (pieceString.includes('King')) {
    type = PieceType.King;
    name = isWhite ? PieceName.WhiteKing : PieceName.BlackKing;
  } else {
    return null;
  }
  
  return { x, y, group, type, name };
}

/**
 * Convertit l'état Secret King Boot vers un plateau d'échecs classique
 */
export function convertToChessBoard(gameState: SecretKingBootGameState): Board {
  const pieces: (Piece | null)[] = new Array(64).fill(null);
  
  // Convertir le plateau Secret King Boot vers le format d'échecs classique
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece) {
        const chessPiece = convertToChessPiece(piece, file, 7 - rank); // Inverser le rang
        if (chessPiece) {
          pieces[file + (7 - rank) * 8] = chessPiece;
        }
      }
    }
  }
  
  return {
    pieces,
    castle: {
      2: { didMoveKing: false, didMoveShortTower: false, didMoveLongTower: false },
      3: { didMoveKing: false, didMoveShortTower: false, didMoveLongTower: false }
    }
  };
}

/**
 * Répare un état de jeu corrompu (remet les rois en place si ils manquent)
 */
export function repairGameState(gameState: SecretKingBootGameState): SecretKingBootGameState {
  const repairedState = JSON.parse(JSON.stringify(gameState)) as SecretKingBootGameState;
  
  // Vérifier et réparer la présence des rois
  let whiteKingFound = false;
  let blackKingFound = false;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = repairedState.board[rank][file];
      if (piece === 'WhiteKing') {
        whiteKingFound = true;
      } else if (piece === 'BlackKing') {
        blackKingFound = true;
      }
    }
  }
  
  // Remettre le roi blanc si manquant
  if (!whiteKingFound) {
    console.warn('🔧 RÉPARATION: Remise en place du roi blanc');
    if (repairedState.whiteKingPosition === 'E1') {
      repairedState.board[0][4] = 'WhiteKing';
    } else {
      repairedState.board[0][3] = 'WhiteKing'; // D1 par défaut
      repairedState.whiteKingPosition = 'D1';
    }
  }
  
  // Remettre le roi noir si manquant
  if (!blackKingFound) {
    console.warn('🔧 RÉPARATION: Remise en place du roi noir');
    if (repairedState.blackKingPosition === 'E8') {
      repairedState.board[7][4] = 'BlackKing';
    } else {
      repairedState.board[7][3] = 'BlackKing'; // D8 par défaut
      repairedState.blackKingPosition = 'D8';
    }
  }
  
  return repairedState;
}

/**
 * Valide l'intégrité de l'état du jeu (notamment la présence des rois)
 */
export function validateGameIntegrity(gameState: SecretKingBootGameState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Vérifier que les deux rois sont présents sur l'échiquier
  let whiteKingFound = false;
  let blackKingFound = false;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece === 'WhiteKing') {
        whiteKingFound = true;
      } else if (piece === 'BlackKing') {
        blackKingFound = true;
      }
    }
  }
  
  if (!whiteKingFound) {
    errors.push('🚨 ROI BLANC MANQUANT sur l\'échiquier!');
  }
  
  if (!blackKingFound) {
    errors.push('🚨 ROI NOIR MANQUANT sur l\'échiquier!');
  }
  
  // Vérifier la cohérence des positions stockées
  if (gameState.gamePhase !== 'setup') {
    if (gameState.whiteKingPosition && !whiteKingFound) {
      errors.push('Position du roi blanc stockée mais roi absent de l\'échiquier');
    }
    
    if (gameState.blackKingPosition && !blackKingFound) {
      errors.push('Position du roi noir stockée mais roi absent de l\'échiquier');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Met à jour l'état du jeu avec la logique d'échecs classique
 */
export function updateGameStateWithChessLogic(gameState: SecretKingBootGameState): SecretKingBootGameState {
  // Ne pas vérifier l'échec/mat pendant la phase de setup
  if (gameState.gamePhase === 'setup') {
    return gameState;
  }
  
  const chessBoard = convertToChessBoard(gameState);
  const currentPlayerGroup = gameState.currentPlayer === 'white' ? 2 : 3;
  
  // Vérifier l'état du jeu avec la logique d'échecs
  const chessGameState = chessGetGameState(chessBoard, currentPlayerGroup);
  
  let gameStatus: {
    status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
    player?: 'white' | 'black';
    winner?: 'white' | 'black' | 'draw';
    reason?: string;
  } = {
    status: 'playing',
    player: gameState.currentPlayer
  };
  
  switch (chessGameState) {
    case ChessGameState.CHECK:
      gameStatus.status = 'check';
      break;
      
    case ChessGameState.CHECKMATE:
      gameStatus.status = 'checkmate';
      gameStatus.winner = gameState.currentPlayer === 'white' ? 'black' : 'white';
      gameStatus.reason = 'Échec et mat';
      break;
      
    case ChessGameState.STALEMATE:
      gameStatus.status = 'stalemate';
      gameStatus.winner = 'draw';
      gameStatus.reason = 'Pat (stalemate)';
      break;
      
    default:
      gameStatus.status = 'playing';
      break;
  }
  
  return {
    ...gameState,
    chessBoard,
    chessGameState,
    gameStatus,
    gamePhase: gameStatus.winner ? 'ended' : gameState.gamePhase
  };
}

/**
 * Vérifie si un mouvement est légal selon la logique d'échecs classique
 */
export function isChessMoveLegal(
  gameState: SecretKingBootGameState, 
  from: string, 
  to: string
): boolean {
  try {
    // Vérifier d'abord l'intégrité du jeu
    const integrity = validateGameIntegrity(gameState);
    if (!integrity.valid) {
      console.error('isChessMoveLegal: Intégrité compromise', integrity.errors);
      return false;
    }
    
    const chessBoard = convertToChessBoard(gameState);
    const fromCoords = positionToCoordinates(from);
    const toCoords = positionToCoordinates(to);
    
    // Adapter les coordonnées pour le système d'échecs (inversion Y)
    const fromChess = { x: fromCoords.x, y: 7 - fromCoords.y };
    const toChess = { x: toCoords.x, y: 7 - toCoords.y };
    
    const piece = chessBoard.pieces[fromChess.x + fromChess.y * 8];
    if (!piece) {
      console.warn(`isChessMoveLegal: Aucune pièce en ${from}`);
      return false;
    }
    
    // Vérifier que la pièce appartient au joueur actuel
    const expectedGroup = gameState.currentPlayer === 'white' ? 2 : 3;
    if (piece.group !== expectedGroup) {
      console.warn(`isChessMoveLegal: Pièce ne appartient pas au joueur actuel (${from})`);
      return false;
    }
    
    // Vérifier que la destination ne contient pas le roi adverse
    const targetPiece = chessBoard.pieces[toChess.x + toChess.y * 8];
    if (targetPiece && targetPiece.type === PieceType.King) {
      console.error(`🚨 TENTATIVE DE CAPTURE DU ROI DÉTECTÉE: ${from} -> ${to}`);
      console.error('Pièce qui attaque:', piece);
      console.error('Roi ciblé:', targetPiece);
      return false; // Empêcher absolument la capture du roi
    }
    
    const legalMoves = chessGetAllLegalMoves(chessBoard, piece.group);
    
    const isLegal = legalMoves.some(move => 
      move.from.x === fromChess.x && 
      move.from.y === fromChess.y &&
      move.dest.x === toChess.x && 
      move.dest.y === toChess.y
    );
    
    if (!isLegal) {
      console.warn(`Mouvement illégal: ${from} -> ${to} (groupe ${piece.group})`);
    }
    
    return isLegal;
  } catch (error) {
    console.error('Erreur dans isChessMoveLegal:', error);
    return false;
  }
}

/**
 * Crée un état de test avec une situation d'échec
 */
export function createTestCheckState(): SecretKingBootGameState {
  const gameState = createInitialGameState();
  
  // Placer les rois
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Placer les rois sur l'échiquier
  gameState.board[0][4] = 'WhiteKing'; // E1
  gameState.board[7][4] = 'BlackKing'; // E8
  
  // Placer une tour blanche en E7 pour mettre le roi noir en échec
  gameState.board[6][4] = 'WhiteRook'; // E7
  
  return updateGameStateWithChessLogic(gameState);
}

/**
 * Crée un état de test avec une situation de mat
 */
export function createTestCheckmateState(): SecretKingBootGameState {
  const gameState = createInitialGameState();
  
  // Placer les rois
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'black'; // C'est au tour des noirs
  
  // Situation de mat du couloir
  gameState.board[0][4] = 'WhiteKing';  // E1
  gameState.board[7][4] = 'BlackKing';  // E8
  gameState.board[6][0] = 'WhiteRook';  // A7
  gameState.board[5][1] = 'WhiteRook';  // B6
  
  return updateGameStateWithChessLogic(gameState);
}

/**
 * Vérifie si une action est valide dans l'état actuel
 */
export function isValidAction(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  // Vérifier que c'est le bon joueur
  if (action.player !== gameState.currentPlayer) {
    return { valid: false, reason: "Ce n'est pas le tour de ce joueur" };
  }

  switch (action.type) {
    case 'place_king':
      return validatePlaceKing(gameState, action);
    
    case 'generate_pawn':
      return validateGeneratePawn(gameState, action);
    
    case 'move_piece':
      return validateMovePiece(gameState, action);
    
    case 'move_king_and_place':
      return validateMoveKingAndPlace(gameState, action);
    
    case 'place_piece':
      return validatePlacePiece(gameState, action);
    
    case 'exchange_pieces':
      return validateExchangePieces(gameState, action);
    
    case 'promote_pawn':
      return validatePromotePawn(gameState, action);
    
    default:
      return { valid: false, reason: "Type d'action non reconnu" };
  }
}

/**
 * Valide le placement initial du roi
 */
function validatePlaceKing(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  if (gameState.gamePhase !== 'setup') {
    return { valid: false, reason: "Le placement du roi ne peut se faire qu'en phase de setup" };
  }
  
  const validPositions = VALID_KING_POSITIONS[action.player];
  if (!action.to || !(validPositions as readonly string[]).includes(action.to)) {
    return { valid: false, reason: `Position invalide pour le roi ${action.player}` };
  }
  
  // Vérifier que le roi n'est pas déjà placé
  const kingPosition = action.player === 'white' ? 
    gameState.whiteKingPosition : gameState.blackKingPosition;
  
  if (kingPosition !== null) {
    return { valid: false, reason: "Le roi est déjà placé" };
  }
  
  return { valid: true };
}

/**
 * Valide la génération d'un pion en réserve
 */
function validateGeneratePawn(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  if (reserve.pawns >= RESERVE_LIMITS.pawns) {
    return { valid: false, reason: "Limite de pions en réserve atteinte" };
  }
  
  return { valid: true };
}

/**
 * Valide le déplacement d'une pièce
 */
function validateMovePiece(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  if (!action.from || !action.to) {
    return { valid: false, reason: "Position de départ et d'arrivée requises" };
  }
  
  // Vérifier que la pièce appartient au joueur
  const piece = getPieceAt(gameState.board, action.from);
  if (!piece || !isPieceOwnedBy(piece, action.player)) {
    return { valid: false, reason: "Aucune pièce du joueur à cette position" };
  }
  
  // Vérifier que la destination est valide
  const [fromFile, fromRank] = parseAlgebraicPosition(action.from);
  const [toFile, toRank] = parseAlgebraicPosition(action.to);
  
  if (!isValidBoardPosition(fromFile, fromRank) || !isValidBoardPosition(toFile, toRank)) {
    return { valid: false, reason: "Position invalide" };
  }
  
  // Vérifier qu'on ne capture pas sa propre pièce
  const targetPiece = getPieceAt(gameState.board, action.to);
  if (targetPiece && isPieceOwnedBy(targetPiece, action.player)) {
    return { valid: false, reason: "Impossible de capturer ses propres pièces" };
  }
  
  // Utiliser la logique d'échecs classique pour valider le mouvement
  if (gameState.gamePhase === 'playing') {
    const isLegal = isChessMoveLegal(gameState, action.from, action.to);
    if (!isLegal) {
      return { valid: false, reason: "Mouvement illégal selon les règles d'échecs" };
    }
  }
  
  // Validation spécifique selon le type de pièce (pour les cas non couverts par la logique classique)
  return validatePieceMovement(piece, action.from, action.to, gameState.board, action.player);
}

/**
 * Valide le déplacement du roi avec placement d'une pièce
 */
function validateMoveKingAndPlace(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  // Vérifier que c'est bien le roi qui bouge
  const piece = getPieceAt(gameState.board, action.from!);
  if (!piece || !piece.includes('King')) {
    return { valid: false, reason: "Seul le roi peut effectuer cette action" };
  }
  
  // Vérifier qu'il y a une pièce à placer en réserve
  if (!action.piece) {
    return { valid: false, reason: "Type de pièce à placer requis" };
  }
  
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  if (!hasPieceInReserve(reserve, action.piece)) {
    return { valid: false, reason: "Pièce non disponible en réserve" };
  }
  
  return { valid: true };
}

/**
 * Valide le placement d'une pièce de la réserve
 */
function validatePlacePiece(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  if (!action.piece || !action.to) {
    return { valid: false, reason: "Type de pièce et position requis" };
  }
  
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  if (!hasPieceInReserve(reserve, action.piece)) {
    return { valid: false, reason: "Pièce non disponible en réserve" };
  }
  
  // Vérifier que la case est libre
  if (getPieceAt(gameState.board, action.to)) {
    return { valid: false, reason: "Case occupée" };
  }
  
  // Vérifier les règles de placement pour les pions
  if (action.piece.includes('Pawn')) {
    return validatePawnPlacement(action.player, action.to);
  }
  
  return { valid: true };
}

/**
 * Valide l'échange de pions contre une autre pièce
 */
function validateExchangePieces(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  if (!action.exchangeTo || !action.cost) {
    return { valid: false, reason: "Type de pièce et coût requis" };
  }
  
  const reserve = action.player === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  // Vérifier qu'il y a assez de pions
  if (reserve.pawns < action.cost) {
    return { valid: false, reason: "Pas assez de pions en réserve" };
  }
  
  // Vérifier que l'échange correspond aux coûts définis
  const expectedCost = EXCHANGE_COSTS[action.exchangeTo as keyof typeof EXCHANGE_COSTS];
  if (!expectedCost || expectedCost !== action.cost) {
    return { valid: false, reason: "Coût d'échange invalide" };
  }
  
  // Vérifier les limites de réserve pour la pièce cible
  const targetPieceCount = reserve[action.exchangeTo as keyof Reserve] as number;
  const limit = RESERVE_LIMITS[action.exchangeTo as keyof Reserve] as number;
  
  if (targetPieceCount >= limit) {
    return { valid: false, reason: "Limite de réserve atteinte pour cette pièce" };
  }
  
  return { valid: true };
}

/**
 * Valide la promotion d'un pion
 */
function validatePromotePawn(
  gameState: SecretKingBootGameState, 
  action: GameAction
): { valid: boolean; reason?: string } {
  
  if (!action.from || !action.to || !action.piece) {
    return { valid: false, reason: "Position du pion et type de promotion requis" };
  }
  
  // Vérifier qu'il y a bien un pion à la position de départ
  const piece = getPieceAt(gameState.board, action.from);
  if (!piece || !piece.includes('Pawn')) {
    return { valid: false, reason: "Aucun pion à cette position" };
  }
  
  // Vérifier que le pion appartient au joueur
  if (!isPieceOwnedBy(piece, action.player)) {
    return { valid: false, reason: "Ce pion n'appartient pas au joueur" };
  }
  
  // Vérifier que le pion est sur la dernière rangée
  const toRank = parseInt(action.to[1]);
  const expectedRank = action.player === 'white' ? 8 : 1;
  
  if (toRank !== expectedRank) {
    return { valid: false, reason: `Le pion doit être sur la rangée ${expectedRank} pour être promu` };
  }
  
  // Vérifier que la pièce de promotion est valide
  const validPromotions = ['queen', 'rook', 'bishop', 'knight'];
  const promotionType = action.piece.toLowerCase().replace('white', '').replace('black', '');
  
  if (!validPromotions.includes(promotionType)) {
    return { valid: false, reason: "Promotion invalide, choisir parmi: dame, tour, fou, cavalier" };
  }
  
  return { valid: true };
}

/**
 * Valide le placement d'un pion selon les zones autorisées
 */
function validatePawnPlacement(
  player: 'white' | 'black', 
  position: string
): { valid: boolean; reason?: string } {
  
  const rank = parseInt(position[1]);
  const allowedRanks = PAWN_ZONES[player] as readonly number[];
  
  if (!allowedRanks.includes(rank)) {
    return { 
      valid: false, 
      reason: `Les pions ${player} ne peuvent être placés que sur les rangs ${allowedRanks.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Parse une position algébrique (ex: "E4") en coordonnées numériques
 */
function parseAlgebraicPosition(position: string): [number, number] {
  const file = position.charCodeAt(0) - 65; // A=0, B=1, ...
  const rank = parseInt(position[1]) - 1;   // 1=0, 2=1, ...
  return [file, rank];
}

/**
 * Vérifie si une position est valide sur l'échiquier
 */
function isValidBoardPosition(file: number, rank: number): boolean {
  return file >= 0 && file < 8 && rank >= 0 && rank < 8;
}

/**
 * Valide le mouvement d'une pièce spécifique
 */
function validatePieceMovement(
  piece: string, 
  from: string, 
  to: string, 
  board: (string | null)[][],
  player: 'white' | 'black'
): { valid: boolean; reason?: string } {
  
  const [fromFile, fromRank] = parseAlgebraicPosition(from);
  const [toFile, toRank] = parseAlgebraicPosition(to);
  
  const deltaX = toFile - fromFile;
  const deltaY = toRank - fromRank;
  
  // Validation spécifique selon le type de pièce
  if (piece.includes('King')) {
    // Roi : une case dans toutes les directions
    if (Math.abs(deltaX) <= 1 && Math.abs(deltaY) <= 1 && (deltaX !== 0 || deltaY !== 0)) {
      return { valid: true };
    }
    return { valid: false, reason: "Le roi ne peut se déplacer que d'une case" };
  }
  
  else if (piece.includes('Pawn')) {
    return validatePawnMovement(player, fromRank, toRank, deltaX, deltaY, board, toFile);
  }
  
  else if (piece.includes('Knight')) {
    // Cavalier : mouvement en L
    if ((Math.abs(deltaX) === 2 && Math.abs(deltaY) === 1) || 
        (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 2)) {
      return { valid: true };
    }
    return { valid: false, reason: "Le cavalier doit se déplacer en L" };
  }
  
  else if (piece.includes('Bishop')) {
    // Fou : diagonale
    if (Math.abs(deltaX) === Math.abs(deltaY) && deltaX !== 0) {
      // Vérifier que le chemin est libre
      if (isPathClear(fromFile, fromRank, toFile, toRank, board)) {
        return { valid: true };
      }
      return { valid: false, reason: "Le chemin du fou est bloqué" };
    }
    return { valid: false, reason: "Le fou doit se déplacer en diagonale" };
  }
  
  else if (piece.includes('Rook')) {
    // Tour : ligne droite
    if ((deltaX === 0 && deltaY !== 0) || (deltaY === 0 && deltaX !== 0)) {
      // Vérifier que le chemin est libre
      if (isPathClear(fromFile, fromRank, toFile, toRank, board)) {
        return { valid: true };
      }
      return { valid: false, reason: "Le chemin de la tour est bloqué" };
    }
    return { valid: false, reason: "La tour doit se déplacer en ligne droite" };
  }
  
  else if (piece.includes('Queen')) {
    // Dame : combinaison tour + fou
    const isRookMove = (deltaX === 0 && deltaY !== 0) || (deltaY === 0 && deltaX !== 0);
    const isBishopMove = Math.abs(deltaX) === Math.abs(deltaY) && deltaX !== 0;
    
    if (isRookMove || isBishopMove) {
      if (isPathClear(fromFile, fromRank, toFile, toRank, board)) {
        return { valid: true };
      }
      return { valid: false, reason: "Le chemin de la dame est bloqué" };
    }
    return { valid: false, reason: "Mouvement de dame invalide" };
  }
  
  return { valid: false, reason: "Type de pièce non reconnu" };
}

/**
 * Vérifie si le chemin entre deux positions est libre
 */
function isPathClear(
  fromFile: number, 
  fromRank: number, 
  toFile: number, 
  toRank: number, 
  board: (string | null)[][]
): boolean {
  const deltaX = toFile - fromFile;
  const deltaY = toRank - fromRank;
  
  const stepX = deltaX === 0 ? 0 : deltaX / Math.abs(deltaX);
  const stepY = deltaY === 0 ? 0 : deltaY / Math.abs(deltaY);
  
  let currentX = fromFile + stepX;
  let currentY = fromRank + stepY;
  
  // Vérifier chaque case intermédiaire
  while (currentX !== toFile || currentY !== toRank) {
    if (board[currentY][currentX] !== null) {
      return false; // Chemin bloqué
    }
    currentX += stepX;
    currentY += stepY;
  }
  
  return true;
}

/**
 * Valide le mouvement spécifique des pions selon les règles de la variante
 */
function validatePawnMovement(
  player: 'white' | 'black',
  fromRank: number,
  toRank: number,
  deltaX: number,
  deltaY: number,
  board: (string | null)[][],
  toFile: number
): { valid: boolean; reason?: string } {
  
  const direction = player === 'white' ? 1 : -1;
  const playerZone = PAWN_ZONES[player].map(rank => rank - 1); // Convertir en index 0-based
  const middleLine = MIDDLE_LINE[player];
  
  // Mouvement vers l'avant uniquement (pas de recul)
  if (deltaY * direction <= 0) {
    return { valid: false, reason: "Les pions ne peuvent qu'avancer" };
  }
  
  // Mouvement en ligne droite (pas de capture)
  if (deltaX === 0) {
    const targetPiece = board[toRank][toFile];
    if (targetPiece) {
      return { valid: false, reason: "Case occupée" };
    }
    
    // Si le pion est dans sa zone de départ (moitié de l'échiquier)
    if (playerZone.includes(fromRank)) {
      // Peut se déplacer de 1 à plusieurs cases jusqu'à la ligne médiane
      if ((player === 'white' && toRank <= middleLine) || 
          (player === 'black' && toRank >= middleLine)) {
        
        // Vérifier que le chemin est libre
        const step = direction;
        for (let rank = fromRank + step; rank !== toRank + step; rank += step) {
          if (board[rank] && board[rank][toFile]) {
            return { valid: false, reason: "Chemin bloqué" };
          }
        }
        return { valid: true };
      } else {
        return { valid: false, reason: "Les pions ne peuvent pas dépasser la ligne médiane en un coup depuis leur zone de départ" };
      }
    } else {
      // Après avoir franchi la ligne médiane, mouvement d'une case seulement
      if (Math.abs(deltaY) === 1) {
        return { valid: true };
      } else {
        return { valid: false, reason: "Après la ligne médiane, les pions ne peuvent avancer que d'une case" };
      }
    }
  }
  
  // Capture en diagonale (règle classique)
  else if (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 1) {
    const targetPiece = board[toRank][toFile];
    if (targetPiece && !isPieceOwnedBy(targetPiece, player)) {
      return { valid: true };
    }
    return { valid: false, reason: "Le pion ne peut capturer qu'une pièce adverse en diagonale" };
  }
  
  return { valid: false, reason: "Mouvement de pion invalide" };
}

/**
 * Trouve la position du roi sur l'échiquier
 */
function findKingPosition(board: (string | null)[][], player: 'white' | 'black'): [number, number] | null {
  const kingPiece = player === 'white' ? 'WhiteKing' : 'BlackKing';
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      if (board[rank][file] === kingPiece) {
        return [file, rank];
      }
    }
  }
  return null;
}

/**
 * Vérifie si une case est attaquée par l'adversaire
 */
function isSquareAttacked(
  board: (string | null)[][],
  targetFile: number,
  targetRank: number,
  byPlayer: 'white' | 'black'
): boolean {
  
  // Parcourir toutes les pièces de l'adversaire
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (!piece || !isPieceOwnedBy(piece, byPlayer)) {
        continue;
      }
      
      // Vérifier si cette pièce peut attaquer la case cible
      if (canPieceAttackSquare(board, piece, file, rank, targetFile, targetRank, byPlayer)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Vérifie si une pièce peut attaquer une case donnée
 */
function canPieceAttackSquare(
  board: (string | null)[][],
  piece: string,
  fromFile: number,
  fromRank: number,
  toFile: number,
  toRank: number,
  player: 'white' | 'black'
): boolean {
  
  const deltaX = toFile - fromFile;
  const deltaY = toRank - fromRank;
  
  if (piece.includes('Pawn')) {
    const direction = player === 'white' ? 1 : -1;
    // Les pions attaquent en diagonale
    return Math.abs(deltaX) === 1 && deltaY === direction;
  }
  
  else if (piece.includes('King')) {
    // Roi attaque dans toutes les directions adjacentes
    return Math.abs(deltaX) <= 1 && Math.abs(deltaY) <= 1 && (deltaX !== 0 || deltaY !== 0);
  }
  
  else if (piece.includes('Knight')) {
    // Cavalier attaque en L
    return (Math.abs(deltaX) === 2 && Math.abs(deltaY) === 1) || 
           (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 2);
  }
  
  else if (piece.includes('Bishop')) {
    // Fou attaque en diagonale
    if (Math.abs(deltaX) === Math.abs(deltaY) && deltaX !== 0) {
      return isPathClear(fromFile, fromRank, toFile, toRank, board);
    }
  }
  
  else if (piece.includes('Rook')) {
    // Tour attaque en ligne droite
    if ((deltaX === 0 && deltaY !== 0) || (deltaY === 0 && deltaX !== 0)) {
      return isPathClear(fromFile, fromRank, toFile, toRank, board);
    }
  }
  
  else if (piece.includes('Queen')) {
    // Dame combine tour et fou
    const isRookMove = (deltaX === 0 && deltaY !== 0) || (deltaY === 0 && deltaX !== 0);
    const isBishopMove = Math.abs(deltaX) === Math.abs(deltaY) && deltaX !== 0;
    
    if (isRookMove || isBishopMove) {
      return isPathClear(fromFile, fromRank, toFile, toRank, board);
    }
  }
  
  return false;
}

/**
 * Vérifie si le roi est en échec
 */
export function isKingInCheck(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  const kingPosition = findKingPosition(gameState.board, player);
  if (!kingPosition) {
    return false; // Pas de roi trouvé
  }
  
  const [kingFile, kingRank] = kingPosition;
  const opponent = player === 'white' ? 'black' : 'white';
  
  return isSquareAttacked(gameState.board, kingFile, kingRank, opponent);
}

/**
 * Vérifie si le roi est en échec et mat
 */
export function isKingInCheckmate(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  // D'abord vérifier si le roi est en échec
  if (!isKingInCheck(gameState, player)) {
    return false;
  }
  
  // Essayer tous les mouvements possibles pour voir si on peut sortir de l'échec
  return !hasLegalMoves(gameState, player);
}

/**
 * Vérifie si le joueur a des coups légaux disponibles
 */
function hasLegalMoves(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  // Parcourir toutes les pièces du joueur
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (!piece || !isPieceOwnedBy(piece, player)) {
        continue;
      }
      
      // Essayer tous les mouvements possibles pour cette pièce
      const fromPosition = String.fromCharCode(65 + file) + (rank + 1);
      
      for (let toRank = 0; toRank < 8; toRank++) {
        for (let toFile = 0; toFile < 8; toFile++) {
          const toPosition = String.fromCharCode(65 + toFile) + (toRank + 1);
          
          // Tester ce mouvement
          const moveAction: GameAction = {
            type: 'move_piece',
            player,
            turn: gameState.turn,
            from: fromPosition,
            to: toPosition
          };
          
          // Vérifier si le mouvement est légal (ne met pas le roi en échec)
          if (isValidAction(gameState, moveAction).valid && isMoveLegal(gameState, moveAction)) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

/**
 * Vérifie si un mouvement est légal (ne met pas son propre roi en échec)
 */
function isMoveLegal(gameState: SecretKingBootGameState, action: GameAction): boolean {
  // Simuler le mouvement
  const testState = JSON.parse(JSON.stringify(gameState)) as SecretKingBootGameState;
  
  // Appliquer le mouvement dans l'état de test
  if (action.from && action.to) {
    const [fromFile, fromRank] = parseAlgebraicPosition(action.from);
    const [toFile, toRank] = parseAlgebraicPosition(action.to);
    
    const piece = testState.board[fromRank][fromFile];
    testState.board[toRank][toFile] = piece;
    testState.board[fromRank][fromFile] = null;
    
    // Vérifier si le roi est en échec après ce mouvement
    return !isKingInCheck(testState, action.player);
  }
  
  return false;
}

/**
 * Vérifie si la partie est terminée par pat (roi pas en échec mais aucun coup légal)
 */
export function isStalemate(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  // Le roi ne doit pas être en échec
  if (isKingInCheck(gameState, player)) {
    return false;
  }
  
  // Mais il ne doit y avoir aucun coup légal
  return !hasLegalMoves(gameState, player);
}

/**
 * Obtient le statut de la partie (en cours, échec, échec et mat, pat)
 */
export function getGameStatus(gameState: SecretKingBootGameState): {
  status: 'playing' | 'check' | 'checkmate' | 'stalemate';
  player?: 'white' | 'black';
  winner?: 'white' | 'black' | 'draw';
} {
  const currentPlayer = gameState.currentPlayer;
  
  if (isKingInCheckmate(gameState, currentPlayer)) {
    const winner = currentPlayer === 'white' ? 'black' : 'white';
    return {
      status: 'checkmate',
      player: currentPlayer,
      winner
    };
  }
  
  if (isStalemate(gameState, currentPlayer)) {
    return {
      status: 'stalemate',
      player: currentPlayer,
      winner: 'draw'
    };
  }
  
  if (isKingInCheck(gameState, currentPlayer)) {
    return {
      status: 'check',
      player: currentPlayer
    };
  }
  
  return {
    status: 'playing'
  };
}

// Fonctions utilitaires

function getPieceAt(board: (string | null)[][], position: string): string | null {
  const [file, rank] = [position.charCodeAt(0) - 65, parseInt(position[1]) - 1];
  return board[rank]?.[file] || null;
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

function hasPieceInReserve(reserve: Reserve, pieceType: string): boolean {
  // Extraire le type de pièce du nom complet (ex: "WhiteKnight" -> "knights")
  let baseType = pieceType.replace(/White|Black/, '').toLowerCase();
  
  // Mapping vers les clés de la réserve
  const typeMap: { [key: string]: keyof Reserve } = {
    'pawn': 'pawns',
    'knight': 'knights', 
    'bishop': 'bishops',
    'rook': 'rooks',
    'queen': 'queens'
  };
  
  const reserveKey = typeMap[baseType];
  if (!reserveKey) {
    return false;
  }
  
  return (reserve[reserveKey] as number) > 0;
}
