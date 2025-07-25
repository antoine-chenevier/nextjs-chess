import { Bot, BotConfig, BotDifficulty } from './types';
import { SimpleBot } from './simpleBot';

/**
 * Factory pour créer des bots avec différents niveaux de difficulté
 */
export function createBot(difficulty: BotDifficulty): Bot {
  const configs: Record<BotDifficulty, BotConfig> = {
    [BotDifficulty.EASY]: {
      difficulty: BotDifficulty.EASY,
      thinkingTime: 500,   // 0.5 seconde
      randomness: 0.8      // Beaucoup d'aléatoire
    },
    [BotDifficulty.MEDIUM]: {
      difficulty: BotDifficulty.MEDIUM,
      thinkingTime: 1500,  // 1.5 secondes
      randomness: 0.3      // Un peu d'aléatoire
    },
    [BotDifficulty.HARD]: {
      difficulty: BotDifficulty.HARD,
      thinkingTime: 3000,  // 3 secondes
      randomness: 0.1      // Très peu d'aléatoire
    }
  };

  return new SimpleBot(configs[difficulty]);
}

/**
 * Obtient la description d'un niveau de difficulté
 */
export function getDifficultyDescription(difficulty: BotDifficulty): string {
  switch (difficulty) {
    case BotDifficulty.EASY:
      return 'Facile - Joue des coups aléatoires, idéal pour débuter';
    case BotDifficulty.MEDIUM:
      return 'Moyen - Évalue les positions à court terme';
    case BotDifficulty.HARD:
      return 'Difficile - Utilise l\'algorithme minimax, anticipe plusieurs coups';
    default:
      return 'Niveau inconnu';
  }
}
