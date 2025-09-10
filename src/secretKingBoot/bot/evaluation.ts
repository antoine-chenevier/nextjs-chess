import { SecretKingBootGameState, Reserve } from '../types';
import { convertToChessBoard } from '../gameLogic';
import { 
  isInCheck as chessIsInCheck, 
  isCheckmate as chessIsCheckmate, 
  GameState as ChessGameState 
} from '../../logic';

// Valeurs des pièces
const PIECE_VALUES = {
  'Pawn': 100,
  'Knight': 300,
  'Bishop': 300,
  'Rook': 500,
  'Queen': 900,
  'King': 10000
};

// Piece-Square Tables for positional evaluation
const PAWN_TABLE = [
  [  0,  0,  0,  0,  0,  0,  0,  0],
  [ 50, 50, 50, 50, 50, 50, 50, 50],
  [ 10, 10, 20, 30, 30, 20, 10, 10],
  [  5,  5, 10, 25, 25, 10,  5,  5],
  [  0,  0,  0, 20, 20,  0,  0,  0],
  [  5, -5,-10,  0,  0,-10, -5,  5],
  [  5, 10, 10,-20,-20, 10, 10,  5],
  [  0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const BISHOP_TABLE = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];

const ROOK_TABLE = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const KING_TABLE_MIDDLEGAME = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];

const KING_TABLE_ENDGAME = [
  [-50,-40,-30,-20,-20,-30,-40,-50],
  [-30,-20,-10,  0,  0,-10,-20,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 30, 40, 40, 30,-10,-30],
  [-30,-10, 20, 30, 30, 20,-10,-30],
  [-30,-30,  0,  0,  0,  0,-30,-30],
  [-50,-30,-30,-30,-30,-30,-30,-50]
];

/**
 * Game phase detection
 */
export enum GamePhase {
  OPENING = 'opening',
  MIDDLEGAME = 'middlegame', 
  ENDGAME = 'endgame'
}

export function detectGamePhase(gameState: SecretKingBootGameState): GamePhase {
  let totalMaterial = 0;
  let pieceCount = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && !piece.includes('King')) {
        totalMaterial += getPieceValue(piece);
        pieceCount++;
      }
    }
  }
  
  // Opening: High material count and piece development
  if (totalMaterial > 6000 && pieceCount > 20) {
    return GamePhase.OPENING;
  }
  
  // Endgame: Low material count
  if (totalMaterial < 2500 || pieceCount < 12) {
    return GamePhase.ENDGAME;
  }
  
  return GamePhase.MIDDLEGAME;
}

/**
 * Enhanced position evaluation with advanced features
 */
export function evaluatePosition(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  const gamePhase = detectGamePhase(gameState);
  
  // 1. Material evaluation with piece-square tables
  score += evaluateMaterialWithTables(gameState, player, gamePhase);
  
  // 2. Reserve evaluation
  score += evaluateReserve(gameState, player);
  
  // 3. King safety (enhanced)
  score += evaluateKingSafety(gameState, player);
  
  // 4. Pawn structure assessment
  score += evaluatePawnStructure(gameState, player);
  
  // 5. Piece mobility and activity
  score += evaluatePieceMobility(gameState, player);
  
  // 6. Tactical patterns
  score += evaluateTacticalPatterns(gameState, player);
  
  // 7. Game phase specific adjustments
  score += evaluateGamePhaseFactors(gameState, player, gamePhase);
  
  return score;
}

/**
 * Enhanced material evaluation with piece-square tables
 */
function evaluateMaterialWithTables(gameState: SecretKingBootGameState, player: 'white' | 'black', gamePhase: GamePhase): number {
  let score = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece) {
        const materialValue = getPieceValue(piece);
        const positionalValue = getPieceSquareValue(piece, rank, file, gamePhase);
        const totalValue = materialValue + positionalValue;
        
        if (isPieceOwnedBy(piece, player)) {
          score += totalValue;
        } else {
          score -= totalValue;
        }
      }
    }
  }
  
  return score;
}

/**
 * Get piece-square table value for positional evaluation
 */
function getPieceSquareValue(piece: string, rank: number, file: number, gamePhase: GamePhase): number {
  const isWhite = piece.includes('White');
  
  // Flip ranks for black pieces
  const adjustedRank = isWhite ? rank : 7 - rank;
  
  if (piece.includes('Pawn')) {
    return PAWN_TABLE[adjustedRank][file];
  } else if (piece.includes('Knight')) {
    return KNIGHT_TABLE[adjustedRank][file];
  } else if (piece.includes('Bishop')) {
    return BISHOP_TABLE[adjustedRank][file];
  } else if (piece.includes('Rook')) {
    return ROOK_TABLE[adjustedRank][file];
  } else if (piece.includes('Queen')) {
    return QUEEN_TABLE[adjustedRank][file];
  } else if (piece.includes('King')) {
    const table = gamePhase === GamePhase.ENDGAME ? KING_TABLE_ENDGAME : KING_TABLE_MIDDLEGAME;
    return table[adjustedRank][file];
  }
  
  return 0;
}

/**
 * Enhanced pawn structure evaluation
 */
function evaluatePawnStructure(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  const playerPawns: Array<{rank: number, file: number}> = [];
  const opponentPawns: Array<{rank: number, file: number}> = [];
  
  // Collect pawn positions
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && piece.includes('Pawn')) {
        if (isPieceOwnedBy(piece, player)) {
          playerPawns.push({rank, file});
        } else {
          opponentPawns.push({rank, file});
        }
      }
    }
  }
  
  // Evaluate doubled pawns
  const fileGroups = new Map<number, number>();
  playerPawns.forEach(pawn => {
    fileGroups.set(pawn.file, (fileGroups.get(pawn.file) || 0) + 1);
  });
  
  fileGroups.forEach(count => {
    if (count > 1) {
      score -= 20 * (count - 1); // Penalty for doubled pawns
    }
  });
  
  // Evaluate isolated pawns
  playerPawns.forEach(pawn => {
    const hasAdjacentPawn = playerPawns.some(other => 
      Math.abs(other.file - pawn.file) === 1
    );
    if (!hasAdjacentPawn) {
      score -= 15; // Penalty for isolated pawn
    }
  });
  
  // Evaluate passed pawns
  playerPawns.forEach(pawn => {
    const isPassedPawn = !opponentPawns.some(opponent => {
      const fileDiff = Math.abs(opponent.file - pawn.file);
      const isBlocking = player === 'white' ? 
        opponent.rank > pawn.rank && fileDiff <= 1 :
        opponent.rank < pawn.rank && fileDiff <= 1;
      return isBlocking;
    });
    
    if (isPassedPawn) {
      const advancement = player === 'white' ? pawn.rank : 7 - pawn.rank;
      score += 20 + advancement * 10; // Bonus for passed pawn
    }
  });
  
  return score;
}

/**
 * Evaluate piece mobility and activity
 */
function evaluatePieceMobility(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  
  // This is simplified - in a real implementation, we'd calculate legal moves for each piece
  // For now, we evaluate piece development and central positioning
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && isPieceOwnedBy(piece, player)) {
        // Bonus for pieces in central files
        if (file >= 2 && file <= 5) {
          score += 5;
        }
        
        // Bonus for advanced pieces (except pawns and king)
        if (!piece.includes('Pawn') && !piece.includes('King')) {
          const advancement = player === 'white' ? rank : 7 - rank;
          if (advancement >= 4) {
            score += advancement * 2;
          }
        }
      }
    }
  }
  
  return score;
}

/**
 * Evaluate tactical patterns
 */
function evaluateTacticalPatterns(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  
  // Look for basic tactical patterns like pins, forks, etc.
  // This is a simplified implementation
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && isPieceOwnedBy(piece, player)) {
        
        // Knight fork potential
        if (piece.includes('Knight')) {
          score += evaluateKnightForks(gameState, rank, file, player);
        }
        
        // Bishop/Rook pin potential
        if (piece.includes('Bishop') || piece.includes('Rook') || piece.includes('Queen')) {
          score += evaluatePinPotential(gameState, rank, file, player);
        }
      }
    }
  }
  
  return score;
}

/**
 * Evaluate knight fork opportunities
 */
function evaluateKnightForks(gameState: SecretKingBootGameState, knightRank: number, knightFile: number, player: 'white' | 'black'): number {
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  
  let forkTargets = 0;
  
  knightMoves.forEach(([dr, df]) => {
    const newRank = knightRank + dr;
    const newFile = knightFile + df;
    
    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      const targetPiece = gameState.board[newRank][newFile];
      if (targetPiece && !isPieceOwnedBy(targetPiece, player)) {
        forkTargets++;
      }
    }
  });
  
  return forkTargets >= 2 ? 30 : 0; // Bonus for potential knight fork
}

/**
 * Evaluate pin potential for long-range pieces
 */
function evaluatePinPotential(gameState: SecretKingBootGameState, pieceRank: number, pieceFile: number, player: 'white' | 'black'): number {
  // Simplified pin detection - check if piece can create pins along lines
  // This would need more sophisticated implementation for real tactical analysis
  return 0;
}

/**
 * Game phase specific evaluation adjustments
 */
function evaluateGamePhaseFactors(gameState: SecretKingBootGameState, player: 'white' | 'black', gamePhase: GamePhase): number {
  let score = 0;
  
  switch (gamePhase) {
    case GamePhase.OPENING:
      // Encourage piece development and king safety
      score += evaluateOpeningFactors(gameState, player);
      break;
      
    case GamePhase.MIDDLEGAME:
      // Focus on tactical opportunities and center control
      score += evaluateMiddlegameFactors(gameState, player);
      break;
      
    case GamePhase.ENDGAME:
      // Prioritize king activity and pawn promotion
      score += evaluateEndgameFactors(gameState, player);
      break;
  }
  
  return score;
}

function evaluateOpeningFactors(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  const backRank = player === 'white' ? 0 : 7;
  
  // Penalty for undeveloped pieces
  for (let file = 1; file < 7; file++) { // Skip corner rooks
    const piece = gameState.board[backRank][file];
    if (piece && isPieceOwnedBy(piece, player) && 
        (piece.includes('Knight') || piece.includes('Bishop'))) {
      score -= 25;
    }
  }
  
  return score;
}

function evaluateMiddlegameFactors(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  
  // Enhanced center control evaluation
  const centerSquares = [
    { rank: 3, file: 3 }, { rank: 3, file: 4 },
    { rank: 4, file: 3 }, { rank: 4, file: 4 }
  ];
  
  centerSquares.forEach(square => {
    const piece = gameState.board[square.rank][square.file];
    if (piece && isPieceOwnedBy(piece, player)) {
      score += 30; // Higher bonus for center control in middlegame
    }
  });
  
  return score;
}

function evaluateEndgameFactors(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  
  // Find king position for activity evaluation
  let kingRank = -1, kingFile = -1;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && piece.includes('King') && isPieceOwnedBy(piece, player)) {
        kingRank = rank;
        kingFile = file;
        break;
      }
    }
  }
  
  if (kingRank !== -1) {
    // Bonus for active king (closer to center)
    const distanceFromCenter = Math.abs(kingRank - 3.5) + Math.abs(kingFile - 3.5);
    score += (7 - distanceFromCenter) * 5;
  }
  
  return score;
}

/**
 * Évalue le matériel sur l'échiquier (legacy function for compatibility)
 */
function evaluateMaterial(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece) {
        const value = getPieceValue(piece);
        if (isPieceOwnedBy(piece, player)) {
          score += value;
        } else {
          score -= value;
        }
      }
    }
  }
  
  return score;
}

/**
 * Simple evaluation function for backward compatibility
 */
export function evaluatePositionSimple(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  
  // 1. Évaluation matérielle sur l'échiquier
  score += evaluateMaterial(gameState, player);
  
  // 2. Évaluation de la réserve
  score += evaluateReserve(gameState, player);
  
  // 3. Évaluation de la sécurité du roi
  score += evaluateKingSafety(gameState, player);
  
  // 4. Contrôle du centre
  score += evaluateCenterControl(gameState, player);
  
  // 5. Développement des pièces
  score += evaluateDevelopment(gameState, player);
  
  return score;
}

/**
 * Évalue la valeur de la réserve
 */
function evaluateReserve(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  const reserve = player === 'white' ? gameState.whiteReserve : gameState.blackReserve;
  let score = 0;
  
  // Les pièces en réserve valent moins que sur l'échiquier (facteur 0.5)
  score += reserve.pawns * 50;
  score += reserve.knights * 150;
  score += reserve.bishops * 150;
  score += reserve.rooks * 250;
  score += reserve.queens * 450;
  
  return score;
}

/**
 * Évalue la sécurité du roi
 */
function evaluateKingSafety(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // Pendant la phase de setup, pas d'évaluation d'échec
  if (gameState.gamePhase === 'setup') {
    return 0;
  }
  
  try {
    const chessBoard = convertToChessBoard(gameState);
    const playerGroup = player === 'white' ? 2 : 3;
    const opponentGroup = player === 'white' ? 3 : 2;
    
    // Vérifier échec et mat
    if (chessIsCheckmate(chessBoard, playerGroup)) {
      return -50000; // Très mauvais - défaite
    }
    
    if (chessIsCheckmate(chessBoard, opponentGroup)) {
      return 50000; // Excellent - victoire !
    }
    
    // Vérifier échec
    if (chessIsInCheck(chessBoard, playerGroup)) {
      return -500; // Mauvais mais pas fatal
    }
    
    if (chessIsInCheck(chessBoard, opponentGroup)) {
      return 200; // Bon - l'adversaire est en échec
    }
  } catch (error) {
    // Si erreur de conversion, ignorer cette évaluation
    return 0;
  }
  
  return 0;
}

/**
 * Contrôle du centre (legacy function)
 */
function evaluateCenterControl(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // Cases centrales (d4, e4, d5, e5 en notation)
  const centerSquares = [
    { x: 3, y: 3 }, // d4
    { x: 4, y: 3 }, // e4
    { x: 3, y: 4 }, // d5
    { x: 4, y: 4 }  // e5
  ];
  
  let score = 0;
  
  centerSquares.forEach(square => {
    const piece = gameState.board[square.y][square.x];
    if (piece && isPieceOwnedBy(piece, player)) {
      score += 20;
    }
  });
  
  return score;
}

/**
 * Développement des pièces (legacy function)
 */
function evaluateDevelopment(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  const backRank = player === 'white' ? 0 : 7;
  
  // Pénaliser les pièces mineures encore sur la rangée de départ
  for (let file = 0; file < 8; file++) {
    const piece = gameState.board[backRank][file];
    if (piece && isPieceOwnedBy(piece, player) && 
        (piece.includes('Knight') || piece.includes('Bishop'))) {
      score -= 30; // Pénalité pour non-développement
    }
  }
  
  return score;
}

/**
 * Obtient la valeur d'une pièce
 */
function getPieceValue(piece: string): number {
  for (const [type, value] of Object.entries(PIECE_VALUES)) {
    if (piece.includes(type)) {
      return value;
    }
  }
  return 0;
}

/**
 * Vérifie si une pièce appartient au joueur
 */
function isPieceOwnedBy(piece: string, player: 'white' | 'black'): boolean {
  if (player === 'white') {
    return piece.includes('White');
  } else {
    return piece.includes('Black');
  }
}
