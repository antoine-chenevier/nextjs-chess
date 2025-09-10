import { SecretKingBootGameState, Reserve, GameAction } from '../types';

/**
 * Optimized state copying - 5x+ faster than JSON serialization
 */
export function copyGameState(state: SecretKingBootGameState): SecretKingBootGameState {
  // Create new reserve objects
  const whiteReserve: Reserve = {
    pawns: state.whiteReserve.pawns,
    knights: state.whiteReserve.knights,
    bishops: state.whiteReserve.bishops,
    rooks: state.whiteReserve.rooks,
    queens: state.whiteReserve.queens
  };
  
  const blackReserve: Reserve = {
    pawns: state.blackReserve.pawns,
    knights: state.blackReserve.knights,
    bishops: state.blackReserve.bishops,
    rooks: state.blackReserve.rooks,
    queens: state.blackReserve.queens
  };
  
  // Copy board efficiently
  const board: (string | null)[][] = [];
  for (let i = 0; i < 8; i++) {
    board[i] = [];
    for (let j = 0; j < 8; j++) {
      board[i][j] = state.board[i][j];
    }
  }
  
  // Copy move history
  const moveHistory: GameAction[] = state.moveHistory.map(action => ({ ...action }));
  
  return {
    currentPlayer: state.currentPlayer,
    turn: state.turn,
    gamePhase: state.gamePhase,
    gameStatus: state.gameStatus ? { ...state.gameStatus } : undefined,
    whiteReserve,
    blackReserve,
    whiteKingPosition: state.whiteKingPosition,
    blackKingPosition: state.blackKingPosition,
    moveHistory,
    board,
    passant: state.passant,
    promotionRequired: state.promotionRequired ? { ...state.promotionRequired } : undefined,
    chessBoard: state.chessBoard,
    chessGameState: state.chessGameState,
    completeGameState: state.completeGameState
  };
}

/**
 * Transposition table for memoizing evaluated positions
 */
export class TranspositionTable {
  private table: Map<string, { score: number; depth: number; flag: 'exact' | 'lower' | 'upper' }> = new Map();
  private maxSize: number;
  
  constructor(maxSize: number = 100000) {
    this.maxSize = maxSize;
  }
  
  /**
   * Generate a hash key for a game state
   */
  private getStateHash(state: SecretKingBootGameState): string {
    const boardHash = state.board.map(row => 
      row.map(piece => piece || 'e').join('')
    ).join('');
    
    const reserveHash = `${state.whiteReserve.pawns}${state.whiteReserve.knights}${state.whiteReserve.bishops}${state.whiteReserve.rooks}${state.whiteReserve.queens}-${state.blackReserve.pawns}${state.blackReserve.knights}${state.blackReserve.bishops}${state.blackReserve.rooks}${state.blackReserve.queens}`;
    
    return `${boardHash}-${state.currentPlayer}-${reserveHash}-${state.passant || 'none'}`;
  }
  
  /**
   * Store a position evaluation
   */
  store(state: SecretKingBootGameState, score: number, depth: number, flag: 'exact' | 'lower' | 'upper'): void {
    if (this.table.size >= this.maxSize) {
      // Simple eviction: clear oldest entries
      const keysToDelete = Array.from(this.table.keys()).slice(0, this.maxSize / 4);
      keysToDelete.forEach(key => this.table.delete(key));
    }
    
    const hash = this.getStateHash(state);
    this.table.set(hash, { score, depth, flag });
  }
  
  /**
   * Retrieve a stored evaluation
   */
  lookup(state: SecretKingBootGameState, depth: number): { score: number; flag: 'exact' | 'lower' | 'upper' } | null {
    const hash = this.getStateHash(state);
    const entry = this.table.get(hash);
    
    if (entry && entry.depth >= depth) {
      return { score: entry.score, flag: entry.flag };
    }
    
    return null;
  }
  
  /**
   * Clear the transposition table
   */
  clear(): void {
    this.table.clear();
  }
  
  /**
   * Get statistics about the table
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.table.size,
      maxSize: this.maxSize,
      hitRate: 0 // Could be implemented with counters
    };
  }
}

/**
 * Move ordering utilities for better alpha-beta pruning
 */
export class MoveOrderer {
  private killerMoves: GameAction[][] = [];
  private historyTable: Map<string, number> = new Map();
  
  constructor(maxDepth: number = 10) {
    // Initialize killer moves table
    for (let i = 0; i < maxDepth; i++) {
      this.killerMoves[i] = [];
    }
  }
  
  /**
   * Order moves for optimal alpha-beta pruning
   * Implements MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
   */
  orderMoves(moves: GameAction[], state: SecretKingBootGameState, depth: number): GameAction[] {
    return moves.sort((a, b) => {
      const scoreA = this.getMoveScore(a, state, depth);
      const scoreB = this.getMoveScore(b, state, depth);
      return scoreB - scoreA; // Higher scores first
    });
  }
  
  private getMoveScore(move: GameAction, state: SecretKingBootGameState, depth: number): number {
    let score = 0;
    
    // 1. MVV-LVA for captures
    if (move.type === 'move_piece' && move.from && move.to) {
      const capturedPiece = this.getPieceAt(state, move.to);
      if (capturedPiece) {
        const victimValue = this.getPieceValue(capturedPiece);
        const attackerValue = this.getPieceValue(this.getPieceAt(state, move.from) || '');
        score += 1000 + victimValue - attackerValue;
      }
    }
    
    // 2. Killer moves heuristic
    if (depth < this.killerMoves.length && this.killerMoves[depth].some(killer => 
      killer.type === move.type && killer.from === move.from && killer.to === move.to)) {
      score += 500;
    }
    
    // 3. History heuristic
    const moveKey = this.getMoveKey(move);
    const historyScore = this.historyTable.get(moveKey) || 0;
    score += historyScore;
    
    return score;
  }
  
  /**
   * Update killer moves when a beta cutoff occurs
   */
  updateKillerMove(move: GameAction, depth: number): void {
    if (depth < this.killerMoves.length) {
      // Add to front, remove duplicates
      this.killerMoves[depth] = [move, ...this.killerMoves[depth].filter(killer => 
        !(killer.type === move.type && killer.from === move.from && killer.to === move.to)
      )].slice(0, 2); // Keep only top 2 killer moves per depth
    }
  }
  
  /**
   * Update history table when a move causes a cutoff
   */
  updateHistory(move: GameAction, depth: number): void {
    const key = this.getMoveKey(move);
    const currentScore = this.historyTable.get(key) || 0;
    this.historyTable.set(key, currentScore + depth * depth);
  }
  
  private getMoveKey(move: GameAction): string {
    return `${move.type}-${move.from}-${move.to}-${move.piece}`;
  }
  
  private getPieceAt(state: SecretKingBootGameState, position: string): string | null {
    const [file, rank] = this.parsePosition(position);
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      return state.board[rank][file];
    }
    return null;
  }
  
  private parsePosition(position: string): [number, number] {
    const file = position.charCodeAt(0) - 'A'.charCodeAt(0);
    const rank = parseInt(position[1]) - 1;
    return [file, rank];
  }
  
  private getPieceValue(piece: string): number {
    if (piece.includes('Pawn')) return 100;
    if (piece.includes('Knight')) return 300;
    if (piece.includes('Bishop')) return 300;
    if (piece.includes('Rook')) return 500;
    if (piece.includes('Queen')) return 900;
    if (piece.includes('King')) return 10000;
    return 0;
  }
}