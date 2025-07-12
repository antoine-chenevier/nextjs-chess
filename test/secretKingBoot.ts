import { expect } from 'chai';
import { 
  createInitialGameState, 
  isValidAction, 
  applyAction,
  SecretKingBootGameState,
  GameAction 
} from '../src/secretKingBoot';

describe('Secret King Boot Game', () => {
  
  describe('Initial Game State', () => {
    it('should create a valid initial state', () => {
      const gameState = createInitialGameState();
      
      expect(gameState.currentPlayer).to.equal('white');
      expect(gameState.turn).to.equal(1);
      expect(gameState.gamePhase).to.equal('setup');
      expect(gameState.whiteKingPosition).to.be.null;
      expect(gameState.blackKingPosition).to.be.null;
      expect(gameState.whiteReserve.pawns).to.equal(0);
      expect(gameState.blackReserve.pawns).to.equal(0);
    });
  });

  describe('King Placement', () => {
    it('should allow valid king placement for white', () => {
      const gameState = createInitialGameState();
      const action: GameAction = {
        type: 'place_king',
        player: 'white',
        turn: 1,
        to: 'E1'
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.true;
    });
    
    it('should reject invalid king placement', () => {
      const gameState = createInitialGameState();
      const action: GameAction = {
        type: 'place_king',
        player: 'white',
        turn: 1,
        to: 'C3' // Position invalide
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include('Position invalide');
    });
    
    it('should apply king placement correctly', () => {
      const gameState = createInitialGameState();
      const action: GameAction = {
        type: 'place_king',
        player: 'white',
        turn: 1,
        to: 'E1'
      };
      
      const newState = applyAction(gameState, action);
      expect(newState.whiteKingPosition).to.equal('E1');
      expect(newState.board[0][4]).to.equal('WhiteKing'); // E1 = [0][4]
      expect(newState.currentPlayer).to.equal('black');
    });
  });

  describe('Pawn Generation', () => {
    it('should allow pawn generation when under limit', () => {
      const gameState = createInitialGameState();
      gameState.gamePhase = 'playing';
      
      const action: GameAction = {
        type: 'generate_pawn',
        player: 'white',
        turn: 1
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.true;
    });
    
    it('should reject pawn generation when at limit', () => {
      const gameState = createInitialGameState();
      gameState.gamePhase = 'playing';
      gameState.whiteReserve.pawns = 8; // Limite atteinte
      
      const action: GameAction = {
        type: 'generate_pawn',
        player: 'white',
        turn: 1
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include('Limite de pions');
    });
    
    it('should apply pawn generation correctly', () => {
      const gameState = createInitialGameState();
      gameState.gamePhase = 'playing';
      
      const action: GameAction = {
        type: 'generate_pawn',
        player: 'white',
        turn: 1
      };
      
      const newState = applyAction(gameState, action);
      expect(newState.whiteReserve.pawns).to.equal(1);
      expect(newState.currentPlayer).to.equal('black');
    });
  });

  describe('Piece Exchange', () => {
    it('should allow valid piece exchange', () => {
      const gameState = createInitialGameState();
      gameState.gamePhase = 'playing';
      gameState.whiteReserve.pawns = 3;
      
      const action: GameAction = {
        type: 'exchange_pieces',
        player: 'white',
        turn: 1,
        exchangeFrom: 'pawn',
        exchangeTo: 'bishop',
        cost: 3
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.true;
    });
    
    it('should reject exchange with insufficient pawns', () => {
      const gameState = createInitialGameState();
      gameState.gamePhase = 'playing';
      gameState.whiteReserve.pawns = 1; // Pas assez
      
      const action: GameAction = {
        type: 'exchange_pieces',
        player: 'white',
        turn: 1,
        exchangeFrom: 'pawn',
        exchangeTo: 'knight',
        cost: 2
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include('Pas assez de pions');
    });
    
    it('should apply piece exchange correctly', () => {
      const gameState = createInitialGameState();
      gameState.gamePhase = 'playing';
      gameState.whiteReserve.pawns = 4;
      
      const action: GameAction = {
        type: 'exchange_pieces',
        player: 'white',
        turn: 1,
        exchangeFrom: 'pawn',
        exchangeTo: 'rook',
        cost: 4
      };
      
      const newState = applyAction(gameState, action);
      expect(newState.whiteReserve.pawns).to.equal(0);
      expect(newState.whiteReserve.rooks).to.equal(1);
      expect(newState.currentPlayer).to.equal('black');
    });
  });

  describe('Complete Game Setup', () => {
    it('should transition to playing phase after both kings are placed', () => {
      let gameState = createInitialGameState();
      
      // Placer le roi blanc
      const whiteKingAction: GameAction = {
        type: 'place_king',
        player: 'white',
        turn: 1,
        to: 'E1'
      };
      gameState = applyAction(gameState, whiteKingAction);
      expect(gameState.gamePhase).to.equal('setup');
      expect(gameState.currentPlayer).to.equal('black');
      
      // Placer le roi noir
      const blackKingAction: GameAction = {
        type: 'place_king',
        player: 'black',
        turn: 1,
        to: 'D8'
      };
      gameState = applyAction(gameState, blackKingAction);
      expect(gameState.gamePhase).to.equal('playing');
      expect(gameState.currentPlayer).to.equal('white'); // Blanc commence
      expect(gameState.whiteKingPosition).to.equal('E1');
      expect(gameState.blackKingPosition).to.equal('D8');
    });
  });

  describe('Wrong Player Turn', () => {
    it('should reject actions from wrong player', () => {
      const gameState = createInitialGameState();
      // currentPlayer est 'white'
      
      const action: GameAction = {
        type: 'place_king',
        player: 'black', // Mauvais joueur
        turn: 1,
        to: 'D8'
      };
      
      const validation = isValidAction(gameState, action);
      expect(validation.valid).to.be.false;
      expect(validation.reason).to.include("Ce n'est pas le tour");
    });
  });
});
