# Bot pour Secret King Boot

Ce document explique comment utiliser le bot intégré dans le mode Secret King Boot.

## Caractéristiques du Bot

### 🤖 Niveaux de Difficulté

**Facile** 
- Joue des coups aléatoires
- Temps de réflexion: 0.5 seconde
- Idéal pour débuter et apprendre les règles

**Moyen**
- Évalue les positions à court terme (1 coup)
- Temps de réflexion: 1.5 secondes  
- Considère le matériel et la position
- Un peu d'aléatoire pour la variété

**Difficile**
- Utilise l'algorithme minimax (2 coups d'avance)
- Temps de réflexion: 3 secondes
- Évaluation sophistiquée incluant:
  - Matériel sur l'échiquier et en réserve
  - Sécurité du roi (échec/mat)
  - Contrôle du centre
  - Développement des pièces

### 🧠 Système d'Évaluation

Le bot évalue chaque position selon plusieurs critères :

```typescript
// Valeurs des pièces
Pion: 100 points
Cavalier/Fou: 300 points  
Tour: 500 points
Dame: 900 points
Roi: 10000 points

// Bonus/Malus
Contrôle du centre: +20 points par pièce
Pièce en réserve: 50% de la valeur sur l'échiquier
Roi en échec: -500 points
Échec et mat: ±50000 points
```

## Utilisation dans le Code

### Création d'un Bot

```typescript
import { createBot, BotDifficulty } from './bot';

// Créer un bot de niveau moyen
const bot = createBot(BotDifficulty.MEDIUM);

// Faire jouer le bot
const gameState = getCurrentGameState();
const action = await bot.makeMove(gameState);
const newState = applyAction(gameState, action);
```

### Interface Utilisateur

Le bot s'intègre automatiquement dans l'interface :

1. **Sélection du mode** : Boutons pour choisir le niveau
2. **Indicateur visuel** : Animation quand le bot réfléchit  
3. **Protection** : Empêche le joueur de jouer pendant le tour du bot
4. **Retour** : Possibilité de revenir au mode 2 joueurs

### Configuration Avancée

```typescript
// Configuration personnalisée
const customBot = new SimpleBot({
  difficulty: BotDifficulty.HARD,
  thinkingTime: 5000,  // 5 secondes
  randomness: 0.05     // Très peu d'aléatoire
});
```

## Architecture Technique

### Structure des Fichiers

```
src/secretKingBoot/bot/
├── types.ts         # Interfaces et types
├── evaluation.ts    # Système d'évaluation  
├── simpleBot.ts     # Implémentation du bot
├── botFactory.ts    # Factory pour créer les bots
└── index.ts         # Exports
```

### Algorithmes Utilisés

**Niveau Facile** : Sélection aléatoire
```typescript
const randomIndex = Math.floor(Math.random() * actions.length);
return actions[randomIndex];
```

**Niveau Moyen** : Évaluation gloutonne  
```typescript
for (const action of actions) {
  const newState = simulate(action);
  const score = evaluate(newState);
  if (score > bestScore) bestAction = action;
}
```

**Niveau Difficile** : Minimax avec élagage alpha-beta
```typescript
function minimax(state, depth, alpha, beta, maximizing) {
  if (depth === 0) return evaluate(state);
  
  for (const action of getActions(state)) {
    const score = minimax(simulate(action), depth-1, alpha, beta, !maximizing);
    if (maximizing) {
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break; // Élagage
    }
  }
  return maximizing ? alpha : beta;
}
```

## Tests et Validation

Le bot inclut une suite de tests complète :

```bash
# Exécuter les tests du bot
npm run test:bot

# Tests inclus:
- Création des bots (tous niveaux)
- Évaluation des positions  
- Performance et temps de réponse
- Cohérence des décisions
```

## Améliorations Futures

Fonctionnalités à ajouter :

- **Ouvertures** : Base de données d'ouvertures préprogrammées
- **Finales** : Reconnaissance des finales courantes
- **Apprentissage** : Ajustement basé sur les parties jouées
- **Analyse** : Affichage de la ligne de jeu du bot
- **Niveaux** : Plus de niveaux intermédiaires
- **Personnalité** : Styles de jeu différents (agressif, positionnel, etc.)

## Dépannage

**Le bot ne joue pas**
- Vérifier que `isPlayerVsBot` est `true`
- S'assurer que `gameState.currentPlayer === 'black'`
- Vérifier les erreurs dans la console

**Le bot est trop lent**
- Réduire la profondeur minimax
- Optimiser la fonction d'évaluation
- Ajouter plus d'élagage

**Le bot fait des erreurs**
- Vérifier l'évaluation des positions d'échec
- Améliorer la détection des tactiques
- Ajouter des règles spécifiques
