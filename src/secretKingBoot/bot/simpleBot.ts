import { Bot, BotConfig, BotDifficulty } from './types';
import { SecretKingBootGameState, GameAction, ActionType } from '../types';
import { getAvailableActions, getPossibleMoves } from '../gameAnalysis';
import { evaluatePositionSimple } from './evaluation';
import { applyAction } from '../gameActions';
import { copyGameState } from './utils';

export class SimpleBot implements Bot {
  private config: BotConfig;

  constructor(config: BotConfig) {
    this.config = config;
  }

  async makeMove(gameState: SecretKingBootGameState): Promise<GameAction> {
    // Simuler le temps de réflexion
    await this.delay(this.config.thinkingTime);

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

    switch (this.config.difficulty) {
      case BotDifficulty.EASY:
        return this.makeRandomMove(allPossibleActions);
      case BotDifficulty.MEDIUM:
        return this.makeGreedyMove(gameState, allPossibleActions);
      case BotDifficulty.HARD:
        return this.makeMiniMaxMove(gameState, allPossibleActions, 2);
      case BotDifficulty.EXPERT:
        return this.makeMiniMaxMove(gameState, allPossibleActions, 3);
      case BotDifficulty.MASTER:
        return this.makeMiniMaxMove(gameState, allPossibleActions, 4);
      default:
        return this.makeRandomMove(allPossibleActions);
    }
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
   * Stratégie avec minimax pour les niveaux difficiles
   */
  private makeMiniMaxMove(gameState: SecretKingBootGameState, possibleActions: GameAction[], depth: number): GameAction {
    let bestAction = possibleActions[0];
    let bestScore = -Infinity;

    for (const action of possibleActions) {
      try {
        const score = this.minimax(gameState, action, depth - 1, false, -Infinity, Infinity);
        
        // Ajouter un peu de randomness pour les niveaux inférieurs
        const randomBonus = (Math.random() - 0.5) * this.config.randomness * 50;
        const adjustedScore = score + randomBonus;
        
        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestAction = action;
        }
      } catch (error) {
        // Ignorer les actions qui causent des erreurs
        continue;
      }
    }

    return bestAction;
  }

  /**
   * Algorithme minimax avec élagage alpha-beta (simplifié)
   */
  private minimax(
    gameState: SecretKingBootGameState, 
    action: GameAction, 
    depth: number, 
    isMaximizing: boolean,
    alpha: number,
    beta: number
  ): number {
    const newState = this.simulateAction(gameState, action);
    
    if (!newState || depth === 0) {
      return evaluatePositionSimple(newState || gameState, gameState.currentPlayer);
    }

    const availableActionTypes = getAvailableActions(newState);
    const allPossibleActions: GameAction[] = [];
    
    for (const actionType of availableActionTypes) {
      const actionsOfType = getPossibleMoves(newState, actionType);
      allPossibleActions.push(...actionsOfType);
    }
    
    if (allPossibleActions.length === 0) {
      return evaluatePositionSimple(newState, gameState.currentPlayer);
    }

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const nextAction of allPossibleActions) {
        const score = this.minimax(newState, nextAction, depth - 1, false, alpha, beta);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) {
          break; // Élagage alpha-beta
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const nextAction of allPossibleActions) {
        const score = this.minimax(newState, nextAction, depth - 1, true, alpha, beta);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) {
          break; // Élagage alpha-beta
        }
      }
      return minScore;
    }
  }

  /**
   * Simule une action sans modifier l'état original (optimisé)
   */
  private simulateAction(gameState: SecretKingBootGameState, action: GameAction): SecretKingBootGameState | null {
    try {
      // Utiliser la copie optimisée au lieu de JSON - 5x plus rapide
      const stateCopy = copyGameState(gameState);
      
      // Appliquer l'action sur la copie
      return applyAction(stateCopy, action);
    } catch (error) {
      return null;
    }
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
