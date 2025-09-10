import { SecretKingBootGameState, Reserve } from '../types';
import { convertToChessBoard } from '../gameLogic';
import { 
  isInCheck as chessIsInCheck, 
  isCheckmate as chessIsCheckmate, 
  GameState as ChessGameState 
} from '../../logic';

// Enhanced piece values with positional considerations
const PIECE_VALUES = {
  'Pawn': 100,
  'Knight': 320,
  'Bishop': 330,
  'Rook': 500,
  'Queen': 900,
  'King': 10000
};

// Piece-square tables for positional evaluation
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
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
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [0,  0,  0,  5,  5,  0,  0,  0]
];

const QUEEN_TABLE = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [-5,  0,  5,  5,  5,  5,  0, -5],
  [0,  0,  5,  5,  5,  5,  0, -5],
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
  [20, 20,  0,  0,  0,  0, 20, 20],
  [20, 30, 10,  0,  0, 10, 30, 20]
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
 * Advanced position evaluation with multiple factors
 */
export function evaluatePositionAdvanced(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let score = 0;
  const isEndgame = isEndgamePhase(gameState);
  
  // 1. Material and positional evaluation
  score += evaluateMaterialAndPosition(gameState, player, isEndgame);
  
  // 2. Reserve evaluation with strategic weighting
  score += evaluateReserveAdvanced(gameState, player);
  
  // 3. King safety (critical in this variant)
  score += evaluateKingSafetyAdvanced(gameState, player);
  
  // 4. Piece mobility and activity
  score += evaluatePieceMobility(gameState, player);
  
  // 5. Pawn structure
  score += evaluatePawnStructure(gameState, player);
  
  // 6. Control of key squares
  score += evaluateKeySquares(gameState, player);
  
  // 7. Tactical patterns
  score += evaluateTacticalPatterns(gameState, player);
  
  return score;
}

/**
 * Enhanced material evaluation with piece-square tables
 */
function evaluateMaterialAndPosition(gameState: SecretKingBootGameState, player: 'white' | 'black', isEndgame: boolean): number {
  let score = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece) {
        const materialValue = getPieceValue(piece);
        const positionalValue = getPieceSquareValue(piece, rank, file, isEndgame);
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
 * Advanced reserve evaluation considering game phase
 */
function evaluateReserveAdvanced(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  const reserve = player === 'white' ? gameState.whiteReserve : gameState.blackReserve;
  let score = 0;
  
  // Dynamic weighting based on game phase
  const isEndgame = isEndgamePhase(gameState);
  const reserveMultiplier = isEndgame ? 0.3 : 0.6; // Less valuable in endgame
  
  // Strategic piece values in reserve
  score += reserve.pawns * 60 * reserveMultiplier;
  score += reserve.knights * 180 * reserveMultiplier;
  score += reserve.bishops * 190 * reserveMultiplier;
  score += reserve.rooks * 280 * reserveMultiplier;
  score += reserve.queens * 480 * reserveMultiplier;
  
  // Bonus for piece diversity in reserve
  const pieceTypes = [
    reserve.knights > 0 ? 1 : 0,
    reserve.bishops > 0 ? 1 : 0,
    reserve.rooks > 0 ? 1 : 0,
    reserve.queens > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0);
  
  score += pieceTypes * 15; // Diversity bonus
  
  return score;
}

/**
 * Enhanced king safety evaluation
 */
function evaluateKingSafetyAdvanced(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // During setup phase, no check evaluation
  if (gameState.gamePhase === 'setup') {
    return 0;
  }
  
  try {
    const chessBoard = convertToChessBoard(gameState);
    const playerGroup = player === 'white' ? 2 : 3;
    const opponentGroup = player === 'white' ? 3 : 2;
    
    // Checkmate evaluation
    if (chessIsCheckmate(chessBoard, playerGroup)) {
      return -100000; // Game over
    }
    
    if (chessIsCheckmate(chessBoard, opponentGroup)) {
      return 100000; // Victory!
    }
    
    // Check evaluation
    if (chessIsInCheck(chessBoard, playerGroup)) {
      return -800; // Serious penalty for being in check
    }
    
    if (chessIsInCheck(chessBoard, opponentGroup)) {
      return 300; // Bonus for giving check
    }
    
    // King safety based on surrounding pieces
    return evaluateKingShield(gameState, player);
    
  } catch (error) {
    return 0;
  }
}

/**
 * Evaluate king shield (pieces around the king)
 */
function evaluateKingShield(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  const kingPos = findKingPosition(gameState, player);
  if (!kingPos) return 0;
  
  let shieldScore = 0;
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  directions.forEach(([dr, dc]) => {
    const newRank = kingPos.rank + dr;
    const newFile = kingPos.file + dc;
    
    if (newRank >= 0 && newRank < 8 && newFile >= 0 && newFile < 8) {
      const piece = gameState.board[newRank][newFile];
      if (piece && isPieceOwnedBy(piece, player)) {
        shieldScore += 20; // Bonus for friendly pieces near king
      }
    }
  });
  
  return shieldScore;
}

/**
 * Evaluate piece mobility
 */
function evaluatePieceMobility(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // Simplified mobility evaluation
  // In a full implementation, this would count legal moves for each piece
  let mobilityScore = 0;
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && isPieceOwnedBy(piece, player)) {
        // Bonus for pieces in central positions (higher mobility)
        if (rank >= 2 && rank <= 5 && file >= 2 && file <= 5) {
          mobilityScore += getPieceMobilityBonus(piece);
        }
      }
    }
  }
  
  return mobilityScore;
}

/**
 * Evaluate pawn structure
 */
function evaluatePawnStructure(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let pawnScore = 0;
  const playerPawns = [];
  
  // Find all player pawns
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && piece.includes('Pawn') && isPieceOwnedBy(piece, player)) {
        playerPawns.push({ rank, file });
      }
    }
  }
  
  // Evaluate pawn structure patterns
  playerPawns.forEach(pawn => {
    // Passed pawn bonus
    if (isPassedPawn(gameState, pawn.rank, pawn.file, player)) {
      pawnScore += 50;
    }
    
    // Doubled pawn penalty
    if (isDoubledPawn(playerPawns, pawn.file)) {
      pawnScore -= 20;
    }
    
    // Isolated pawn penalty
    if (isIsolatedPawn(playerPawns, pawn.file)) {
      pawnScore -= 15;
    }
  });
  
  return pawnScore;
}

/**
 * Evaluate control of key squares
 */
function evaluateKeySquares(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // Center squares and key strategic squares
  const keySquares = [
    { rank: 3, file: 3 }, { rank: 3, file: 4 }, // d4, e4
    { rank: 4, file: 3 }, { rank: 4, file: 4 }  // d5, e5
  ];
  
  let keySquareScore = 0;
  
  keySquares.forEach(square => {
    const piece = gameState.board[square.rank][square.file];
    if (piece && isPieceOwnedBy(piece, player)) {
      keySquareScore += 30;
    }
  });
  
  return keySquareScore;
}

/**
 * Evaluate tactical patterns
 */
function evaluateTacticalPatterns(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  let tacticalScore = 0;
  
  // Look for basic tactical patterns
  // Fork opportunities
  tacticalScore += evaluateForkOpportunities(gameState, player);
  
  // Pin patterns
  tacticalScore += evaluatePinPatterns(gameState, player);
  
  return tacticalScore;
}

// Helper functions

function getPieceValue(piece: string): number {
  for (const [type, value] of Object.entries(PIECE_VALUES)) {
    if (piece.includes(type)) {
      return value;
    }
  }
  return 0;
}

function getPieceSquareValue(piece: string, rank: number, file: number, isEndgame: boolean): number {
  // Flip rank for black pieces
  const adjustedRank = piece.includes('Black') ? 7 - rank : rank;
  
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
    return isEndgame ? KING_TABLE_ENDGAME[adjustedRank][file] : KING_TABLE_MIDDLEGAME[adjustedRank][file];
  }
  
  return 0;
}

function isPieceOwnedBy(piece: string, player: 'white' | 'black'): boolean {
  if (player === 'white') {
    return piece.includes('White');
  } else {
    return piece.includes('Black');
  }
}

function isEndgamePhase(gameState: SecretKingBootGameState): boolean {
  // Simple endgame detection: few pieces on board
  let pieceCount = 0;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      if (gameState.board[rank][file]) {
        pieceCount++;
      }
    }
  }
  return pieceCount <= 12; // Endgame if 12 or fewer pieces
}

function findKingPosition(gameState: SecretKingBootGameState, player: 'white' | 'black'): { rank: number, file: number } | null {
  const kingPiece = player === 'white' ? 'WhiteKing' : 'BlackKing';
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece && piece.includes('King') && piece.includes(player === 'white' ? 'White' : 'Black')) {
        return { rank, file };
      }
    }
  }
  return null;
}

function getPieceMobilityBonus(piece: string): number {
  if (piece.includes('Queen')) return 15;
  if (piece.includes('Rook')) return 10;
  if (piece.includes('Bishop')) return 8;
  if (piece.includes('Knight')) return 6;
  return 0;
}

function isPassedPawn(gameState: SecretKingBootGameState, rank: number, file: number, player: 'white' | 'black'): boolean {
  // Simplified passed pawn detection
  const direction = player === 'white' ? 1 : -1;
  const opponentColor = player === 'white' ? 'Black' : 'White';
  
  // Check if there are no opponent pawns in front or on adjacent files
  for (let checkRank = rank + direction; checkRank >= 0 && checkRank < 8; checkRank += direction) {
    for (let checkFile = Math.max(0, file - 1); checkFile <= Math.min(7, file + 1); checkFile++) {
      const piece = gameState.board[checkRank][checkFile];
      if (piece && piece.includes('Pawn') && piece.includes(opponentColor)) {
        return false;
      }
    }
  }
  return true;
}

function isDoubledPawn(pawns: Array<{ rank: number, file: number }>, file: number): boolean {
  return pawns.filter(p => p.file === file).length > 1;
}

function isIsolatedPawn(pawns: Array<{ rank: number, file: number }>, file: number): boolean {
  return !pawns.some(p => p.file === file - 1 || p.file === file + 1);
}

function evaluateForkOpportunities(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // Simplified fork detection - would need full move generation in real implementation
  return 0;
}

function evaluatePinPatterns(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
  // Simplified pin detection - would need full analysis in real implementation
  return 0;
}