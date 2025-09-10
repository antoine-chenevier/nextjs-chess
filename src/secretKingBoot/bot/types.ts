import { SecretKingBootGameState, GameAction } from '../types';

export enum BotDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert',
  MASTER = 'master'
}

export interface BotConfig {
  difficulty: BotDifficulty;
  thinkingTime: number; // en millisecondes
  randomness: number; // 0-1, pour ajouter de l'imprévisibilité
  maxDepth?: number; // profondeur maximale de recherche
  useTranspositionTable?: boolean; // utiliser la table de transposition
  useQuiescenceSearch?: boolean; // utiliser la recherche de quiescence
  useIterativeDeepening?: boolean; // utiliser l'approfondissement itératif
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
