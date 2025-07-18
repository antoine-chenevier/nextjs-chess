import { SecretKingBootGameState, GameAction } from '../types';

export enum BotDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface BotConfig {
  difficulty: BotDifficulty;
  thinkingTime: number; // en millisecondes
  randomness: number; // 0-1, pour ajouter de l'imprévisibilité
}

export interface BotMove {
  action: GameAction;
  score: number;
  reasoning?: string;
}

export interface Bot {
  makeMove(gameState: SecretKingBootGameState): Promise<GameAction>;
  getDifficulty(): BotDifficulty;
}
