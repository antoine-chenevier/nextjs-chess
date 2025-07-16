// Test des règles spéciales des pions Secret King Boot

import { 
  createInitialGameState, 
  isSecretKingBootPawnMoveLegal,
  isChessMoveLegal,
  positionToCoordinates,
  coordinatesToPosition
} from '../src/secretKingBoot/gameLogic';

/**
 * Test des mouvements de pions selon les règles Secret King Boot
 */
function testSecretKingBootPawnMoves() {
  console.log('🔍 Test des règles spéciales des pions Secret King Boot...\n');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau vide
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois pour éviter les erreurs d'intégrité
  gameState.board[0][4] = 'WhiteKing';   // E1
  gameState.board[7][4] = 'BlackKing';   // E8
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  
  // Placer des pions pour les tests
  gameState.board[1][0] = 'WhitePawn';   // A2 (première moitié)
  gameState.board[1][1] = 'WhitePawn';   // B2 (première moitié)
  gameState.board[5][0] = 'WhitePawn';   // A6 (deuxième moitié)
  
  gameState.board[6][7] = 'BlackPawn';   // H7 (première moitié pour noir)
  gameState.board[2][7] = 'BlackPawn';   // H3 (deuxième moitié pour noir)
  
  console.log('Plateau configuré:');
  console.log('- Pions blancs: A2, B2 (première moitié), A6 (deuxième moitié)');
  console.log('- Pions noirs: H7 (première moitié), H3 (deuxième moitié)');
  
  const tests = [
    // Tests pour pions blancs en première moitié
    { from: 'A2', to: 'A3', piece: 'WhitePawn', expected: true, desc: 'Pion blanc A2->A3 (1 case)' },
    { from: 'A2', to: 'A4', piece: 'WhitePawn', expected: true, desc: 'Pion blanc A2->A4 (2 cases)' },
    { from: 'A2', to: 'A5', piece: 'WhitePawn', expected: true, desc: 'Pion blanc A2->A5 (3 cases)' },
    { from: 'A2', to: 'A6', piece: 'WhitePawn', expected: true, desc: 'Pion blanc A2->A6 (4 cases)' },
    { from: 'A2', to: 'A7', piece: 'WhitePawn', expected: false, desc: 'Pion blanc A2->A7 (5 cases, trop loin)' },
    
    // Tests pour pions blancs en deuxième moitié
    { from: 'A6', to: 'A7', piece: 'WhitePawn', expected: true, desc: 'Pion blanc A6->A7 (1 case, deuxième moitié)' },
    { from: 'A6', to: 'A8', piece: 'WhitePawn', expected: false, desc: 'Pion blanc A6->A8 (2 cases, interdit en deuxième moitié)' },
    
    // Tests pour pions noirs en première moitié
    { from: 'H7', to: 'H6', piece: 'BlackPawn', expected: true, desc: 'Pion noir H7->H6 (1 case)' },
    { from: 'H7', to: 'H5', piece: 'BlackPawn', expected: true, desc: 'Pion noir H7->H5 (2 cases)' },
    { from: 'H7', to: 'H4', piece: 'BlackPawn', expected: true, desc: 'Pion noir H7->H4 (3 cases)' },
    { from: 'H7', to: 'H3', piece: 'BlackPawn', expected: true, desc: 'Pion noir H7->H3 (4 cases)' },
    { from: 'H7', to: 'H2', piece: 'BlackPawn', expected: false, desc: 'Pion noir H7->H2 (5 cases, trop loin)' },
    
    // Tests pour pions noirs en deuxième moitié
    { from: 'H3', to: 'H2', piece: 'BlackPawn', expected: true, desc: 'Pion noir H3->H2 (1 case, deuxième moitié)' },
    { from: 'H3', to: 'H1', piece: 'BlackPawn', expected: false, desc: 'Pion noir H3->H1 (2 cases, interdit en deuxième moitié)' },
    
    // Tests de mouvements invalides
    { from: 'B2', to: 'B1', piece: 'WhitePawn', expected: false, desc: 'Pion blanc B2->B1 (reculer, interdit)' },
    { from: 'H7', to: 'H8', piece: 'BlackPawn', expected: false, desc: 'Pion noir H7->H8 (reculer, interdit)' },
    { from: 'B2', to: 'C3', piece: 'WhitePawn', expected: false, desc: 'Pion blanc B2->C3 (diagonal, pas encore implémenté)' }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  console.log('\n--- Tests des mouvements de pions ---');
  
  for (const test of tests) {
    // Mettre à jour le currentPlayer selon la couleur du pion
    gameState.currentPlayer = test.piece.includes('White') ? 'white' : 'black';
    
    const result = isSecretKingBootPawnMoveLegal(gameState, test.from, test.to, test.piece);
    const success = result === test.expected;
    
    if (success) {
      passed++;
      console.log(`✅ ${test.desc}: ${result ? 'AUTORISÉ' : 'INTERDIT'}`);
    } else {
      console.log(`❌ ${test.desc}: attendu ${test.expected ? 'AUTORISÉ' : 'INTERDIT'}, obtenu ${result ? 'AUTORISÉ' : 'INTERDIT'}`);
    }
  }
  
  console.log(`\n📊 Résultats: ${passed}/${total} tests réussis`);
  
  if (passed === total) {
    console.log('🎉 Tous les tests de pions Secret King Boot sont passés !');
    console.log('♟️  Les règles spéciales des pions sont correctement implémentées.');
  } else {
    console.log('⚠️  Certains tests ont échoué');
    console.log('🔧 Vérifiez la logique des mouvements de pions');
  }
  
  return passed === total;
}

/**
 * Test d'intégration avec isChessMoveLegal
 */
function testPawnIntegration() {
  console.log('\n🔄 Test d\'intégration avec isChessMoveLegal...');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau simple
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  gameState.board[0][4] = 'WhiteKing';   
  gameState.board[7][4] = 'BlackKing';   
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.board[1][4] = 'WhitePawn';   // E2
  
  console.log('Test: Pion blanc E2 -> E5 (3 cases)');
  
  const result = isChessMoveLegal(gameState, 'E2', 'E5');
  console.log(`Résultat: ${result ? 'AUTORISÉ ✅' : 'INTERDIT ❌'}`);
  
  return result; // Devrait être autorisé
}

// Exécuter les tests
console.log('♟️  Démarrage des tests des pions Secret King Boot\n');

try {
  const basicTestsPass = testSecretKingBootPawnMoves();
  const integrationTestPass = testPawnIntegration();
  
  console.log('\n' + '='.repeat(60));
  if (basicTestsPass && integrationTestPass) {
    console.log('🎉 TOUS LES TESTS RÉUSSIS !');
    console.log('♟️  Les pions Secret King Boot fonctionnent correctement !');
    console.log('📏 Règle implémentée: 1-4 cases en première moitié, 1 case en deuxième moitié');
  } else {
    console.log('💥 CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('🔧 Des corrections sont nécessaires');
  }
  console.log('='.repeat(60));
  
} catch (error) {
  console.error('💥 ERREUR dans les tests:', error);
}
