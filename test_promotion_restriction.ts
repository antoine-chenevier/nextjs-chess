import { createInitialGameState } from './src/secretKingBoot/gameLogic';
import { applyAction } from './src/secretKingBoot/gameActions';
import { isValidAction } from './src/secretKingBoot/gameLogic';
import { SecretKingBootGameState, GameAction } from './src/secretKingBoot/types';

console.log('🧪 Test de la promotion avec restriction des pièces uniques');

// Créer un état de test avec restriction de pièces et promotion
function createPromotionRestrictionTestState(): SecretKingBootGameState {
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
  
  // IMPORTANT: Placer déjà une Dame blanche sur l'échiquier pour tester la restriction
  state.board[0][3] = 'WhiteQueen'; // D1
  
  // Ajouter quelques pièces en réserve
  state.whiteReserve.pawns = 2;
  state.whiteReserve.knights = 1;
  state.whiteReserve.bishops = 1;
  state.whiteReserve.rooks = 1;
  
  return state;
}

let gameState = createPromotionRestrictionTestState();

console.log('État initial:');
console.log('- Pion en A7:', gameState.board[6][0]);
console.log('- Dame déjà en D1:', gameState.board[0][3]);
console.log('- Réserve blanche:', gameState.whiteReserve);

// Test 1: Déplacer le pion de A7 à A8 (déclenche la promotion)
const moveAction: GameAction = {
  type: 'move_piece',
  player: 'white',
  turn: gameState.turn,
  from: 'A7',
  to: 'A8'
};

console.log('\n📋 Test 1: Mouvement A7 → A8 (déclenchement promotion)');
const moveValidation = isValidAction(gameState, moveAction);

if (moveValidation.valid) {
  gameState = applyAction(gameState, moveAction);
  
  console.log('État après mouvement:');
  console.log('- Case A8:', gameState.board[7][0]);
  console.log('- Promotion requise:', gameState.promotionRequired);
  
  if (gameState.promotionRequired) {
    console.log('✅ Promotion correctement détectée!');
    
    // Test 2: Essayer de promouvoir en Dame (alors qu'il y en a déjà une)
    console.log('\n📋 Test 2: Promotion en Dame (restriction test)');
    
    const queenPromotionAction: GameAction = {
      type: 'select_promotion',
      player: 'white',
      turn: gameState.turn,
      piece: 'Queen'
    };
    
    const queenValidation = isValidAction(gameState, queenPromotionAction);
    console.log('Validation promotion en Dame:', queenValidation);
    
    if (queenValidation.valid) {
      console.log('🟡 Promotion en Dame acceptée (peut indiquer que la restriction ne s\'applique pas)');
      
      gameState = applyAction(gameState, queenPromotionAction);
      console.log('- Case A8 après promotion:', gameState.board[7][0]);
      console.log('- Promotion terminée:', !gameState.promotionRequired);
      
      if (gameState.board[7][0] === 'WhiteQueen') {
        console.log('✅ Promotion en Dame réussie même avec une Dame existante');
        console.log('📝 RÉSULTAT: La promotion N\'EST PAS affectée par la restriction (comportement souhaité)');
      }
    } else {
      console.log('🔴 Promotion en Dame refusée:', queenValidation.reason);
      console.log('📝 RÉSULTAT: La promotion EST affectée par la restriction (besoin de correction)');
      
      // Test 3: Essayer de promouvoir en Cavalier (pas encore sur l'échiquier)
      console.log('\n📋 Test 3: Promotion en Cavalier (pas de restriction)');
      
      const knightPromotionAction: GameAction = {
        type: 'select_promotion',
        player: 'white',
        turn: gameState.turn,
        piece: 'Knight'
      };
      
      const knightValidation = isValidAction(gameState, knightPromotionAction);
      console.log('Validation promotion en Cavalier:', knightValidation);
      
      if (knightValidation.valid) {
        gameState = applyAction(gameState, knightPromotionAction);
        console.log('- Case A8 après promotion en Cavalier:', gameState.board[7][0]);
      }
    }
  } else {
    console.log('❌ Promotion non détectée');
  }
} else {
  console.log('❌ Mouvement invalide:', moveValidation.reason);
}

console.log('\n🏁 Test terminé');
