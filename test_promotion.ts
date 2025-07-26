import { createInitialGameState } from './src/secretKingBoot/gameLogic';
import { applyAction } from './src/secretKingBoot/gameActions';
import { getAvailableActions } from './src/secretKingBoot/gameAnalysis';
import { SecretKingBootGameState, GameAction } from './src/secretKingBoot/types';

console.log('🧪 Test du système de promotion des pions');

// Créer un état de jeu avec un pion près de la promotion
function createPromotionTestState(): SecretKingBootGameState {
  const gameState = createInitialGameState();
  
  // Placer les rois
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.gamePhase = 'playing';
  
  // Mettre un roi blanc en E1 et noir en E8
  gameState.board[0][4] = 'WhiteKing';
  gameState.board[7][4] = 'BlackKing';
  
  // Placer un pion blanc en 7ème rangée (prêt à être promu)
  gameState.board[6][0] = 'WhitePawn'; // A7
  
  // Mettre quelques pièces en réserve
  gameState.whiteReserve.pawns = 2;
  gameState.blackReserve.pawns = 2;
  
  return gameState;
}

// Test 1: Déplacer un pion à la dernière rangée
console.log('\n📋 Test 1: Mouvement de pion vers la dernière rangée');

let gameState = createPromotionTestState();
console.log('État initial:');
console.log('- Pion blanc en A7:', gameState.board[6][0]);
console.log('- Actions disponibles:', getAvailableActions(gameState));

// Déplacer le pion de A7 à A8
const moveAction: GameAction = {
  type: 'move_piece',
  player: 'white',
  turn: gameState.turn,
  from: 'A7',
  to: 'A8'
};

console.log('\n🚀 Application du mouvement A7 → A8');
gameState = applyAction(gameState, moveAction);

console.log('État après mouvement:');
console.log('- Case A8:', gameState.board[7][0]);
console.log('- Promotion requise:', gameState.promotionRequired);
console.log('- Actions disponibles:', getAvailableActions(gameState));

if (gameState.promotionRequired) {
  console.log('✅ Promotion correctement détectée!');
  console.log('- De:', gameState.promotionRequired.from);
  console.log('- Vers:', gameState.promotionRequired.to);
  console.log('- Joueur:', gameState.promotionRequired.player);
  
  // Test 2: Sélectionner une pièce de promotion
  console.log('\n📋 Test 2: Sélection de la Dame pour la promotion');
  
  const promotionAction: GameAction = {
    type: 'select_promotion',
    player: 'white',
    turn: gameState.turn,
    piece: 'Queen'
  };
  
  console.log('🎯 Application de la promotion en Dame');
  gameState = applyAction(gameState, promotionAction);
  
  console.log('État après promotion:');
  console.log('- Case A8:', gameState.board[7][0]);
  console.log('- Promotion requise:', gameState.promotionRequired);
  console.log('- Actions disponibles:', getAvailableActions(gameState));
  
  if (gameState.board[7][0] === 'WhiteQueen') {
    console.log('✅ Promotion en Dame réussie!');
  } else {
    console.log('❌ Promotion échouée');
  }
} else {
  console.log('❌ Promotion non détectée');
}

console.log('\n🏁 Test terminé');
