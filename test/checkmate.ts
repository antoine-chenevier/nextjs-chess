import { 
  translateFen, 
  isInCheck, 
  isCheckmate, 
  isStalemate, 
  getGameState,
  getCompleteGameState,
  getAllLegalMoves,
  createInitialGameInfo,
  updateGameInfo,
  GameState,
  CompleteGameState,
  Board,
  Action,
  PieceType,
  PieceName
} from '../src/logic/index';

// Fonction utilitaire pour créer un plateau à partir d'une notation FEN
function createBoardFromFen(fen: string): Board {
  const pieces = translateFen(fen);
  return {
    pieces,
    castle: {
      2: { didMoveKing: false, didMoveShortTower: false, didMoveLongTower: false },
      3: { didMoveKing: false, didMoveShortTower: false, didMoveLongTower: false }
    }
  };
}

// Test 1: Mat du couloir
console.log('=== Test 1: Mat du couloir ===');
const corridor_mate_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQK2R b Kq - 0 1';
const corridorBoard = createBoardFromFen('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1');
console.log('Roi noir en échec:', isInCheck(corridorBoard, 3));
console.log('Roi noir en mat:', isCheckmate(corridorBoard, 3));
console.log('État du jeu pour les noirs:', getGameState(corridorBoard, 3));

// Test 2: Mat de l escalier
console.log('\n=== Test 2: Mat de l escalier ===');
const staircase_mate = createBoardFromFen('6k1/6pp/8/8/8/8/R7/R6K w - - 0 1');
console.log('Roi noir en échec:', isInCheck(staircase_mate, 3));
console.log('Roi noir en mat:', isCheckmate(staircase_mate, 3));

// Test 3: Pat (stalemate)
console.log('\n=== Test 3: Pat (stalemate) ===');
const stalemate_board = createBoardFromFen('8/8/8/8/8/8/p7/k1K5 w - - 0 1');
console.log('Roi noir en échec:', isInCheck(stalemate_board, 3));
console.log('Roi noir en pat:', isStalemate(stalemate_board, 3));
console.log('État du jeu pour les noirs:', getGameState(stalemate_board, 3));

// Test 4: Position normale avec echec simple
console.log('\n=== Test 4: Echec simple ===');
const simple_check = createBoardFromFen('rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2');
// Modifions pour avoir un échec
const check_board = createBoardFromFen('rnbqk1nr/pppp1ppp/8/2b1p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3');
console.log('Roi blanc en échec:', isInCheck(check_board, 2));
console.log('Mouvements légaux pour les blancs:', getAllLegalMoves(check_board, 2).length);

// Test 5: Test du GameInfo avec historique
console.log('\n=== Test 5: GameInfo complet ===');
const initial_board = createBoardFromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
const gameInfo = createInitialGameInfo(initial_board, 2);
console.log('État initial du jeu:', getCompleteGameState(gameInfo));
console.log('Joueur actuel:', gameInfo.currentPlayer === 2 ? 'Blanc' : 'Noir');
console.log('Compteur 50 coups:', gameInfo.fiftyMoveCounter);

// Test 6: Matériel insuffisant
console.log('\n=== Test 6: Matériel insuffisant ===');
const insufficient_material = createBoardFromFen('8/8/8/8/8/8/8/k1K5 w - - 0 1');
const gameInfoInsufficient = createInitialGameInfo(insufficient_material, 2);
console.log('État avec matériel insuffisant:', getCompleteGameState(gameInfoInsufficient));

console.log('\n=== Tous les tests terminés ===');
