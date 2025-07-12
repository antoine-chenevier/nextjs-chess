# La Botte Secrète du Roi - Documentation Développeur

## Vue d'ensemble

Cette implémentation de "La Botte Secrète du Roi" est une variante d'échecs complètement intégrée dans votre projet Next.js. Elle respecte les règles définies et offre une interface utilisateur moderne et responsive.

## Architecture

### Structure des fichiers

```
src/secretKingBoot/
├── types.ts              # Types TypeScript et interfaces
├── gameLogic.ts          # Logique de validation des actions
├── gameActions.ts        # Application des actions sur l'état
├── gameAnalysis.ts       # Analyse de jeu et génération de coups
├── SecretKingBootGame.tsx # Composant React principal
├── SecretKingBoot.css    # Styles CSS
└── index.ts              # Point d'entrée et exports
```

### Types principaux

#### `SecretKingBootGameState`
L'état complet du jeu incluant :
- Joueur actuel et tour
- Phase de jeu (setup/playing/ended)
- Réserves des deux joueurs
- Positions des rois
- État de l'échiquier 8x8
- Historique des actions

#### `GameAction`
Représente une action du joueur :
- Type d'action (place_king, generate_pawn, etc.)
- Paramètres spécifiques (from, to, piece, cost)
- Métadonnées (player, turn)

#### `Reserve`
Gestion des pièces en réserve :
- Compteurs pour chaque type de pièce
- Limites définies dans `RESERVE_LIMITS`

## Flux de jeu

### 1. Phase de setup
```typescript
// Création d'une nouvelle partie
const gameState = createInitialGameState();

// Placement des rois (obligatoire)
const placeKingAction: GameAction = {
  type: 'place_king',
  player: 'white',
  turn: 1,
  to: 'E1' // ou 'D1'
};
```

### 2. Phase de jeu
```typescript
// Actions possibles à chaque tour
const availableActions = getAvailableActions(gameState);

// Génération des coups légaux
const possibleMoves = getPossibleMoves(gameState, 'generate_pawn');

// Validation et application
if (isValidAction(gameState, action).valid) {
  const newState = applyAction(gameState, action);
}
```

## Règles implémentées

### Gestion de la réserve
- **Limites** : 8 pions, 1 cavalier, 1 fou, 1 tour max
- **Régénération** : Pièces capturées retournent en réserve (si limite non atteinte)
- **Échanges** : 2 pions → cavalier, 3 → fou, 4 → tour

### Règles spéciales des pions
- **Zones de placement** : Rangs 1-4 (blanc), 5-8 (noir)
- **Mouvement initial** : Plusieurs cases possibles
- **Mouvement normal** : 1 case après le premier mouvement

### Actions combinées
- **Déplacement roi + placement** : 1 seul coup pour déplacer le roi ET placer une pièce sur sa case de départ

## Intégration

### Utilisation basique
```tsx
import SecretKingBootGame from '../src/secretKingBoot';

function MyPage() {
  return (
    <SecretKingBootGame 
      onGameEnd={(winner) => console.log(`Gagnant: ${winner}`)}
      enableAI={false}
    />
  );
}
```

### Personnalisation avancée
```tsx
import { 
  createInitialGameState, 
  isValidAction, 
  applyAction 
} from '../src/secretKingBoot';

// Logique personnalisée
const [gameState, setGameState] = useState(createInitialGameState());

const handleCustomAction = (action: GameAction) => {
  if (isValidAction(gameState, action).valid) {
    const newState = applyAction(gameState, action);
    setGameState(newState);
    
    // Votre logique métier
    saveGameToDatabase(newState);
    checkForAchievements(newState);
  }
};
```

## Extensibilité

### Ajout de nouvelles actions
1. Définir le nouveau type dans `ActionType`
2. Ajouter la validation dans `gameLogic.ts`
3. Implémenter l'application dans `gameActions.ts`
4. Mettre à jour l'interface utilisateur

### Intégration IA
```typescript
// Structure pour l'ajout d'une IA
interface AIPlayer {
  difficulty: 'easy' | 'medium' | 'hard';
  evaluatePosition: (state: SecretKingBootGameState) => number;
  selectBestMove: (possibleMoves: GameAction[]) => GameAction;
}
```

### Sauvegarde/Chargement
```typescript
// Sérialisation de l'état
const saveGame = (gameState: SecretKingBootGameState) => {
  localStorage.setItem('secretKingBoot', JSON.stringify(gameState));
};

// Restauration
const loadGame = (): SecretKingBootGameState | null => {
  const saved = localStorage.getItem('secretKingBoot');
  return saved ? JSON.parse(saved) : null;
};
```

## Performance et optimisations

### Optimisations React
- `useCallback` pour les handlers
- `useMemo` pour les calculs coûteux
- État local pour les sélections UI

### Optimisations logiques
- Validation paresseuse des coups
- Cache des analyses de position
- Génération incrémentale des coups légaux

## Tests recommandés

### Tests unitaires
```typescript
// Exemple de test de validation
test('should validate king placement correctly', () => {
  const gameState = createInitialGameState();
  const action: GameAction = {
    type: 'place_king',
    player: 'white',
    turn: 1,
    to: 'E1'
  };
  
  expect(isValidAction(gameState, action).valid).toBe(true);
});
```

### Tests d'intégration
- Partie complète automatisée
- Scénarios de fin de partie
- Edge cases des règles spéciales

## Déploiement

### Configuration Next.js
```typescript
// next.config.js
module.exports = {
  // Configuration pour supporter les styles CSS
  experimental: {
    css: true
  }
};
```

### Optimisations build
- Code splitting par route
- Lazy loading des composants lourds
- Compression des assets CSS

## Maintenance

### Points d'attention
- **Performance** : Surveiller le temps de génération des coups
- **Mémoire** : Limiter la taille de l'historique des parties
- **UX** : Temps de réponse des interactions utilisateur

### Monitoring recommandé
- Temps moyen d'une partie
- Actions les plus utilisées
- Taux d'abandon en phase de setup

---

Cette implémentation respecte les principes SOLID et offre une base solide pour d'éventuelles extensions ou modifications des règles.
