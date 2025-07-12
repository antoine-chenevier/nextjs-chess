import { 
  SecretKingBootGameState, 
  Reserve, 
  GameAction, 
  ActionType,
  RESERVE_LIMITS,
  EXCHANGE_COSTS,
  VALID_KING_POSITIONS,
  PAWN_ZONES
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
      pawns: 0,
      knights: 0,
      bishops: 0,
      rooks: 0,
      queens: 0
    },
    
    blackReserve: {
      pawns: 0,
      knights: 0,
      bishops: 0,
      rooks: 0,
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
  
  // TODO: Ajouter validation des règles de déplacement spécifiques
  // (notamment pour les pions avec déplacement multi-cases initial)
  
  return { valid: true };
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
  
  // TODO: Implémenter la validation de promotion
  // Vérifier que le pion est sur la dernière rangée
  
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

// Fonctions utilitaires

function getPieceAt(board: (string | null)[][], position: string): string | null {
  const [file, rank] = [position.charCodeAt(0) - 65, parseInt(position[1]) - 1];
  return board[rank]?.[file] || null;
}

function isPieceOwnedBy(piece: string, player: 'white' | 'black'): boolean {
  const isWhitePiece = piece[0] === piece[0].toUpperCase();
  return (player === 'white' && isWhitePiece) || (player === 'black' && !isWhitePiece);
}

function hasPieceInReserve(reserve: Reserve, pieceType: string): boolean {
  const key = pieceType.toLowerCase().replace(/white|black/, '') + 's';
  return (reserve[key as keyof Reserve] as number) > 0;
}
