import { 
  createInitialGameState,
  isValidAction
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction, SecretKingBootGameState } from '../src/secretKingBoot/types';
import {
  isKingInCheck,
  isKingInCheckmate,
  isStalemate,
  getGameState,
  hasLegalMoves,
  findKingPosition,
  isSquareAttacked,
  canPieceAttackSquare,
  wouldMoveLeaveKingInCheck,
  generateLegalMovesForPiece,
  positionToCoordinates,
  coordinatesToPosition
} from '../src/secretKingBoot/improvedCheckLogic';

/**
 * Tests complets pour la logique d'échec améliorée
 * Usage: npx tsx test/checkLogicTests.ts
 */

// Utilitaires pour les tests
function createTestBoard(pieces: { [position: string]: string }): (string | null)[][] {
  const board: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
  
  for (const [position, piece] of Object.entries(pieces)) {
    const coords = positionToCoordinates(position);
    board[coords.y][coords.x] = piece;
  }
  
  return board;
}

function createTestGameState(pieces: { [position: string]: string }): SecretKingBootGameState {
  const gameState = createInitialGameState();
  gameState.board = createTestBoard(pieces);
  gameState.gamePhase = 'playing';
  
  // Définir les positions des rois
  for (const [position, piece] of Object.entries(pieces)) {
    if (piece === 'WhiteKing') {
      gameState.whiteKingPosition = position as "D1" | "E1";
    } else if (piece === 'BlackKing') {
      gameState.blackKingPosition = position as "D8" | "E8";
    }
  }
  
  return gameState;
}

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName: string, testFunction: () => boolean) {
  console.log(`\n🧪 ${testName}`);
  try {
    const result = testFunction();
    if (result) {
      console.log(`✅ RÉUSSI`);
      testsPassed++;
    } else {
      console.log(`❌ ÉCHEC`);
      testsFailed++;
    }
  } catch (error) {
    console.log(`❌ ERREUR: ${error}`);
    testsFailed++;
  }
}

// Test 1: Détection basique d'échec
function testBasicCheckDetection(): boolean {
  console.log('Test: Roi blanc attaqué par tour noire');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'E8': 'BlackKing',
    'E7': 'BlackRook' // Tour noire attaque le roi blanc en E1
  });
  
  const whiteInCheck = isKingInCheck(gameState, 'white');
  const blackInCheck = isKingInCheck(gameState, 'black');
  
  console.log(`Roi blanc en échec: ${whiteInCheck} (attendu: true)`);
  console.log(`Roi noir en échec: ${blackInCheck} (attendu: false)`);
  
  return whiteInCheck && !blackInCheck;
}

// Test 2: Échec par fou
function testBishopCheck(): boolean {
  console.log('Test: Roi noir attaqué par fou blanc');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'E8': 'BlackKing',
    'B5': 'WhiteBishop' // Fou blanc attaque le roi noir en diagonale
  });
  
  const whiteInCheck = isKingInCheck(gameState, 'white');
  const blackInCheck = isKingInCheck(gameState, 'black');
  
  console.log(`Roi blanc en échec: ${whiteInCheck} (attendu: false)`);
  console.log(`Roi noir en échec: ${blackInCheck} (attendu: true)`);
  
  return !whiteInCheck && blackInCheck;
}

// Test 3: Échec par cavalier
function testKnightCheck(): boolean {
  console.log('Test: Roi blanc attaqué par cavalier noir');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'E8': 'BlackKing',
    'D3': 'BlackKnight' // Cavalier noir attaque le roi blanc
  });
  
  const whiteInCheck = isKingInCheck(gameState, 'white');
  const blackInCheck = isKingInCheck(gameState, 'black');
  
  console.log(`Roi blanc en échec: ${whiteInCheck} (attendu: true)`);
  console.log(`Roi noir en échec: ${blackInCheck} (attendu: false)`);
  
  return whiteInCheck && !blackInCheck;
}

// Test 4: Échec par pion
function testPawnCheck(): boolean {
  console.log('Test: Roi noir attaqué par pion blanc');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'D8': 'BlackKing',
    'C7': 'WhitePawn' // Pion blanc attaque le roi noir en diagonale
  });
  
  const whiteInCheck = isKingInCheck(gameState, 'white');
  const blackInCheck = isKingInCheck(gameState, 'black');
  
  console.log(`Roi blanc en échec: ${whiteInCheck} (attendu: false)`);
  console.log(`Roi noir en échec: ${blackInCheck} (attendu: true)`);
  
  return !whiteInCheck && blackInCheck;
}

// Test 5: Pas d'échec - chemin bloqué
function testBlockedCheck(): boolean {
  console.log('Test: Attaque bloquée par une pièce');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'E8': 'BlackKing',
    'E7': 'BlackRook',
    'E4': 'WhitePawn' // Pion blanc bloque l'attaque de la tour noire
  });
  
  const whiteInCheck = isKingInCheck(gameState, 'white');
  const blackInCheck = isKingInCheck(gameState, 'black');
  
  console.log(`Roi blanc en échec: ${whiteInCheck} (attendu: false)`);
  console.log(`Roi noir en échec: ${blackInCheck} (attendu: false)`);
  
  return !whiteInCheck && !blackInCheck;
}

// Test 6: Échec et mat basique
function testBasicCheckmate(): boolean {
  console.log('Test: Échec et mat du couloir');
  
  const gameState = createTestGameState({
    'H8': 'BlackKing',
    'E1': 'WhiteKing',
    'G7': 'WhiteRook',
    'H7': 'WhiteRook'
  });
  
  const blackState = getGameState(gameState, 'black');
  console.log(`État du roi noir: ${blackState.status} (attendu: checkmate)`);
  console.log(`Roi noir en échec: ${blackState.inCheck}`);
  console.log(`Mouvements légaux disponibles: ${blackState.hasLegalMoves}`);
  
  return blackState.status === 'checkmate';
}

// Test 7: Pat (stalemate)
function testStalemate(): boolean {
  console.log('Test: Situation de pat');
  
  const gameState = createTestGameState({
    'A8': 'BlackKing',
    'C1': 'WhiteKing',
    'B6': 'WhiteQueen'
  });
  
  const blackState = getGameState(gameState, 'black');
  console.log(`État du roi noir: ${blackState.status} (attendu: stalemate)`);
  console.log(`Roi noir en échec: ${blackState.inCheck}`);
  console.log(`Mouvements légaux disponibles: ${blackState.hasLegalMoves}`);
  
  return blackState.status === 'stalemate';
}

// Test 8: Mouvement qui expose le roi à l'échec
function testIllegalMoveExposesKing(): boolean {
  console.log('Test: Mouvement qui expose le roi (clouage)');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'E8': 'BlackKing',
    'E2': 'WhitePawn',
    'E7': 'BlackRook'
  });
  
  // Le pion en E2 ne peut pas bouger car il expose le roi à l'échec
  const wouldExposeKing = wouldMoveLeaveKingInCheck(gameState, 4, 1, 4, 2, 'white'); // E2 -> E3
  
  console.log(`Déplacer le pion exposerait le roi: ${wouldExposeKing} (attendu: true)`);
  
  return wouldExposeKing;
}

// Test 9: Mouvements légaux du roi en échec
function testKingMovesInCheck(): boolean {
  console.log('Test: Mouvements légaux du roi en échec');
  
  const gameState = createTestGameState({
    'E4': 'WhiteKing',
    'E8': 'BlackKing',
    'A4': 'BlackRook' // Tour noire attaque le roi blanc
  });
  
  // Le roi blanc doit pouvoir bouger vers certaines cases mais pas d'autres
  const kingPosition = findKingPosition(gameState.board, 'white');
  if (!kingPosition) return false;
  
  const legalMoves = generateLegalMovesForPiece(gameState, kingPosition.x, kingPosition.y, 'WhiteKing', 'white');
  
  console.log(`Mouvements légaux du roi blanc: ${legalMoves.length}`);
  console.log('Positions légales:', legalMoves.map(m => coordinatesToPosition(m.x, m.y)));
  
  // Le roi devrait pouvoir bouger vers certaines cases (pas sur la ligne 4)
  const hasMovesToSafety = legalMoves.some(move => move.y !== 3); // Pas sur la ligne 4 (index 3)
  
  return hasMovesToSafety && legalMoves.length > 0;
}

// Test 10: Test de performance
function testPerformance(): boolean {
  console.log('Test: Performance avec plateau complexe');
  
  const gameState = createTestGameState({
    'E1': 'WhiteKing',
    'E8': 'BlackKing',
    'A1': 'WhiteRook',
    'H1': 'WhiteRook',
    'B1': 'WhiteKnight',
    'G1': 'WhiteKnight',
    'C1': 'WhiteBishop',
    'F1': 'WhiteBishop',
    'D1': 'WhiteQueen',
    'A2': 'WhitePawn',
    'B2': 'WhitePawn',
    'C2': 'WhitePawn',
    'D2': 'WhitePawn',
    'E2': 'WhitePawn',
    'F2': 'WhitePawn',
    'G2': 'WhitePawn',
    'H2': 'WhitePawn',
    'A8': 'BlackRook',
    'H8': 'BlackRook',
    'B8': 'BlackKnight',
    'G8': 'BlackKnight',
    'C8': 'BlackBishop',
    'F8': 'BlackBishop',
    'D8': 'BlackQueen',
    'A7': 'BlackPawn',
    'B7': 'BlackPawn',
    'C7': 'BlackPawn',
    'D7': 'BlackPawn',
    'E7': 'BlackPawn',
    'F7': 'BlackPawn',
    'G7': 'BlackPawn',
    'H7': 'BlackPawn'
  });
  
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    isKingInCheck(gameState, 'white');
    isKingInCheck(gameState, 'black');
    hasLegalMoves(gameState, 'white');
    hasLegalMoves(gameState, 'black');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`100 évaluations complètes en ${duration}ms`);
  
  return duration < 1000; // Moins de 1 seconde pour 100 évaluations
}

// Test 11: Attaque multiple sur le roi
function testMultipleAttacksOnKing(): boolean {
  console.log('Test: Roi attaqué par plusieurs pièces');
  
  const gameState = createTestGameState({
    'E4': 'WhiteKing',
    'E8': 'BlackKing',
    'E1': 'BlackRook',  // Tour attaque verticalement
    'B1': 'BlackBishop' // Fou attaque en diagonale
  });
  
  const whiteInCheck = isKingInCheck(gameState, 'white');
  const whiteMoves = hasLegalMoves(gameState, 'white');
  
  console.log(`Roi blanc en échec: ${whiteInCheck} (attendu: true)`);
  console.log(`Roi blanc a des mouvements: ${whiteMoves}`);
  
  return whiteInCheck;
}

// Test 12: Vérification des utilitaires
function testUtilityFunctions(): boolean {
  console.log('Test: Fonctions utilitaires');
  
  // Test conversion position
  const coord1 = positionToCoordinates('A1');
  const coord2 = positionToCoordinates('H8');
  const pos1 = coordinatesToPosition(0, 0);
  const pos2 = coordinatesToPosition(7, 7);
  
  console.log(`A1 -> (${coord1.x}, ${coord1.y}) attendu: (0, 0)`);
  console.log(`H8 -> (${coord2.x}, ${coord2.y}) attendu: (7, 7)`);
  console.log(`(0, 0) -> ${pos1} attendu: A1`);
  console.log(`(7, 7) -> ${pos2} attendu: H8`);
  
  const conversionsOk = coord1.x === 0 && coord1.y === 0 && 
                       coord2.x === 7 && coord2.y === 7 && 
                       pos1 === 'A1' && pos2 === 'H8';
  
  // Test canPieceAttackSquare
  const board = createTestBoard({
    'D4': 'WhiteQueen',
    'F6': 'BlackKnight'
  });
  
  const queenAttacksH8 = canPieceAttackSquare('WhiteQueen', 3, 3, 7, 7, board, 'white');
  const knightAttacksE8 = canPieceAttackSquare('BlackKnight', 5, 5, 4, 7, board, 'black');
  
  console.log(`Dame D4 attaque H8: ${queenAttacksH8} (attendu: true)`);
  console.log(`Cavalier F6 attaque E8: ${knightAttacksE8} (attendu: true)`);
  
  return conversionsOk && queenAttacksH8 && knightAttacksE8;
}

// Exécution des tests
console.log('🚀 Tests de logique d\'échec améliorée');
console.log('=====================================');

runTest('Détection basique d\'échec', testBasicCheckDetection);
runTest('Échec par fou', testBishopCheck);
runTest('Échec par cavalier', testKnightCheck);
runTest('Échec par pion', testPawnCheck);
runTest('Attaque bloquée', testBlockedCheck);
runTest('Échec et mat basique', testBasicCheckmate);
runTest('Pat (stalemate)', testStalemate);
runTest('Mouvement expose le roi', testIllegalMoveExposesKing);
runTest('Mouvements du roi en échec', testKingMovesInCheck);
runTest('Performance', testPerformance);
runTest('Attaques multiples', testMultipleAttacksOnKing);
runTest('Fonctions utilitaires', testUtilityFunctions);

console.log('\n📊 Résultats des tests');
console.log('=====================');
console.log(`✅ Tests réussis: ${testsPassed}`);
console.log(`❌ Tests échoués: ${testsFailed}`);
console.log(`📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

if (testsFailed === 0) {
  console.log('\n🎉 Tous les tests sont passés ! La logique d\'échec fonctionne correctement.');
} else {
  console.log(`\n⚠️  ${testsFailed} test(s) ont échoué. Vérifiez l'implémentation.`);
}
