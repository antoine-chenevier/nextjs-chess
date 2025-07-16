/**
 * Fichier d'exemple pour tester la logique d'échec
 * Usage: npx tsx test/exemple.ts
 */

import { createInitialGameState } from '../src/secretKingBoot/gameLogic';
import { 
  isKingInCheck,
  isKingInCheckmate,
  getGameState,
  findKingPosition,
  positionToCoordinates,
  coordinatesToPosition
} from '../src/secretKingBoot/improvedCheckLogic';

// Création d'un état de jeu avec situation d'échec
function createTestGameState() {
  const gameState = createInitialGameState();
  
  // Vider le plateau
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      gameState.board[i][j] = null;
    }
  }
  
  // Placer les rois
  gameState.board[0][4] = 'WhiteKing';  // E1
  gameState.board[7][4] = 'BlackKing';  // E8
  
  // Ajout d'une tour noire qui attaque le roi blanc
  gameState.board[6][4] = 'BlackRook';  // E7
  
  // Mettre à jour les positions des rois
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  return gameState;
}

const testGameState = createTestGameState();

// Tests simples
console.log('🧪 Test de la logique d\'échec');
console.log('==============================');

// Test 1: Vérifier si le roi blanc est en échec
const whiteInCheck = isKingInCheck(testGameState, 'white');
console.log(`\n1. Roi blanc en échec: ${whiteInCheck}`);
console.log('   📍 Tour noire en E7 attaque le roi blanc en E1');

// Test 2: Vérifier si le roi noir est en échec
const blackInCheck = isKingInCheck(testGameState, 'black');
console.log(`\n2. Roi noir en échec: ${blackInCheck}`);

// Test 3: Analyser l'état complet du jeu
const whiteState = getGameState(testGameState, 'white');
console.log(`\n3. État du roi blanc:`);
console.log(`   - En échec: ${whiteState.inCheck}`);
console.log(`   - Peut bouger: ${whiteState.hasLegalMoves}`);
console.log(`   - Statut: ${whiteState.status}`);

const blackState = getGameState(testGameState, 'black');
console.log(`\n4. État du roi noir:`);
console.log(`   - En échec: ${blackState.inCheck}`);
console.log(`   - Peut bouger: ${blackState.hasLegalMoves}`);
console.log(`   - Statut: ${blackState.status}`);

// Test 4: Tester les utilitaires de conversion
console.log(`\n5. Tests de conversion:`);
const coord = positionToCoordinates('E1');
console.log(`   E1 → coordonnées: (${coord.x}, ${coord.y})`);

const pos = coordinatesToPosition(4, 0);
console.log(`   (4, 0) → position: ${pos}`);

// Test 5: Trouver la position du roi
const whiteKingPos = findKingPosition(testGameState.board, 'white');
console.log(`\n6. Position du roi blanc: ${whiteKingPos ? `(${whiteKingPos.x}, ${whiteKingPos.y})` : 'Non trouvé'}`);

console.log('\n✅ Tests terminés !');
