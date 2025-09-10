import { Bot, BotConfig, BotDifficulty } from './types';
import { SecretKingBootGameState, GameAction, ActionType } from '../types';
import { getAvailableActions, getPossibleMoves } from '../gameAnalysis';
import { evaluatePosition, evaluatePositionSimple } from './evaluation';
import { applyAction } from '../gameActions';
import { copyGameState, TranspositionTable, MoveOrderer } from './utils';

export class AdvancedBot implements Bot {
  private config: BotConfig;
  private transpositionTable: TranspositionTable;
  private moveOrderer: MoveOrderer;
  private startTime: number = 0;
  private maxTime: number = 0;
  private nodesSearched: number = 0;

  constructor(config: BotConfig) {
    this.config = config;
    this.transpositionTable = new TranspositionTable();
    this.moveOrderer = new MoveOrderer();
  }

  async makeMove(gameState: SecretKingBootGameState): Promise<GameAction> {
    this.startTime = Date.now();
    this.maxTime = this.config.thinkingTime;
    this.nodesSearched = 0;

    const availableActionTypes = getAvailableActions(gameState);
    
    if (availableActionTypes.length === 0) {
      throw new Error('Aucune action possible');
    }

    // Obtenir toutes les actions possibles
    const allPossibleActions: GameAction[] = [];
    for (const actionType of availableActionTypes) {
      const actionsOfType = getPossibleMoves(gameState, actionType);
      allPossibleActions.push(...actionsOfType);
    }

    if (allPossibleActions.length === 0) {
      throw new Error('Aucun mouvement possible');
    }

    // Sélectionner l'algorithme basé sur la difficulté
    let bestMove: GameAction;
    
    switch (this.config.difficulty) {
      case BotDifficulty.EASY:
        bestMove = this.makeRandomMove(allPossibleActions);
        break;
      case BotDifficulty.MEDIUM:
        bestMove = this.makeGreedyMove(gameState, allPossibleActions);
        break;
      case BotDifficulty.HARD:
        bestMove = this.makeMiniMaxMove(gameState, allPossibleActions, 3);
        break;
      case BotDifficulty.EXPERT:
        bestMove = this.makeIterativeDeepeningMove(gameState, allPossibleActions, 5);
        break;
      case BotDifficulty.MASTER:
        bestMove = this.makeIterativeDeepeningMove(gameState, allPossibleActions, 7);
        break;
      default:
        bestMove = this.makeRandomMove(allPossibleActions);
    }

    // Simuler le temps de réflexion restant
    const elapsed = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.config.thinkingTime - elapsed);
    if (remainingTime > 0) {
      await this.delay(remainingTime);
    }

    console.log(`Bot (${this.config.difficulty}): Searched ${this.nodesSearched} nodes in ${Date.now() - this.startTime}ms`);

    return bestMove;
  }

  /**
   * Stratégie facile : mouvement aléatoire
   */
  private makeRandomMove(possibleActions: GameAction[]): GameAction {
    const randomIndex = Math.floor(Math.random() * possibleActions.length);
    return possibleActions[randomIndex];
  }

  /**
   * Stratégie moyenne : évaluation gloutonne (1 coup)
   */
  private makeGreedyMove(gameState: SecretKingBootGameState, possibleActions: GameAction[]): GameAction {
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;

    for (const action of possibleActions) {
      try {
        const newState = this.simulateAction(gameState, action);
        if (newState) {
          const score = evaluatePositionSimple(newState, gameState.currentPlayer);
          
          // Ajouter un peu de randomness pour éviter les jeux trop prévisibles
          const randomBonus = (Math.random() - 0.5) * this.config.randomness * 100;
          const adjustedScore = score + randomBonus;
          
          if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestAction = action;
          }
        }
      } catch (error) {
        // Ignorer les actions qui causent des erreurs
        continue;
      }
    }

    return bestAction;
  }

  /**
   * Stratégie difficile : minimax avec profondeur limitée
   */
  private makeMiniMaxMove(gameState: SecretKingBootGameState, possibleActions: GameAction[], maxDepth: number): GameAction {
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;

    // Ordonner les mouvements pour un meilleur élagage
    const orderedMoves = this.moveOrderer.orderMoves(possibleActions, gameState, 0);

    for (const action of orderedMoves) {
      try {
        const score = this.minimax(gameState, action, maxDepth - 1, false, -Infinity, Infinity);
        
        if (score > bestScore) {
          bestScore = score;
          bestAction = action;
        }

        // Vérifier le temps
        if (this.isTimeUp()) {
          break;
        }
      } catch (error) {
        // Ignorer les actions qui causent des erreurs
        continue;
      }
    }

    return bestAction;
  }

  /**
   * Recherche itérative par approfondissement
   */
  private makeIterativeDeepeningMove(gameState: SecretKingBootGameState, possibleActions: GameAction[], maxDepth: number): GameAction {
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;

    // Ordonner les mouvements initialement
    let orderedMoves = this.moveOrderer.orderMoves(possibleActions, gameState, 0);

    // Recherche itérative par approfondissement
    for (let depth = 1; depth <= maxDepth && !this.isTimeUp(); depth++) {
      let currentBestAction = bestAction;
      let currentBestScore = -Infinity;

      for (const action of orderedMoves) {
        try {
          const score = this.minimax(gameState, action, depth - 1, false, -Infinity, Infinity);
          
          if (score > currentBestScore) {
            currentBestScore = score;
            currentBestAction = action;
          }

          // Vérifier le temps
          if (this.isTimeUp()) {
            break;
          }
        } catch (error) {
          continue;
        }
      }

      // Mise à jour du meilleur mouvement trouvé à cette profondeur
      if (currentBestScore > bestScore || depth === 1) {
        bestAction = currentBestAction;
        bestScore = currentBestScore;
      }

      // Réordonner les mouvements basé sur les résultats de cette itération
      orderedMoves = this.moveOrderer.orderMoves(possibleActions, gameState, depth);

      // Terminer tôt si on trouve un mat
      if (bestScore > 50000) {
        console.log(`Found winning move at depth ${depth}`);
        break;
      }
    }

    return bestAction;
  }

  /**
   * Algorithme minimax avec élagage alpha-beta et optimisations
   */
  private minimax(
    gameState: SecretKingBootGameState, 
    action: GameAction, 
    depth: number, 
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): number {
    this.nodesSearched++;

    // Vérifier la table de transposition
    const ttEntry = this.transpositionTable.lookup(gameState, depth);
    if (ttEntry) {
      if (ttEntry.flag === 'exact') {
        return ttEntry.score;
      } else if (ttEntry.flag === 'lower' && ttEntry.score >= beta) {
        return beta;
      } else if (ttEntry.flag === 'upper' && ttEntry.score <= alpha) {
        return alpha;
      }
    }

    const newState = this.simulateAction(gameState, action);
    
    if (!newState) {
      return isMaximizing ? -50000 : 50000;
    }

    // Vérifier le temps
    if (this.isTimeUp()) {
      return this.quickEvaluate(newState, gameState.currentPlayer);
    }

    // Condition de fin récursive
    if (depth === 0) {
      const score = this.quiescenceSearch(newState, alpha, beta, 4); // Recherche de quiescence limitée
      this.transpositionTable.store(newState, score, 0, 'exact');
      return score;
    }

    const availableActionTypes = getAvailableActions(newState);
    const allPossibleActions: GameAction[] = [];
    
    for (const actionType of availableActionTypes) {
      const actionsOfType = getPossibleMoves(newState, actionType);
      allPossibleActions.push(...actionsOfType);
    }
    
    if (allPossibleActions.length === 0) {
      const score = evaluatePosition(newState, gameState.currentPlayer);
      this.transpositionTable.store(newState, score, depth, 'exact');
      return score;
    }

    // Ordonner les mouvements
    const orderedMoves = this.moveOrderer.orderMoves(allPossibleActions, newState, depth);

    let ttFlag: 'exact' | 'lower' | 'upper' = 'upper';

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextAction of orderedMoves) {
        const score = this.minimax(newState, nextAction, depth - 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        
        if (beta <= alpha) {
          // Beta cutoff - mise à jour des heuristiques
          this.moveOrderer.updateKillerMove(nextAction, depth);
          this.moveOrderer.updateHistory(nextAction, depth);
          ttFlag = 'lower';
          break;
        }

        if (this.isTimeUp()) {
          break;
        }
      }
      
      if (ttFlag !== 'lower') {
        ttFlag = 'exact';
      }
      
      this.transpositionTable.store(newState, maxScore, depth, ttFlag);
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextAction of orderedMoves) {
        const score = this.minimax(newState, nextAction, depth - 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        
        if (beta <= alpha) {
          // Alpha cutoff
          this.moveOrderer.updateKillerMove(nextAction, depth);
          this.moveOrderer.updateHistory(nextAction, depth);
          ttFlag = 'upper';
          break;
        }

        if (this.isTimeUp()) {
          break;
        }
      }
      
      if (ttFlag !== 'upper') {
        ttFlag = 'exact';
      }
      
      this.transpositionTable.store(newState, minScore, depth, ttFlag);
      return minScore;
    }
  }

  /**
   * Recherche de quiescence pour évaluer les positions tactiques
   */
  private quiescenceSearch(gameState: SecretKingBootGameState, alpha: number, beta: number, depth: number): number {
    this.nodesSearched++;

    const standPat = evaluatePosition(gameState, gameState.currentPlayer);

    if (depth === 0 || this.isTimeUp()) {
      return standPat;
    }

    if (standPat >= beta) {
      return beta;
    }

    if (standPat > alpha) {
      alpha = standPat;
    }

    // Ne considérer que les captures et coups tactiques en quiescence
    const captures = this.getTacticalMoves(gameState);
    
    for (const capture of captures) {
      const newState = this.simulateAction(gameState, capture);
      if (newState) {
        const score = -this.quiescenceSearch(newState, -beta, -alpha, depth - 1);
        
        if (score >= beta) {
          return beta;
        }
        
        if (score > alpha) {
          alpha = score;
        }
      }
    }

    return alpha;
  }

  /**
   * Obtenir les mouvements tactiques (captures, échecs, etc.)
   */
  private getTacticalMoves(gameState: SecretKingBootGameState): GameAction[] {
    const tacticalMoves: GameAction[] = [];
    const availableActionTypes = getAvailableActions(gameState);
    
    for (const actionType of availableActionTypes) {
      if (actionType === 'move_piece') {
        const moves = getPossibleMoves(gameState, actionType);
        // Filtrer pour ne garder que les captures
        moves.forEach(move => {
          if (move.from && move.to && this.isCapture(gameState, move)) {
            tacticalMoves.push(move);
          }
        });
      }
    }
    
    return tacticalMoves;
  }

  /**
   * Vérifier si un mouvement est une capture
   */
  private isCapture(gameState: SecretKingBootGameState, move: GameAction): boolean {
    if (!move.to) return false;
    
    const [file, rank] = this.parsePosition(move.to);
    if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
      return gameState.board[rank][file] !== null;
    }
    
    return false;
  }

  private parsePosition(position: string): [number, number] {
    const file = position.charCodeAt(0) - 'A'.charCodeAt(0);
    const rank = parseInt(position[1]) - 1;
    return [file, rank];
  }

  /**
   * Évaluation rapide pour les situations de manque de temps
   */
  private quickEvaluate(gameState: SecretKingBootGameState, player: 'white' | 'black'): number {
    return evaluatePositionSimple(gameState, player);
  }

  /**
   * Simule une action sans modifier l'état original (optimisé)
   */
  private simulateAction(gameState: SecretKingBootGameState, action: GameAction): SecretKingBootGameState | null {
    try {
      // Utiliser la copie optimisée au lieu de JSON
      const stateCopy = copyGameState(gameState);
      
      // Appliquer l'action sur la copie
      return applyAction(stateCopy, action);
    } catch (error) {
      return null;
    }
  }

  /**
   * Vérifier si le temps est écoulé
   */
  private isTimeUp(): boolean {
    return Date.now() - this.startTime >= this.maxTime * 0.95; // 95% du temps alloué
  }

  /**
   * Ajoute un délai pour simuler la réflexion
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDifficulty(): BotDifficulty {
    return this.config.difficulty;
  }
}