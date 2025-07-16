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

/**
 * Évalue la position pour un joueur donné
 */
export function evaluatePosition(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
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
 * Évalue le matériel sur l'échiquier
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
 * Évalue le contrôle du centre
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
 * Évalue le développement des pièces
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
