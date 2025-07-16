/**
 * Test de débogage pour comprendre le problème d'alternance
 * Usage: npx tsx test/debugTurnTest.ts
 */

import { createInitialGameState, isValidAction } from '../src/secretKingBoot/gameLogic';
import { applyAction } from '../src/secretKingBoot/gameActions';
import { GameAction } from '../src/secretKingBoot/types';

console.log('🔍 Test de débogage - Alternance des joueurs');
console.log('===============================================');

// Créer une situation d'échec simple
function createSimpleCheckState() {
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
  
  // Configuration de l'état
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  gameState.turn = 5; // Tour arbitraire
  
  // État d'échec
  gameState.gameStatus = {
    status: 'check',
    player: 'white'
  };
  
  return gameState;
}

const initialState = createSimpleCheckState();

console.log('🎯 État initial:');
console.log(`- Joueur actuel: ${initialState.currentPlayer}`);
console.log(`- Tour: ${initialState.turn}`);
console.log(`- Statut: ${initialState.gameStatus?.status}`);
console.log(`- Phase: ${initialState.gamePhase}`);
console.log(`- Historique: ${initialState.moveHistory.length} actions`);

// Tenter un mouvement du roi
const kingMove: GameAction = {
  type: 'move_piece',
  player: 'white',
  turn: 5,
  from: 'E1',
  to: 'D1',
  piece: 'WhiteKing'
};

console.log('\n⚔️ Test du mouvement:');
console.log(`- Action: ${kingMove.type} de ${kingMove.from} à ${kingMove.to}`);
console.log(`- Joueur: ${kingMove.player}`);

// Valider l'action
const validation = isValidAction(initialState, kingMove);
console.log(`\n✅ Validation:`);
console.log(`- Valide: ${validation.valid}`);
console.log(`- Raison: ${validation.reason || 'Aucune'}`);

if (validation.valid) {
  console.log('\n🎬 Application de l\'action...');
  
  // Log détaillé de l'état avant application
  console.log('État AVANT applyAction:');
  console.log(`- currentPlayer: ${initialState.currentPlayer}`);
  console.log(`- turn: ${initialState.turn}`);
  console.log(`- gamePhase: ${initialState.gamePhase}`);
  console.log(`- gameStatus: ${JSON.stringify(initialState.gameStatus)}`);
  
  const newState = applyAction(initialState, kingMove);
  
  console.log('\nÉtat APRÈS applyAction:');
  console.log(`- currentPlayer: ${newState.currentPlayer} (attendu: black)`);
  console.log(`- turn: ${newState.turn}`);
  console.log(`- gamePhase: ${newState.gamePhase}`);
  console.log(`- gameStatus: ${JSON.stringify(newState.gameStatus)}`);
  console.log(`- moveHistory length: ${newState.moveHistory.length}`);
  
  if (newState.moveHistory.length > 0) {
    const lastMove = newState.moveHistory[newState.moveHistory.length - 1];
    console.log(`- Dernière action: ${lastMove.type} par ${lastMove.player}`);
  }
  
  // Analyser pourquoi l'alternance n'a pas fonctionné
  if (newState.currentPlayer === initialState.currentPlayer) {
    console.log('\n❌ PROBLÈME: Le joueur n\'a pas changé !');
    console.log('Causes possibles:');
    console.log('1. La condition pour changer de joueur n\'est pas remplie');
    console.log('2. L\'action n\'est pas dans la liste des actions qui changent de joueur');
    console.log('3. La gamePhase ou gameStatus empêche le changement');
    
    // Vérifier les conditions
    console.log('\n🔍 Vérification des conditions:');
    console.log(`- gamePhase === 'playing': ${newState.gamePhase === 'playing'}`);
    console.log(`- gameStatus !== 'checkmate': ${newState.gameStatus?.status !== 'checkmate'}`);
    console.log(`- gameStatus !== 'stalemate': ${newState.gameStatus?.status !== 'stalemate'}`);
    
    if (newState.moveHistory.length > 0) {
      const lastAction = newState.moveHistory[newState.moveHistory.length - 1];
      const actionTypes = ['move_piece', 'move_king_and_place', 'place_piece'];
      console.log(`- Action type '${lastAction.type}' dans la liste: ${actionTypes.includes(lastAction.type)}`);
    }
  } else {
    console.log('\n✅ SUCCÈS: Le joueur a changé correctement !');
  }
} else {
  console.log('\n❌ Action invalide, ne peut pas tester l\'alternance');
}

console.log('\n🔍 Test de débogage terminé');
