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
      thinkingTime: 4000,  // 4 secondes
      randomness: 0.05,    // Quasi aucun aléatoire
      maxDepth: 5,
      useTranspositionTable: true,
      useQuiescenceSearch: true,
      useIterativeDeepening: true
    },
    [BotDifficulty.MASTER]: {
      difficulty: BotDifficulty.MASTER,
      thinkingTime: 8000,  // 8 secondes
      randomness: 0.02,    // Minimum d'aléatoire
      maxDepth: 6,
      useTranspositionTable: true,
      useQuiescenceSearch: true,
      useIterativeDeepening: true
    }
  };

  const config = configs[difficulty];
  
  // Use AdvancedBot for EXPERT and MASTER levels
  if (difficulty === BotDifficulty.EXPERT || difficulty === BotDifficulty.MASTER) {
    return new AdvancedBot(config);
  }
  
  // Use SimpleBot for other levels
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
      return 'Difficile - Utilise l\'algorithme minimax, anticipe plusieurs coups';
    case BotDifficulty.EXPERT:
      return 'Expert - Recherche avancée avec optimisations, évaluation sophistiquée';
    case BotDifficulty.MASTER:
      return 'Maître - IA de haut niveau avec recherche profonde et tactiques avancées';
    default:
      return 'Niveau inconnu';
  }
}
