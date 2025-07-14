/**
 * Script de démonstration - Configuration initiale "La Botte Secrète du Roi"
 * 
 * Ce script montre comment la réserve initiale (4 pions, 1 cavalier, 1 fou, 1 tour)
 * ouvre de nombreuses possibilités stratégiques dès le début de la partie.
 */

import { 
  createInitialGameState
} from './gameLogic';
import {
  applyAction
} from './gameActions';
import {
  getAvailableActions,
  getPossibleMoves 
} from './gameAnalysis';

function demonstrateInitialStrategies() {
  console.log('=== DÉMONSTRATION: La Botte Secrète du Roi ===\n');
  
  // Créer une nouvelle partie
  let gameState = createInitialGameState();
  
  console.log('📋 RÉSERVE INITIALE:');
  console.log(`Blanc: ${JSON.stringify(gameState.whiteReserve, null, 2)}`);
  console.log(`Noir: ${JSON.stringify(gameState.blackReserve, null, 2)}`);
  console.log();
  
  // Phase 1: Placement des rois
  console.log('🏰 PHASE 1: Placement des rois');
  
  gameState = applyAction(gameState, {
    type: 'place_king',
    player: 'white',
    turn: 1,
    to: 'E1'
  });
  console.log('✅ Roi blanc placé en E1');
  
  gameState = applyAction(gameState, {
    type: 'place_king',
    player: 'black',
    turn: 1,
    to: 'D8'
  });
  console.log('✅ Roi noir placé en D8');
  console.log(`Phase de jeu: ${gameState.gamePhase}\n`);
  
  // Phase 2: Premières actions tactiques
  console.log('⚡ PHASE 2: Premières actions tactiques possibles');
  
  const availableActions = getAvailableActions(gameState);
  console.log(`Actions disponibles pour ${gameState.currentPlayer}:`, availableActions);
  console.log();
  
  // Stratégie 1: Développement rapide avec placement de pièces
  console.log('🎯 STRATÉGIE 1: Développement rapide');
  
  // Blanc place un cavalier
  gameState = applyAction(gameState, {
    type: 'place_piece',
    player: 'white',
    turn: 2,
    piece: 'Knight',
    to: 'G1'
  });
  console.log('♘ Blanc place cavalier en G1');
  console.log(`Réserve blanc: cavaliers=${gameState.whiteReserve.knights}`);
  
  // Noir place un fou
  gameState = applyAction(gameState, {
    type: 'place_piece',
    player: 'black',
    turn: 2,
    piece: 'Bishop',
    to: 'C8'
  });
  console.log('♗ Noir place fou en C8');
  console.log(`Réserve noir: fous=${gameState.blackReserve.bishops}`);
  
  // Stratégie 2: Contrôle du centre avec pions
  console.log('\n🎯 STRATÉGIE 2: Contrôle du centre');
  
  // Blanc place un pion central
  gameState = applyAction(gameState, {
    type: 'place_piece',
    player: 'white',
    turn: 3,
    piece: 'Pawn',
    to: 'D4'
  });
  console.log('♙ Blanc place pion en D4 (contrôle central)');
  console.log(`Réserve blanc: pions=${gameState.whiteReserve.pawns}`);
  
  // Stratégie 3: Utilisation du coup spécial roi + placement
  console.log('\n🎯 STRATÉGIE 3: Coup spécial roi + placement');
  
  // Noir utilise le coup spécial: déplace le roi et place une tour
  gameState = applyAction(gameState, {
    type: 'move_king_and_place',
    player: 'black',
    turn: 3,
    from: 'D8',
    to: 'E8',
    piece: 'Rook'
  });
  console.log('👑 Noir: Roi D8→E8 + Tour placée en D8 (1 seul coup!)');
  console.log(`Réserve noir: tours=${gameState.blackReserve.rooks}`);
  
  // Analyse finale
  console.log('\n📊 ANALYSE DE LA POSITION:');
  console.log('Pièces sur l\'échiquier:');
  
  let pieceCount = { white: 0, black: 0 };
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = gameState.board[rank][file];
      if (piece) {
        if (piece.startsWith('White')) pieceCount.white++;
        else pieceCount.black++;
        
        const position = String.fromCharCode(65 + file) + (rank + 1);
        console.log(`  ${position}: ${piece}`);
      }
    }
  }
  
  console.log(`\nNombre de pièces: Blanc=${pieceCount.white}, Noir=${pieceCount.black}`);
  console.log('\nRéserves restantes:');
  console.log(`Blanc: ${JSON.stringify(gameState.whiteReserve, null, 2)}`);
  console.log(`Noir: ${JSON.stringify(gameState.blackReserve, null, 2)}`);
  
  console.log('\n🏆 AVANTAGES de cette configuration initiale:');
  console.log('• Développement immédiat possible (pas besoin de générer)');
  console.log('• Choix tactiques dès les premiers coups');
  console.log('• Économie de coups (pas de génération obligatoire)');
  console.log('• Stratégies d\'ouverture variées');
  console.log('• Équilibre entre développement et réserve');
}

// Exporter pour utilisation dans des tests ou démos
export { demonstrateInitialStrategies };

// Exécuter si appelé directement
if (require.main === module) {
  demonstrateInitialStrategies();
}
