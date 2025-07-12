// Point d'entrée principal pour la variante "La botte secrète du roi"

export { SecretKingBootGame as default } from './SecretKingBootGame';

export type {
  SecretKingBootGameState,
  Reserve,
  GameAction,
  ActionType
} from './types';

export {
  createInitialGameState,
  isValidAction
} from './gameLogic';

export {
  applyAction
} from './gameActions';

export {
  getAvailableActions,
  getPossibleMoves,
  analyzeGameState
} from './gameAnalysis';

export {
  RESERVE_LIMITS,
  EXCHANGE_COSTS,
  VALID_KING_POSITIONS,
  PAWN_ZONES
} from './types';

// Constantes utiles pour l'intégration
export const GAME_RULES = {
  name: "La Botte Secrète du Roi",
  description: "Variante d'échecs où les joueurs commencent avec seulement leurs rois et construisent leur armée pendant la partie.",
  
  setup: {
    kingPlacement: "Les rois doivent être placés sur D1/E1 (blanc) ou D8/E8 (noir)",
    initialReserve: "Toutes les pièces (sauf les rois) sont en réserve au début"
  },
  
  actions: {
    generatePawn: {
      description: "Ajouter un pion à la réserve",
      cost: "1 coup",
      limit: "Maximum 8 pions en réserve"
    },
    
    placePiece: {
      description: "Placer une pièce de la réserve sur l'échiquier",
      cost: "1 coup",
      restrictions: "Pions uniquement dans leur moitié d'échiquier"
    },
    
    movePiece: {
      description: "Déplacer une pièce selon les règles classiques",
      cost: "1 coup",
      special: "Pions peuvent se déplacer de plusieurs cases au premier mouvement"
    },
    
    moveKingAndPlace: {
      description: "Déplacer le roi ET placer une pièce sur sa case de départ",
      cost: "1 coup",
      requirement: "Avoir une pièce en réserve"
    },
    
    exchangePieces: {
      description: "Échanger des pions contre d'autres pièces",
      cost: "1 coup",
      rates: {
        knight: "2 pions",
        bishop: "3 pions", 
        rook: "4 pions"
      }
    }
  },
  
  pawnRules: {
    placement: "Rangs 1-4 pour blanc, rangs 5-8 pour noir",
    movement: "Peut avancer de plusieurs cases au premier mouvement, puis 1 case",
    promotion: "Promotion classique sur la dernière rangée"
  },
  
  victory: "Échec et mat du roi adverse"
};

// Helper pour intégrer dans une application Next.js
export const createSecretKingBootPage = () => {
  return {
    title: "La Botte Secrète du Roi",
    description: "Jouez à cette variante unique d'échecs où la stratégie commence avant même le premier coup !",
    component: "SecretKingBootGame",
    styles: "SecretKingBoot.css"
  };
};
