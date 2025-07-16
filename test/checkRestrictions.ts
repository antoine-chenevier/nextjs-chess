import { 
  createInitialGameState,
  isValidAction,
  updateGameStateWithChessLogic,
  isKingInCheck
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

/**
 * Test pour vérifier qu'on ne peut pas générer ou échanger des pions quand le roi est en échec
 */

console.log('🧪 Test des restrictions en cas d\'échec - Generation et échange de pions');

// Créer un état initial
let gameState = createInitialGameState();

// Placer les rois
const placeWhiteKing: GameAction = {
  type: 'place_king',
  player: 'white',
  turn: 1,
  to: 'E1'
};

const placeBlackKing: GameAction = {
  type: 'place_king',
  player: 'black', 
  turn: 1,
  to: 'E8'
};

// Appliquer le placement des rois
if (isValidAction(gameState, placeWhiteKing).valid) {
  gameState = applyAction(gameState, placeWhiteKing);
  console.log('✅ Roi blanc placé en E1');
}

if (isValidAction(gameState, placeBlackKing).valid) {
  gameState = applyAction(gameState, placeBlackKing);
  console.log('✅ Roi noir placé en E8');
}

// Passer en mode jeu
gameState.gamePhase = 'playing';

console.log('\n📋 Test 1: Génération de pion quand le roi N\'EST PAS en échec');

// Test 1: Génération normale (roi pas en échec)
const generatePawnNormal: GameAction = {
  type: 'generate_pawn',
  player: gameState.currentPlayer,
  turn: gameState.turn
};

const validation1 = isValidAction(gameState, generatePawnNormal);
console.log('Validation génération pion (roi pas en échec):', validation1.valid);

if (validation1.valid) {
  gameState = applyAction(gameState, generatePawnNormal);
  console.log('✅ Pion généré avec succès');
} else {
  console.log('❌ Échec inattendu:', validation1.reason);
}

console.log('\n📋 Test 2: Échange de pions quand le roi N\'EST PAS en échec');

// Test 2: Échange normal (roi pas en échec)
const exchangeNormal: GameAction = {
  type: 'exchange_pieces',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  exchangeFrom: 'pawn',
  exchangeTo: 'knights',
  cost: 2
};

const validation2 = isValidAction(gameState, exchangeNormal);
console.log('Validation échange pions (roi pas en échec):', validation2.valid);

if (validation2.valid) {
  gameState = applyAction(gameState, exchangeNormal);
  console.log('✅ Échange réalisé avec succès');
} else {
  console.log('❌ Échec inattendu:', validation2.reason);
}

console.log('\n📋 Test 3: Créer une situation d\'échec');

// Créer une situation d'échec en plaçant une tour blanche qui attaque le roi noir
const placeTowerCheck: GameAction = {
  type: 'place_piece',
  player: 'white',
  turn: gameState.turn,
  to: 'E7', // Une case devant le roi noir
  piece: 'Rook'
};

if (isValidAction(gameState, placeTowerCheck).valid) {
  gameState = applyAction(gameState, placeTowerCheck);
  console.log('✅ Tour blanche placée en E7');
  
  // Mettre à jour avec la logique d'échecs pour détecter l'échec
  gameState = updateGameStateWithChessLogic(gameState);
  
  console.log('État du jeu après analyse:', gameState.gameStatus?.status);
  console.log('Joueur en échec:', gameState.gameStatus?.player);
  console.log('Roi noir en échec?', isKingInCheck(gameState, 'black'));
} else {
  console.log('❌ Impossible de placer la tour');
}

// Passer au tour du joueur noir (qui est maintenant en échec)
gameState.currentPlayer = 'black';

console.log('\n📋 Test 4: Tentative de génération de pion quand le roi EST en échec');

const generatePawnInCheck: GameAction = {
  type: 'generate_pawn',
  player: 'black',
  turn: gameState.turn
};

const validation4 = isValidAction(gameState, generatePawnInCheck);
console.log('Validation génération pion (roi en échec):', validation4.valid);

if (!validation4.valid) {
  console.log('✅ Génération correctement bloquée:', validation4.reason);
} else {
  console.log('❌ ERREUR: Génération autorisée alors que le roi est en échec');
}

console.log('\n📋 Test 5: Tentative d\'échange de pions quand le roi EST en échec');

const exchangeInCheck: GameAction = {
  type: 'exchange_pieces',
  player: 'black',
  turn: gameState.turn,
  exchangeFrom: 'pawn',
  exchangeTo: 'knights',
  cost: 2
};

const validation5 = isValidAction(gameState, exchangeInCheck);
console.log('Validation échange pions (roi en échec):', validation5.valid);

if (!validation5.valid) {
  console.log('✅ Échange correctement bloqué:', validation5.reason);
} else {
  console.log('❌ ERREUR: Échange autorisé alors que le roi est en échec');
}

console.log('\n🎉 Tests terminés!');
console.log('\n📊 Résumé:');
console.log(`- Génération normale: ${validation1.valid ? 'OK' : 'ÉCHEC'}`);
console.log(`- Échange normal: ${validation2.valid ? 'OK' : 'ÉCHEC'}`);
console.log(`- Génération en échec: ${!validation4.valid ? 'OK (bloqué)' : 'ÉCHEC (autorisé)'}`);
console.log(`- Échange en échec: ${!validation5.valid ? 'OK (bloqué)' : 'ÉCHEC (autorisé)'}`);
