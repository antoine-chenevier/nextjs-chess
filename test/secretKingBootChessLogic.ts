// Tests pour vérifier l'intégration de la logique d'échecs dans Secret King Boot

import { 
  createInitialGameState, 
  createTestCheckState,
  createTestCheckmateState,
  updateGameStateWithChessLogic,
  isChessMoveLegal 
} from '../src/secretKingBoot/gameLogic';
import { getPossibleMoves } from '../src/secretKingBoot/gameAnalysis';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

/**
 * Test : Un roi en échec ne peut pas faire de mouvements qui le laissent en échec
 */
function testKingInCheckMovementRestrictions() {
  console.log('=== Test : Restrictions de mouvement quand le roi est en échec ===');
  
  const gameState = createTestCheckState();
  console.log('État de test créé avec le roi blanc en échec');
  console.log('Statut de jeu:', gameState.gameStatus);
  
  // Obtenir les mouvements possibles pour le joueur en échec
  const possibleMoves = getPossibleMoves(gameState, 'move_piece');
  console.log(`Nombre de mouvements possibles : ${possibleMoves.length}`);
  
  // Vérifier que tous les mouvements possibles sortent le roi d'échec
  for (const move of possibleMoves) {
    console.log(`Mouvement testé : ${move.from} -> ${move.to}`);
    const isLegal = isChessMoveLegal(gameState, move.from!, move.to!);
    console.log(`  Légal : ${isLegal ? 'Oui' : 'Non'}`);
    
    if (!isLegal) {
      console.error(`❌ Mouvement illégal détecté : ${move.from} -> ${move.to}`);
      return false;
    }
  }
  
  console.log('✅ Tous les mouvements possibles sont légaux');
  return true;
}

/**
 * Test : Vérification qu'un mouvement qui met son propre roi en échec est rejeté
 */
function testIllegalMovementRejection() {
  console.log('\n=== Test : Rejet des mouvements qui mettent le roi en échec ===');
  
  // Créer un état de test
  const gameState = createInitialGameState();
  
  // Placer quelques pièces pour créer une situation de test
  gameState.gamePhase = 'playing';
  gameState.board[0] = [null, null, null, null, 'WhiteKing', null, null, null];
  gameState.board[1] = [null, null, null, null, 'WhitePawn', null, null, null];
  gameState.board[7] = [null, null, null, null, 'BlackQueen', null, null, null];
  gameState.whiteKingPosition = 'E1';
  
  console.log('État de test créé avec roi blanc en E1, pion en E2, dame noire en E8');
  
  // Tenter de déplacer le pion devant le roi (mouvement qui exposerait le roi)
  const illegalMove: GameAction = {
    type: 'move_piece',
    player: 'white',
    turn: 1,
    from: 'E2',
    to: 'E3',
    piece: 'WhitePawn'
  };
  
  console.log('Test du mouvement : E2 -> E3 (expose le roi)');
  const isLegal = isChessMoveLegal(gameState, 'E2', 'E3');
  console.log(`Mouvement légal : ${isLegal ? 'Oui' : 'Non'}`);
  
  if (isLegal) {
    console.error('❌ Mouvement illégal accepté à tort');
    return false;
  }
  
  console.log('✅ Mouvement illégal correctement rejeté');
  return true;
}

/**
 * Test : Situation d'échec et mat
 */
function testCheckmateDetection() {
  console.log('\n=== Test : Détection de l\'échec et mat ===');
  
  const gameState = createTestCheckmateState();
  console.log('État de test créé avec situation de mat');
  console.log('Statut de jeu:', gameState.gameStatus);
  
  // Vérifier que le statut indique échec et mat
  if (gameState.gameStatus?.status !== 'checkmate') {
    console.error('❌ Échec et mat non détecté');
    return false;
  }
  
  // Vérifier qu'il n'y a aucun mouvement possible
  const possibleMoves = getPossibleMoves(gameState, 'move_piece');
  console.log(`Nombre de mouvements possibles : ${possibleMoves.length}`);
  
  if (possibleMoves.length > 0) {
    console.error('❌ Des mouvements sont possibles en situation de mat');
    return false;
  }
  
  console.log('✅ Échec et mat correctement détecté');
  return true;
}

/**
 * Test : Intégration complète avec actions
 */
function testCompleteIntegration() {
  console.log('\n=== Test : Intégration complète avec actions ===');
  
  let gameState = createInitialGameState();
  
  // Setup phase : placer les rois
  gameState.gamePhase = 'setup';
  
  const placeWhiteKing: GameAction = {
    type: 'place_king',
    player: 'white',
    turn: 1,
    to: 'E1'
  };
  
  gameState = applyAction(gameState, placeWhiteKing);
  console.log('Roi blanc placé en E1');
  
  const placeBlackKing: GameAction = {
    type: 'place_king',
    player: 'black', 
    turn: 1,
    to: 'E8'
  };
  
  gameState.currentPlayer = 'black';
  gameState = applyAction(gameState, placeBlackKing);
  console.log('Roi noir placé en E8');
  
  // Passer en phase de jeu
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Ajouter quelques pièces
  gameState.board[1][4] = 'WhitePawn';
  gameState.board[6][4] = 'BlackPawn';
  
  console.log('Pions placés, état de jeu initial prêt');
  
  // Tester un mouvement légal
  const legalMove: GameAction = {
    type: 'move_piece',
    player: 'white',
    turn: 2,
    from: 'E2',
    to: 'E4',
    piece: 'WhitePawn'
  };
  
  console.log('Test mouvement légal : E2 -> E4');
  const newState = applyAction(gameState, legalMove);
  
  if (newState.board[3][4] !== 'WhitePawn') {
    console.error('❌ Mouvement légal non appliqué');
    return false;
  }
  
  console.log('✅ Intégration complète fonctionnelle');
  return true;
}

/**
 * Exécuter tous les tests
 */
export function runAllTests() {
  console.log('🧪 Début des tests de logique d\'échecs Secret King Boot\n');
  
  const results = [
    testKingInCheckMovementRestrictions(),
    testIllegalMovementRejection(),
    testCheckmateDetection(),
    testCompleteIntegration()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 Résultats des tests : ${passed}/${total} réussis`);
  
  if (passed === total) {
    console.log('🎉 Tous les tests sont passés !');
  } else {
    console.log('⚠️  Certains tests ont échoué');
  }
  
  return passed === total;
}

// Exporter les fonctions individuelles pour utilisation
export {
  testKingInCheckMovementRestrictions,
  testIllegalMovementRejection, 
  testCheckmateDetection,
  testCompleteIntegration
};
