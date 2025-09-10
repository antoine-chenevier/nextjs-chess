import { Bot, BotConfig, BotDifficulty, BotMove } from './types';
import { SecretKingBootGameState, GameAction, ActionType } from '../types';
import { getAvailableActions, getPossibleMoves } from '../gameAnalysis';
import { evaluatePositionAdvanced } from './advancedEvaluation';
import { applyAction } from '../gameActions';

// Transposition table entry
interface TranspositionEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'lower' | 'upper';
  bestMove?: GameAction;
}

// Move ordering scores
interface MoveScore {
  action: GameAction;
  score: number;
}

export class AdvancedBot implements Bot {
  private config: BotConfig;
  private transpositionTable: Map<string, TranspositionEntry> = new Map();
  private killerMoves: GameAction[][] = []; // [depth][move]
  private historyTable: Map<string, number> = new Map();
  private nodes: number = 0;

  constructor(config: BotConfig) {
    this.config = config;
    this.initializeKillerMoves();
  }

  async makeMove(gameState: SecretKingBootGameState): Promise<GameAction> {
    const startTime = Date.now();
    this.nodes = 0;
    
    // Clear transposition table periodically to avoid memory issues
    if (this.transpositionTable.size > 100000) {
      this.transpositionTable.clear();
    }

    const availableActionTypes = getAvailableActions(gameState);
    
    if (availableActionTypes.length === 0) {
      throw new Error('Aucune action possible');
    }

    const allPossibleActions = this.getAllPossibleActions(gameState, availableActionTypes);

    if (allPossibleActions.length === 0) {
      throw new Error('Aucun mouvement possible');
    }

    switch (this.config.difficulty) {
      case BotDifficulty.EASY:
        return this.makeRandomMove(allPossibleActions);
      case BotDifficulty.MEDIUM:
        return this.makeEnhancedGreedyMove(gameState, allPossibleActions, startTime);
      case BotDifficulty.HARD:
        return this.makeIterativeDeepeningMove(gameState, allPossibleActions, startTime);
      default:
        return this.makeRandomMove(allPossibleActions);
    }
  }

  /**
   * Enhanced greedy strategy with basic move ordering
   */
  private makeEnhancedGreedyMove(
    gameState: SecretKingBootGameState, 
    possibleActions: GameAction[],
    startTime: number
  ): GameAction {
    const orderedMoves = this.orderMoves(gameState, possibleActions);
    let bestAction = orderedMoves[0].action;
    let bestScore = -Infinity;

    for (const moveScore of orderedMoves) {
      // Time management
      if (Date.now() - startTime > this.config.thinkingTime * 0.8) {
        break;
      }

      try {
        const newState = this.copyGameState(gameState);
        const resultState = applyAction(newState, moveScore.action);
        
        if (resultState) {
          const score = evaluatePositionAdvanced(resultState, gameState.currentPlayer);
          
          // Add randomness for unpredictability
          const randomBonus = (Math.random() - 0.5) * this.config.randomness * 50;
          const adjustedScore = score + randomBonus;
          
          if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestAction = moveScore.action;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return bestAction;
  }

  /**
   * Iterative deepening minimax with advanced optimizations
   */
  private makeIterativeDeepeningMove(
    gameState: SecretKingBootGameState, 
    possibleActions: GameAction[],
    startTime: number
  ): GameAction {
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;
    const maxDepth = 6; // Maximum search depth
    const timeLimit = this.config.thinkingTime;

    // Iterative deepening
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() - startTime > timeLimit * 0.8) {
        break; // Time management
      }

      try {
        const result = this.alphaBetaRoot(gameState, depth, -Infinity, Infinity, startTime, timeLimit);
        
        if (result) {
          bestAction = result.action;
          bestScore = result.score;
          
          // If we found a winning move, stop searching
          if (bestScore > 50000) {
            break;
          }
        }
      } catch (error) {
        // If search was interrupted, use the best move from previous iteration
        break;
      }
    }

    console.log(`Advanced bot searched ${this.nodes} nodes, depth reached: ${Math.min(maxDepth, 6)}`);
    return bestAction;
  }

  /**
   * Alpha-beta root search
   */
  private alphaBetaRoot(
    gameState: SecretKingBootGameState,
    depth: number,
    alpha: number,
    beta: number,
    startTime: number,
    timeLimit: number
  ): BotMove | null {
    const availableActionTypes = getAvailableActions(gameState);
    const allPossibleActions = this.getAllPossibleActions(gameState, availableActionTypes);
    const orderedMoves = this.orderMoves(gameState, allPossibleActions);
    
    let bestAction = orderedMoves[0].action;
    let bestScore = -Infinity;

    for (const moveScore of orderedMoves) {
      // Time check
      if (Date.now() - startTime > timeLimit * 0.9) {
        break;
      }

      try {
        const newState = this.copyGameState(gameState);
        const resultState = applyAction(newState, moveScore.action);
        
        if (resultState) {
          const score = this.alphaBeta(
            resultState, 
            depth - 1, 
            -beta, 
            -alpha, 
            false,
            startTime,
            timeLimit
          );

          if (score > bestScore) {
            bestScore = score;
            bestAction = moveScore.action;
            alpha = Math.max(alpha, score);
          }

          if (beta <= alpha) {
            // Store killer move
            this.storeKillerMove(depth, moveScore.action);
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return { action: bestAction, score: bestScore };
  }

  /**
   * Enhanced alpha-beta search with multiple optimizations
   */
  private alphaBeta(
    gameState: SecretKingBootGameState,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    startTime: number,
    timeLimit: number
  ): number {
    this.nodes++;

    // Time check
    if (Date.now() - startTime > timeLimit * 0.95) {
      throw new Error('Time limit exceeded');
    }

    // Terminal node or depth limit reached
    if (depth === 0) {
      return this.quiescenceSearch(gameState, alpha, beta, 3, isMaximizing);
    }

    // Transposition table lookup
    const stateKey = this.getStateKey(gameState);
    const ttEntry = this.transpositionTable.get(stateKey);
    
    if (ttEntry && ttEntry.depth >= depth) {
      if (ttEntry.flag === 'exact') {
        return ttEntry.score;
      } else if (ttEntry.flag === 'lower' && ttEntry.score >= beta) {
        return beta;
      } else if (ttEntry.flag === 'upper' && ttEntry.score <= alpha) {
        return alpha;
      }
    }

    const availableActionTypes = getAvailableActions(gameState);
    const allPossibleActions = this.getAllPossibleActions(gameState, availableActionTypes);
    
    if (allPossibleActions.length === 0) {
      return evaluatePositionAdvanced(gameState, gameState.currentPlayer);
    }

    // Move ordering
    const orderedMoves = this.orderMoves(gameState, allPossibleActions);
    
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let bestMove: GameAction | undefined;
    let flag: 'exact' | 'lower' | 'upper' = 'upper';

    for (const moveScore of orderedMoves) {
      try {
        const newState = this.copyGameState(gameState);
        const resultState = applyAction(newState, moveScore.action);
        
        if (resultState) {
          const score = this.alphaBeta(
            resultState,
            depth - 1,
            alpha,
            beta,
            !isMaximizing,
            startTime,
            timeLimit
          );

          if (isMaximizing) {
            if (score > bestScore) {
              bestScore = score;
              bestMove = moveScore.action;
            }
            alpha = Math.max(alpha, score);
          } else {
            if (score < bestScore) {
              bestScore = score;
              bestMove = moveScore.action;
            }
            beta = Math.min(beta, score);
          }

          if (beta <= alpha) {
            // Store killer move and history
            this.storeKillerMove(depth, moveScore.action);
            this.updateHistoryTable(moveScore.action, depth);
            flag = isMaximizing ? 'lower' : 'upper';
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Store in transposition table
    if (bestScore > (isMaximizing ? -Infinity : Infinity)) {
      if (bestScore <= alpha) {
        flag = 'upper';
      } else if (bestScore >= beta) {
        flag = 'lower';
      } else {
        flag = 'exact';
      }

      this.transpositionTable.set(stateKey, {
        depth,
        score: bestScore,
        flag,
        bestMove
      });
    }

    return bestScore;
  }

  /**
   * Quiescence search for tactical accuracy
   */
  private quiescenceSearch(
    gameState: SecretKingBootGameState,
    alpha: number,
    beta: number,
    depth: number,
    isMaximizing: boolean
  ): number {
    this.nodes++;

    const standPat = evaluatePositionAdvanced(gameState, gameState.currentPlayer);
    
    if (depth === 0) {
      return standPat;
    }

    if (isMaximizing) {
      if (standPat >= beta) {
        return beta;
      }
      alpha = Math.max(alpha, standPat);
    } else {
      if (standPat <= alpha) {
        return alpha;
      }
      beta = Math.min(beta, standPat);
    }

    // Only search "quiet" moves (captures, checks) in quiescence
    const tacticalMoves = this.getTacticalMoves(gameState);
    
    for (const move of tacticalMoves) {
      try {
        const newState = this.copyGameState(gameState);
        const resultState = applyAction(newState, move);
        
        if (resultState) {
          const score = this.quiescenceSearch(resultState, alpha, beta, depth - 1, !isMaximizing);
          
          if (isMaximizing) {
            alpha = Math.max(alpha, score);
          } else {
            beta = Math.min(beta, score);
          }
          
          if (beta <= alpha) {
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    return isMaximizing ? alpha : beta;
  }

  /**
   * Advanced move ordering for better alpha-beta pruning
   */
  private orderMoves(gameState: SecretKingBootGameState, moves: GameAction[]): MoveScore[] {
    const moveScores: MoveScore[] = [];

    for (const move of moves) {
      let score = 0;

      // 1. Transposition table move
      const stateKey = this.getStateKey(gameState);
      const ttEntry = this.transpositionTable.get(stateKey);
      if (ttEntry?.bestMove && this.areMovesEqual(move, ttEntry.bestMove)) {
        score += 10000;
      }

      // 2. Captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker)
      if (move.type === 'move_piece') {
        const captureScore = this.getCaptureScore(gameState, move);
        score += captureScore;
      }

      // 3. Killer moves
      const killerScore = this.getKillerMoveScore(move);
      score += killerScore;

      // 4. History heuristic
      const historyScore = this.getHistoryScore(move);
      score += historyScore;

      // 5. Positional bonus for central moves
      if (move.to && this.isCentralSquare(move.to)) {
        score += 50;
      }

      moveScores.push({ action: move, score });
    }

    // Sort by score (highest first)
    return moveScores.sort((a, b) => b.score - a.score);
  }

  // Helper methods

  private getAllPossibleActions(gameState: SecretKingBootGameState, actionTypes: ActionType[]): GameAction[] {
    const allActions: GameAction[] = [];
    for (const actionType of actionTypes) {
      const actionsOfType = getPossibleMoves(gameState, actionType);
      allActions.push(...actionsOfType);
    }
    return allActions;
  }

  private makeRandomMove(possibleActions: GameAction[]): GameAction {
    const randomIndex = Math.floor(Math.random() * possibleActions.length);
    return possibleActions[randomIndex];
  }

  private copyGameState(gameState: SecretKingBootGameState): SecretKingBootGameState {
    // Optimized copying - avoid JSON.parse/stringify for better performance
    return {
      ...gameState,
      board: gameState.board.map(row => [...row]),
      whiteReserve: { ...gameState.whiteReserve },
      blackReserve: { ...gameState.blackReserve },
      moveHistory: [...gameState.moveHistory],
      gameStatus: gameState.gameStatus ? { ...gameState.gameStatus } : undefined,
      promotionRequired: gameState.promotionRequired ? { ...gameState.promotionRequired } : undefined
    };
  }

  private getStateKey(gameState: SecretKingBootGameState): string {
    // Create a unique key for the game state for transposition table
    const boardStr = gameState.board.map(row => row.join(',')).join('|');
    const reserveStr = `${gameState.whiteReserve.pawns}-${gameState.whiteReserve.knights}-${gameState.whiteReserve.bishops}-${gameState.whiteReserve.rooks}-${gameState.whiteReserve.queens}|${gameState.blackReserve.pawns}-${gameState.blackReserve.knights}-${gameState.blackReserve.bishops}-${gameState.blackReserve.rooks}-${gameState.blackReserve.queens}`;
    return `${boardStr}|${reserveStr}|${gameState.currentPlayer}|${gameState.passant || 'none'}`;
  }

  private initializeKillerMoves(): void {
    for (let i = 0; i < 20; i++) { // Support up to depth 20
      this.killerMoves[i] = [];
    }
  }

  private storeKillerMove(depth: number, move: GameAction): void {
    if (depth < this.killerMoves.length) {
      // Remove if already exists
      this.killerMoves[depth] = this.killerMoves[depth].filter(
        km => !this.areMovesEqual(km, move)
      );
      
      // Add to front and limit to 2 killer moves per depth
      this.killerMoves[depth].unshift(move);
      if (this.killerMoves[depth].length > 2) {
        this.killerMoves[depth].pop();
      }
    }
  }

  private getKillerMoveScore(move: GameAction): number {
    for (let depth = 0; depth < this.killerMoves.length; depth++) {
      for (let i = 0; i < this.killerMoves[depth].length; i++) {
        if (this.areMovesEqual(move, this.killerMoves[depth][i])) {
          return 1000 - i * 100; // First killer move gets higher score
        }
      }
    }
    return 0;
  }

  private updateHistoryTable(move: GameAction, depth: number): void {
    const moveKey = this.getMoveKey(move);
    const currentScore = this.historyTable.get(moveKey) || 0;
    this.historyTable.set(moveKey, currentScore + depth * depth);
  }

  private getHistoryScore(move: GameAction): number {
    const moveKey = this.getMoveKey(move);
    return this.historyTable.get(moveKey) || 0;
  }

  private getMoveKey(move: GameAction): string {
    return `${move.type}-${move.from || ''}-${move.to || ''}-${move.piece || ''}`;
  }

  private areMovesEqual(move1: GameAction, move2: GameAction): boolean {
    return move1.type === move2.type &&
           move1.from === move2.from &&
           move1.to === move2.to &&
           move1.piece === move2.piece;
  }

  private getCaptureScore(gameState: SecretKingBootGameState, move: GameAction): number {
    if (!move.to) return 0;
    
    const targetSquare = this.parseSquare(move.to);
    if (!targetSquare) return 0;
    
    const targetPiece = gameState.board[targetSquare.rank][targetSquare.file];
    if (!targetPiece) return 0;
    
    // MVV-LVA scoring
    const victimValue = this.getPieceValueForOrdering(targetPiece);
    const attackerValue = move.piece ? this.getPieceValueForOrdering(move.piece) : 100;
    
    return victimValue * 100 - attackerValue;
  }

  private getPieceValueForOrdering(piece: string): number {
    if (piece.includes('Pawn')) return 1;
    if (piece.includes('Knight')) return 3;
    if (piece.includes('Bishop')) return 3;
    if (piece.includes('Rook')) return 5;
    if (piece.includes('Queen')) return 9;
    if (piece.includes('King')) return 100;
    return 1;
  }

  private parseSquare(square: string): { rank: number, file: number } | null {
    if (square.length !== 2) return null;
    const file = square.charCodeAt(0) - 'A'.charCodeAt(0);
    const rank = parseInt(square[1]) - 1;
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      return { rank, file };
    }
    return null;
  }

  private isCentralSquare(square: string): boolean {
    const pos = this.parseSquare(square);
    if (!pos) return false;
    return pos.rank >= 2 && pos.rank <= 5 && pos.file >= 2 && pos.file <= 5;
  }

  private getTacticalMoves(gameState: SecretKingBootGameState): GameAction[] {
    // Simplified: return moves that might be captures or checks
    // In a full implementation, this would analyze the position more thoroughly
    const availableActionTypes = getAvailableActions(gameState);
    const allMoves = this.getAllPossibleActions(gameState, availableActionTypes);
    
    return allMoves.filter(move => {
      if (move.type === 'move_piece' && move.to) {
        const targetSquare = this.parseSquare(move.to);
        if (targetSquare) {
          const targetPiece = gameState.board[targetSquare.rank][targetSquare.file];
          return targetPiece !== null; // It's a capture
        }
      }
      return false;
    });
  }

  getDifficulty(): BotDifficulty {
    return this.config.difficulty;
  }
}