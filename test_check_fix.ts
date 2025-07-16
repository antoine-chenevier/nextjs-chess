// Test simple pour vérifier la correction du problème d'échec

import { 
  createInitialGameState, 
  updateGameStateWithChessLogic,
  isChessMoveLegal 
} from './src/secretKingBoot/gameLogic';
import { applyAction, isPawnPromotion } from './src/secretKingBoot/gameActions';
import { isValidAction } from './src/secretKingBoot/gameLogic';
import { GameAction } from './src/secretKingBoot/types';

function testCheckBehavior() {
  console.log('=== Test : Comportement en situation d\'échec ===\n');
  
  // Créer un état de test
  let gameState = createInitialGameState();
  
  // Placer les rois
  gameState.whiteKingPosition = 'E1';
  gameState.blackKingPosition = 'E8';
  gameState.gamePhase = 'playing';
  gameState.currentPlayer = 'white';
  
  // Créer un plateau simple
  gameState.board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Placer les rois
  gameState.board[0][4] = 'WhiteKing'; // E1
  gameState.board[7][4] = 'BlackKing'; // E8
  
  // Placer une tour blanche en E7 pour mettre le roi noir en échec
  gameState.board[6][4] = 'WhiteRook'; // E7
  // Placer une autre tour en F7 pour limiter les options du roi noir
  gameState.board[6][5] = 'WhiteRook'; // F7
  
  console.log('État initial créé :');
  console.log('- Roi blanc en E1');
  console.log('- Roi noir en E8');
  console.log('- Tour blanche en E7 (met le roi noir en échec)');
  console.log('- Tour blanche en F7 (limite les mouvements du roi)');
  console.log('- Joueur actuel : blanc\n');
  
  // Mettre à jour avec la logique d'échecs
  gameState = updateGameStateWithChessLogic(gameState);
  
  console.log('Statut après analyse :', gameState.gameStatus);
  console.log('Joueur actuel :', gameState.currentPlayer, '\n');
  
  // Test 1: Faire un mouvement blanc qui met le roi noir en échec
  const moveAction: GameAction = {
    type: 'move_piece',
    player: 'white',
    turn: 1,
    from: 'E7',
    to: 'E8', // Essayer de capturer le roi (devrait être bloqué)
    piece: 'WhiteRook'
  };
  
  console.log('Test 1: Tentative de capture du roi noir (E7 -> E8)');
  const validation = isValidAction(gameState, moveAction);
  console.log('Action valide :', validation.valid);
  console.log('Raison :', validation.reason);
  
  if (!validation.valid) {
    console.log('✅ Capture du roi correctement bloquée\n');
  } else {
    console.log('❌ Capture du roi autorisée à tort\n');
  }
  
  // Test 2: Faire un mouvement blanc légal
  const legalMoveAction: GameAction = {
    type: 'move_piece',
    player: 'white',
    turn: 1,
    from: 'E7',
    to: 'E6', // Mouvement légal de la tour
    piece: 'WhiteRook'
  };
  
  console.log('Test 2: Mouvement légal blanc (E7 -> E6)');
  const legalValidation = isValidAction(gameState, legalMoveAction);
  console.log('Action valide :', legalValidation.valid);
  
  if (legalValidation.valid) {
    console.log('✅ Mouvement légal autorisé');
    
    // Appliquer le mouvement
    gameState = applyAction(gameState, legalMoveAction);
    console.log('Joueur actuel après le mouvement :', gameState.currentPlayer);
    console.log('Statut du jeu :', gameState.gameStatus);
    
    // Vérifier si le roi noir est en échec
    if (gameState.gameStatus?.status === 'check') {
      console.log('🚨 Roi noir en échec - doit être au tour des noirs');
      
      if (gameState.currentPlayer === 'black') {
        console.log('✅ C\'est bien au tour des noirs de jouer');
      } else {
        console.log('❌ Erreur : ce n\'est pas au tour des noirs');
      }
      
      // Test 3: Noir essaie de faire un mouvement qui ne sort pas d'échec
      const badBlackMove: GameAction = {
        type: 'move_piece',
        player: 'black',
        turn: 1,
        from: 'E8',
        to: 'F8', // Mouvement vers une case attaquée par la tour en F7
        piece: 'BlackKing'
      };
      
      console.log('\nTest 3: Noir essaie un mouvement vers case attaquée (E8 -> F8)');
      const badMoveValidation = isValidAction(gameState, badBlackMove);
      console.log('Action valide :', badMoveValidation.valid);
      
      if (!badMoveValidation.valid) {
        console.log('✅ Mouvement vers case attaquée correctement bloqué');
      } else {
        console.log('❌ Mouvement vers case attaquée autorisé à tort');
        
        // Appliquer quand même pour voir ce qui se passe
        gameState = applyAction(gameState, badBlackMove);
        console.log('Joueur actuel après mouvement illégal :', gameState.currentPlayer);
        console.log('Statut du jeu :', gameState.gameStatus);
      }
      
      // Test 4: Noir fait un mouvement qui sort d'échec
      const goodBlackMove: GameAction = {
        type: 'move_piece',
        player: 'black',
        turn: 1,
        from: 'E8',
        to: 'D8', // Mouvement qui sort d'échec
        piece: 'BlackKing'
      };
      
      console.log('\nTest 4: Noir fait un mouvement qui sort d\'échec (E8 -> D8)');
      const goodMoveValidation = isValidAction(gameState, goodBlackMove);
      console.log('Action valide :', goodMoveValidation.valid);
      
      if (goodMoveValidation.valid) {
        console.log('✅ Mouvement qui sort d\'échec autorisé');
        
        // Appliquer le mouvement
        gameState = applyAction(gameState, goodBlackMove);
        console.log('Joueur actuel après mouvement qui sort d\'échec :', gameState.currentPlayer);
        console.log('Statut du jeu :', gameState.gameStatus);
        
        if (gameState.currentPlayer === 'white' && gameState.gameStatus?.status === 'playing') {
          console.log('✅ Tour correctement passé aux blancs après résolution de l\'échec');
        } else {
          console.log('❌ Problème avec le changement de tour après résolution d\'échec');
        }
      } else {
        console.log('❌ Mouvement qui sort d\'échec bloqué à tort');
      }
    }
  } else {
    console.log('❌ Mouvement légal bloqué');
  }
}

// Exécuter le test
testCheckBehavior();
