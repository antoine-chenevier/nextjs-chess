// Types et interfaces pour la variante "La botte secrète du roi"
import { Board, Piece, GameState as ChessGameState, CompleteGameState } from '../logic/index';

export interface Reserve {
  pawns: number;
  knights: number;
  bishops: number;
  rooks: number;
  queens: number;
}

export interface SecretKingBootGameState {
  // État du jeu classique
  currentPlayer: 'white' | 'black';
  turn: number;
  gamePhase: 'setup' | 'playing' | 'ended';
  
  // Statut de la partie (échec, échec et mat, etc.)
  gameStatus?: {
    status: 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';
    player?: 'white' | 'black';
    winner?: 'white' | 'black' | 'draw';
    reason?: string; // Raison de la fin de partie
  };
  
  // Réserves des joueurs
  whiteReserve: Reserve;
  blackReserve: Reserve;
  
  // Position des rois (peut être D1/E1 pour blanc, D8/E8 pour noir)
  whiteKingPosition: 'D1' | 'E1' | null;
  blackKingPosition: 'D8' | 'E8' | null;
  
  // Historique des actions pour validation
  moveHistory: GameAction[];
  
  // État de l'échiquier (hérité du jeu classique mais adapté)
  board: (string | null)[][]; // 8x8, null = case vide
  
  // Intégration avec la logique d'échecs classique
  chessBoard?: Board; // Représentation compatible avec la logique d'échecs
  chessGameState?: ChessGameState;
  completeGameState?: CompleteGameState;
}

export type ActionType = 
  | 'place_king'           // Placer le roi initial
  | 'generate_pawn'        // Générer un pion en réserve
  | 'move_piece'           // Déplacer une pièce sur l'échiquier
  | 'move_king_and_place'  // Déplacer le roi ET placer une pièce
  | 'exchange_pieces'      // Échanger des pions contre une autre pièce
  | 'promote_pawn'         // Promotion classique d'un pion
  | 'place_piece';         // Placer une pièce de la réserve sur l'échiquier

export interface GameAction {
  type: ActionType;
  player: 'white' | 'black';
  turn: number;
  
  // Paramètres selon l'action
  from?: string;           // Position de départ (notation algébrique)
  to?: string;             // Position d'arrivée
  piece?: string;          // Type de pièce concernée
  exchangeFrom?: string;   // Type de pièce échangée
  exchangeTo?: string;     // Type de pièce obtenue
  cost?: number;           // Coût en pions pour l'échange
}

// Contraintes de la réserve
export const RESERVE_LIMITS: Reserve = {
  pawns: 8,
  knights: 1,
  bishops: 1,
  rooks: 1,
  queens: 0 // Sauf promotion
};

// Coûts d'échange (en pions)
// Note: Les dames ne peuvent être obtenues que par promotion, pas par échange
export const EXCHANGE_COSTS = {
  knight: 2,
  bishop: 3,
  rook: 4
  // queen: pas d'échange possible, promotion uniquement
} as const;

// Positions valides pour les rois
export const VALID_KING_POSITIONS = {
  white: ['D1', 'E1'] as const,
  black: ['D8', 'E8'] as const
} as const;

// Zones de placement des pions (rangs où les rois peuvent placer des pions)
export const PAWN_ZONES = {
  white: [1, 2, 3, 4], // Rangs 1-4 (moitié blanche de l'échiquier)
  black: [5, 6, 7, 8]  // Rangs 5-8 (moitié noire de l'échiquier)
} as const;

// Ligne médiane de l'échiquier pour les règles de mouvement des pions
export const MIDDLE_LINE = {
  white: 4, // Rang 5 (après lequel les pions blancs ne peuvent plus faire de grands bonds)
  black: 3  // Rang 4 (après lequel les pions noirs ne peuvent plus faire de grands bonds)
} as const;
