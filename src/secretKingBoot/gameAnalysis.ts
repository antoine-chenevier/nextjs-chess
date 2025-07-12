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
  // TODO: Implémenter la génération des coups de déplacement
  // En utilisant la logique existante du jeu d'échecs
  return [];
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
