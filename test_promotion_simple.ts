import { createInitialGameState } from './src/secretKingBoot/gameLogic';
import { applyAction } from './src/secretKingBoot/gameActions';
import { isValidAction } from './src/secretKingBoot/gameLogic';
import { SecretKingBootGameState, GameAction } from './src/secretKingBoot/types';

console.log('🧪 Test simple du système de promotion');

// Créer un état de test avec un pion prêt à être promu
function createTestState(): SecretKingBootGameState {
  const state = createInitialGameState();
  
  // Configuration basique
  state.gamePhase = 'playing';
  state.whiteKingPosition = 'E1';
  state.blackKingPosition = 'E8';
  
  // Mettre les rois sur l'échiquier
  state.board[0][4] = 'WhiteKing'; // E1
  state.board[7][4] = 'BlackKing'; // E8
  
  // Mettre un pion blanc en 7ème rangée (prêt à être promu)
  state.board[6][0] = 'WhitePawn'; // A7
  
  return state;
}

let gameState = createTestState();

console.log('État initial:');
console.log('- Pion en A7:', gameState.board[6][0]);
console.log('- Promotion requise:', gameState.promotionRequired);

// Test 1: Déplacer le pion de A7 à A8
const moveAction: GameAction = {
  type: 'move_piece',
  player: 'white',
  turn: gameState.turn,
  from: 'A7',
  to: 'A8'
};

console.log('\n📋 Test 1: Mouvement A7 → A8');
console.log('Action:', moveAction);

const moveValidation = isValidAction(gameState, moveAction);
console.log('Validation du mouvement:', moveValidation);

if (moveValidation.valid) {
  gameState = applyAction(gameState, moveAction);
  console.log('État après mouvement:');
  console.log('- Case A8:', gameState.board[7][0]);
  console.log('- Promotion requise:', gameState.promotionRequired);
  console.log('- Joueur actuel:', gameState.currentPlayer);
  
  if (gameState.promotionRequired) {
    console.log('\n📋 Test 2: Sélection de Dame pour promotion');
    
    const promotionAction: GameAction = {
      type: 'select_promotion',
      player: 'white',
      turn: gameState.turn,
      piece: 'Queen'
    };
    
    console.log('Action de promotion:', promotionAction);
    
    const promotionValidation = isValidAction(gameState, promotionAction);
    console.log('Validation de la promotion:', promotionValidation);
    
    if (promotionValidation.valid) {
      gameState = applyAction(gameState, promotionAction);
      console.log('État final:');
      console.log('- Case A8:', gameState.board[7][0]);
      console.log('- Promotion requise:', gameState.promotionRequired);
      console.log('- Joueur actuel:', gameState.currentPlayer);
      
      if (gameState.board[7][0] === 'WhiteQueen') {
        console.log('✅ Promotion réussie!');
      } else {
        console.log('❌ Promotion échouée');
      }
    } else {
      console.log('❌ Promotion invalide:', promotionValidation.reason);
    }
  } else {
    console.log('❌ Promotion non détectée');
  }
} else {
  console.log('❌ Mouvement invalide:', moveValidation.reason);
}

console.log('\n🏁 Test terminé');
