import { 
  createInitialGameState,
  isValidAction,
  updateGameStateWithChessLogic,
  isKingInCheck
} from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

/**
 * Test pour vérifier que quand un joueur est en échec, il ne peut jouer qu'un seul tour
 */

console.log('🧪 Test de correction - Pas de tours multiples en échec');

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

console.log('\n📋 Test 1: Situation normale - alternance des joueurs');
console.log(`Joueur actuel: ${gameState.currentPlayer}`);

// Test normal - placer une pièce
const placePawn1: GameAction = {
  type: 'place_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  to: 'A2',
  piece: 'Pawn'
};

if (isValidAction(gameState, placePawn1).valid) {
  const previousPlayer = gameState.currentPlayer;
  gameState = applyAction(gameState, placePawn1);
  console.log(`Après placement pion: ${previousPlayer} -> ${gameState.currentPlayer}`);
  console.log('✅ Changement de joueur normal');
} else {
  console.log('❌ Impossible de placer le pion');
}

console.log('\n📋 Test 2: Créer une situation d\'échec');

// Placer une tour blanche qui met le roi noir en échec
const placeTowerCheck: GameAction = {
  type: 'place_piece',
  player: gameState.currentPlayer,
  turn: gameState.turn,
  to: 'E7', // Une case devant le roi noir
  piece: 'Rook'
};

if (isValidAction(gameState, placeTowerCheck).valid) {
  const previousPlayer = gameState.currentPlayer;
  gameState = applyAction(gameState, placeTowerCheck);
  console.log(`Après placement tour: ${previousPlayer} -> ${gameState.currentPlayer}`);
  
  // Mettre à jour avec la logique d'échecs pour détecter l'échec
  gameState = updateGameStateWithChessLogic(gameState);
  
  console.log('État du jeu après analyse:', gameState.gameStatus?.status);
  console.log('Joueur en échec:', gameState.gameStatus?.player);
  console.log('Roi noir en échec?', isKingInCheck(gameState, 'black'));
  
  if (gameState.gameStatus?.status === 'check' && gameState.gameStatus?.player === 'black') {
    console.log('✅ Échec correctement détecté');
  } else {
    console.log('❌ Échec non détecté');
  }
} else {
  console.log('❌ Impossible de placer la tour');
}

console.log('\n📋 Test 3: Vérifier l\'alternance après un mouvement en échec');
console.log(`Joueur actuel (doit être noir et en échec): ${gameState.currentPlayer}`);

// Maintenant le joueur noir est en échec et doit faire un mouvement pour sortir de l'échec
// Essayons de déplacer le roi noir
const moveKingBlack: GameAction = {
  type: 'move_piece',
  player: 'black',
  turn: gameState.turn,
  from: 'E8',
  to: 'D8', // Déplacer le roi noir vers D8 pour sortir de l'échec
  piece: 'BlackKing'
};

if (isValidAction(gameState, moveKingBlack).valid) {
  const previousPlayer = gameState.currentPlayer;
  const previousTurn = gameState.turn;
  gameState = applyAction(gameState, moveKingBlack);
  
  console.log(`Après mouvement du roi noir: ${previousPlayer} -> ${gameState.currentPlayer}`);
  console.log(`Tour: ${previousTurn} -> ${gameState.turn}`);
  
  // Vérifier que l'échec est résolu
  const newStatus = gameState.gameStatus?.status;
  console.log('Nouveau statut du jeu:', newStatus);
  console.log('Roi noir encore en échec?', isKingInCheck(gameState, 'black'));
  
  if (gameState.currentPlayer === 'white') {
    console.log('✅ Changement de joueur correct après sortie d\'échec');
  } else {
    console.log('❌ ERREUR: Le joueur noir peut encore jouer!');
  }
} else {
  console.log('❌ Mouvement du roi invalide:', isValidAction(gameState, moveKingBlack).reason);
}

console.log('\n📋 Test 4: Vérifier qu\'on ne peut pas jouer deux tours consécutifs');

// Essayer de faire jouer le noir une seconde fois (ne devrait pas être possible)
const attemptSecondMove: GameAction = {
  type: 'place_piece',
  player: 'black', // Mauvais joueur - c'est au tour du blanc
  turn: gameState.turn,
  to: 'H7',
  piece: 'Pawn'
};

const validation = isValidAction(gameState, attemptSecondMove);
if (!validation.valid) {
  console.log('✅ Second mouvement correctement rejeté:', validation.reason);
} else {
  console.log('❌ ERREUR: Second mouvement autorisé!');
}

console.log('\n🎉 Tests terminés!');
console.log('\n📊 Résumé de l\'état final:');
console.log(`- Joueur actuel: ${gameState.currentPlayer}`);
console.log(`- Tour: ${gameState.turn}`);
console.log(`- Statut: ${gameState.gameStatus?.status || 'playing'}`);
console.log(`- Roi blanc en échec: ${isKingInCheck(gameState, 'white')}`);
console.log(`- Roi noir en échec: ${isKingInCheck(gameState, 'black')}`);
