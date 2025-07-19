import { 
  createInitialGameState,
  isChessMoveLegal
} from './src/secretKingBoot/gameLogic';
import { isKingInCheck } from './src/secretKingBoot/improvedCheckLogic';

/**
 * Test complet des règles de mouvement du roi
 */
function testKingMovementRules() {
  console.log('=== Test complet : Règles de mouvement du roi ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau vide
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois
  gameState.board[0][4] = 'WhiteKing';  // E1
  gameState.whiteKingPosition = 'E1';
  gameState.board[7][4] = 'BlackKing';  // E8
  gameState.blackKingPosition = 'E8';
  
  console.log('Plateau configuré avec rois en E1 et E8');
  
  let testsPassés = 0;
  let totalTests = 0;
  
  // Test 1: Mouvements légaux du roi (une case dans toutes les directions)
  console.log('\n--- Test 1: Mouvements légaux du roi ---');
  const mouvementsLégaux = [
    ['E1', 'D1'], ['E1', 'F1'],     // Horizontal
    ['E1', 'E2'],                   // Vertical
    ['E1', 'D2'], ['E1', 'F2']      // Diagonale
  ];
  
  for (const [from, to] of mouvementsLégaux) {
    totalTests++;
    const legal = isChessMoveLegal(gameState, from, to);
    console.log(`${from} -> ${to}: ${legal ? '✅' : '❌'}`);
    if (legal) testsPassés++;
  }
  
  // Test 2: Mouvements illégaux du roi (plus d'une case)
  console.log('\n--- Test 2: Mouvements illégaux du roi (distance) ---');
  const mouvementsIllégaux = [
    ['E1', 'C1'],  // 2 cases horizontalement
    ['E1', 'G1'],  // 2 cases horizontalement  
    ['E1', 'E3'],  // 2 cases verticalement
    ['E1', 'C3'],  // 2 cases en diagonale
    ['E1', 'G3']   // 2 cases en diagonale
  ];
  
  for (const [from, to] of mouvementsIllégaux) {
    totalTests++;
    const legal = isChessMoveLegal(gameState, from, to);
    console.log(`${from} -> ${to}: ${!legal ? '✅' : '❌'} (devrait être rejeté)`);
    if (!legal) testsPassés++;
  }
  
  // Test 3: Roi ne peut pas se déplacer sur case attaquée par pion
  console.log('\n--- Test 3: Cases attaquées par pions ---');
  // Ajouter des pions noirs qui attaquent certaines cases
  gameState.board[2][3] = 'BlackPawn';  // D3 attaque E2 et C2
  gameState.board[2][5] = 'BlackPawn';  // F3 attaque E2 et G2
  
  const casesAttaquées = [
    ['E1', 'E2'],  // Attaqué par D3 et F3
    ['E1', 'D2'],  // Libre
    ['E1', 'F2']   // Libre
  ];
  
  for (let i = 0; i < casesAttaquées.length; i++) {
    totalTests++;
    const [from, to] = casesAttaquées[i];
    const legal = isChessMoveLegal(gameState, from, to);
    const devrait = i === 0 ? 'être rejeté' : 'être autorisé';
    const expected = i !== 0;
    console.log(`${from} -> ${to}: ${legal === expected ? '✅' : '❌'} (devrait ${devrait})`);
    if (legal === expected) testsPassés++;
  }
  
  // Test 4: Roi ne peut pas capturer pièce alliée
  console.log('\n--- Test 4: Capture de pièces alliées interdite ---');
  gameState.board[0][3] = 'WhitePawn';   // D1 - pièce alliée
  gameState.board[1][4] = 'BlackPawn';   // E2 - pièce ennemie
  
  totalTests++;
  const captureAlliée = isChessMoveLegal(gameState, 'E1', 'D1');
  console.log(`E1 -> D1 (pièce alliée): ${!captureAlliée ? '✅' : '❌'} (devrait être rejeté)`);
  if (!captureAlliée) testsPassés++;
  
  totalTests++;
  const captureEnnemie = isChessMoveLegal(gameState, 'E1', 'E2');
  console.log(`E1 -> E2 (pièce ennemie): ${!captureEnnemie ? '✅' : '❌'} (devrait être rejeté car case attaquée)`);
  if (!captureEnnemie) testsPassés++;
  
  console.log(`\n🎯 Résultat: ${testsPassés}/${totalTests} tests réussis`);
  console.log(`📊 Taux de réussite: ${Math.round(testsPassés / totalTests * 100)}%`);
  
  return testsPassés === totalTests;
}

/**
 * Test spécifique : Roi en échec ne peut que faire des mouvements qui sortent d'échec
 */
function testKingInCheckMustEscape() {
  console.log('\n=== Test : Roi en échec doit sortir d\'échec ===');
  
  const gameState = createInitialGameState();
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau vide
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois
  gameState.board[0][4] = 'WhiteKing';  // E1
  gameState.whiteKingPosition = 'E1';
  gameState.board[7][4] = 'BlackKing';  // E8
  gameState.blackKingPosition = 'E8';
  
  // Placer une tour noire en A1 qui met le roi blanc en échec sur la rangée
  gameState.board[0][0] = 'BlackRook';  // A1
  
  console.log('Situation: Roi blanc en E1, Tour noire en A1 (échec sur la rangée)');
  
  const inCheck = isKingInCheck(gameState, 'white');
  console.log(`Roi blanc en échec: ${inCheck ? '✅' : '❌'}`);
  
  // Le roi ne peut pas rester sur la première rangée
  const moveOnRank = isChessMoveLegal(gameState, 'E1', 'F1');
  console.log(`E1 -> F1 (reste en échec): ${!moveOnRank ? '✅' : '❌'} (devrait être rejeté)`);
  
  // Le roi peut sortir d'échec en montant
  const escapeCheck = isChessMoveLegal(gameState, 'E1', 'E2');
  console.log(`E1 -> E2 (sort d'échec): ${escapeCheck ? '✅' : '❌'} (devrait être autorisé)`);
  
  return inCheck && !moveOnRank && escapeCheck;
}

// Exécuter tous les tests
console.log('🧪 Tests complets des règles du roi\n');

const test1 = testKingMovementRules();
const test2 = testKingInCheckMustEscape();

console.log('\n📊 RÉSULTATS FINAUX');
console.log(`Test règles générales du roi: ${test1 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);
console.log(`Test roi en échec: ${test2 ? '✅ RÉUSSI' : '❌ ÉCHOUÉ'}`);

if (test1 && test2) {
  console.log('\n🎉 Tous les tests passent ! Le roi respecte maintenant toutes les règles.');
} else {
  console.log('\n⚠️  Certains tests échouent encore.');
}
