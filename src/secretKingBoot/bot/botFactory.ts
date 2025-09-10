import { Bot, BotConfig, BotDifficulty } from './types';
import { SimpleBot } from './simpleBot';
import { AdvancedBot } from './advancedBot';

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
      thinkingTime: 1000,  // 1 seconde
      randomness: 0.3      // Un peu d'aléatoire
    },
    [BotDifficulty.HARD]: {
      difficulty: BotDifficulty.HARD,
      thinkingTime: 2000,  // 2 secondes
      randomness: 0.1      // Très peu d'aléatoire
    },
    [BotDifficulty.EXPERT]: {
      difficulty: BotDifficulty.EXPERT,
      thinkingTime: 4000,  // 4 secondes - algorithmes avancés
      randomness: 0.05     // Presque aucun aléatoire
    },
    [BotDifficulty.MASTER]: {
      difficulty: BotDifficulty.MASTER,
      thinkingTime: 6000,  // 6 secondes - niveau maître
      randomness: 0.0      // Aucun aléatoire
    }
  };

  const config = configs[difficulty];

  // Utiliser SimpleBot pour les niveaux de base, AdvancedBot pour les niveaux supérieurs
  if (difficulty === BotDifficulty.EASY || difficulty === BotDifficulty.MEDIUM || difficulty === BotDifficulty.HARD) {
    return new SimpleBot(config);
  } else {
    return new AdvancedBot(config);
  }
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
    case BotDifficulty.EXPERT:
      return 'Expert - Algorithmes avancés avec optimisations, recherche approfondie';
    case BotDifficulty.MASTER:
      return 'Maître - Niveau le plus élevé, évaluation sophistiquée et recherche itérative';
    default:
      return 'Niveau inconnu';
  }
}
