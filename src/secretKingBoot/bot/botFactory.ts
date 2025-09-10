import { Bot, BotConfig, BotDifficulty } from './types';
import { SimpleBot } from './simpleBot';

/**
 * Factory pour créer des bots avec différents niveaux de difficulté
 */
export function createBot(difficulty: BotDifficulty): Bot {
  const configs: Record<BotDifficulty, BotConfig> = {
    [BotDifficulty.EASY]: {
      difficulty: BotDifficulty.EASY,
      thinkingTime: 300,   // 0.3 seconde - plus rapide
      randomness: 0.8      // Beaucoup d'aléatoire
    },
    [BotDifficulty.MEDIUM]: {
      difficulty: BotDifficulty.MEDIUM,
      thinkingTime: 600,   // 0.6 seconde - plus rapide
      randomness: 0.3      // Un peu d'aléatoire
    },
    [BotDifficulty.HARD]: {
      difficulty: BotDifficulty.HARD,
      thinkingTime: 1000,  // 1 seconde - plus rapide
      randomness: 0.1      // Très peu d'aléatoire
    },
    [BotDifficulty.EXPERT]: {
      difficulty: BotDifficulty.EXPERT,
      thinkingTime: 1500,  // 1.5 seconde - plus rapide et simple
      randomness: 0.05     // Presque aucun aléatoire
    },
    [BotDifficulty.MASTER]: {
      difficulty: BotDifficulty.MASTER,
      thinkingTime: 2000,  // 2 secondes - plus rapide et simple
      randomness: 0.0      // Aucun aléatoire
    }
  };

  const config = configs[difficulty];

  // Utiliser SimpleBot pour tous les niveaux - simplicité et fiabilité
  return new SimpleBot(config);
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
        return 'Difficile - Utilise l\'algorithme minimax avec plus de profondeur';
      case BotDifficulty.EXPERT:
        return 'Expert - Minimax plus profond, évaluation améliorée';
      case BotDifficulty.MASTER:
        return 'Maître - Niveau le plus élevé, recherche la plus profonde';
      default:
        return 'Niveau inconnu';
    }
  }
