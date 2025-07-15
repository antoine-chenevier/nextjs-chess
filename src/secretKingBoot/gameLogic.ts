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
  
  // Validation spécifique selon le type de pièce
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
