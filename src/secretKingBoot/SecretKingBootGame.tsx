import React, { useState, useCallback } from 'react';
import styles from './SecretKingBoot.module.css';
import { 
  SecretKingBootGameState, 
  GameAction, 
  ActionType,
  Reserve 
} from './types';
import { 
  createInitialGameState, 
  isValidAction 
} from './gameLogic';
import { 
  applyAction 
} from './gameActions';
import { 
  getAvailableActions, 
  getPossibleMoves,
  analyzeGameState 
} from './gameAnalysis';

interface SecretKingBootGameProps {
  onGameEnd?: (winner: 'white' | 'black' | 'draw') => void;
  enableAI?: boolean;
  aiLevel?: 'easy' | 'medium' | 'hard';
}

export const SecretKingBootGame: React.FC<SecretKingBootGameProps> = ({
  onGameEnd,
  enableAI = false,
  aiLevel = 'medium'
}) => {
  
  const [gameState, setGameState] = useState<SecretKingBootGameState>(createInitialGameState);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<GameAction[]>([]);
  const [gameAnalysis, setGameAnalysis] = useState(null);
  
  // Effectuer une action
  const handleAction = useCallback((action: GameAction) => {
    const validation = isValidAction(gameState, action);
    
    if (!validation.valid) {
      alert(`Action invalide: ${validation.reason}`);
      return;
    }
    
    const newState = applyAction(gameState, action);
    setGameState(newState);
    
    // Analyser le nouvel état
    const analysis = analyzeGameState(newState);
    setGameAnalysis(analysis);
    
    // Vérifier si la partie est terminée (échec et mat)
    // TODO: Implémenter la détection de fin de partie
    
    // Reset des sélections
    setSelectedAction(null);
    setPossibleMoves([]);
    
  }, [gameState]);
  
  // Sélectionner un type d'action
  const handleActionSelection = useCallback((actionType: ActionType) => {
    setSelectedAction(actionType);
    const moves = getPossibleMoves(gameState, actionType);
    setPossibleMoves(moves);
  }, [gameState]);
  
  // Réinitialiser la partie
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelectedAction(null);
    setPossibleMoves([]);
    setGameAnalysis(null);
  }, []);
  
  const availableActions = getAvailableActions(gameState);
  const currentReserve = gameState.currentPlayer === 'white' ? 
    gameState.whiteReserve : gameState.blackReserve;
  
  return (
    <div className={styles.secretKingBootGame}>
      <div className={styles.gameHeader}>
        <h2>La Botte Secrète du Roi</h2>
        <div className={styles.gameInfo}>
          <div>Joueur: {gameState.currentPlayer === 'white' ? 'Blanc' : 'Noir'}</div>
          <div>Tour: {gameState.turn}</div>
          <div>Phase: {gameState.gamePhase === 'setup' ? 'Placement' : 'Jeu'}</div>
        </div>
        <button onClick={resetGame} className={styles.resetButton}>
          Nouvelle partie
        </button>
      </div>
      
      <div className={styles.gameContent}>
        {/* Échiquier */}
        <div className={styles.boardSection}>
          <ChessBoard 
            gameState={gameState}
            selectedAction={selectedAction}
            possibleMoves={possibleMoves}
            onSquareClick={(position) => {
              // Gérer les clics sur l'échiquier
              if (selectedAction && possibleMoves.length > 0) {
                // Chercher un mouvement correspondant
                let move = null;
                
                if (selectedAction === 'place_piece' || selectedAction === 'place_king') {
                  // Pour les placements, chercher par position de destination
                  move = possibleMoves.find(m => m.to === position);
                } else if (selectedAction === 'move_piece' || selectedAction === 'move_king_and_place') {
                  // Pour les déplacements, chercher par position de destination
                  move = possibleMoves.find(m => m.to === position);
                }
                
                if (move) {
                  handleAction(move);
                } else {
                  // Si aucun mouvement trouvé, afficher les mouvements possibles pour debugging
                  console.log('Aucun mouvement trouvé pour la position:', position);
                  console.log('Mouvements possibles:', possibleMoves);
                }
              }
            }}
          />
        </div>
        
        {/* Panneau de contrôle */}
        <div className={styles.controlPanel}>
          <div className={styles.reserveDisplay}>
            <h3>Réserve {gameState.currentPlayer === 'white' ? 'Blanche' : 'Noire'}</h3>
            <ReserveDisplay reserve={currentReserve} />
          </div>
          
          <div className={styles.actionsSection}>
            <h3>Actions disponibles</h3>
            <ActionSelector 
              availableActions={availableActions}
              selectedAction={selectedAction}
              onActionSelect={handleActionSelection}
            />
          </div>
          
          {possibleMoves.length > 0 && (
            <div className={styles.movesSection}>
              <h3>Coups possibles</h3>
              <MovesList 
                moves={possibleMoves}
                onMoveSelect={handleAction}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Analyse de jeu */}
      {gameAnalysis && (
        <div className={styles.gameAnalysis}>
          <h3>Analyse de la position</h3>
          <GameAnalysisDisplay analysis={gameAnalysis} />
        </div>
      )}
    </div>
  );
};

// Composant échiquier
interface ChessBoardProps {
  gameState: SecretKingBootGameState;
  selectedAction?: ActionType | null;
  possibleMoves?: GameAction[];
  onSquareClick: (position: string) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  gameState, 
  selectedAction, 
  possibleMoves = [], 
  onSquareClick 
}) => {
  return (
    <div className={styles.chessBoard}>
      {Array(8).fill(0).map((_, rank) => (
        Array(8).fill(0).map((_, file) => {
          const position = String.fromCharCode(65 + file) + (8 - rank);
          const piece = gameState.board[7 - rank][file];
          const isLight = (rank + file) % 2 === 0;
          
          // Vérifier si cette case est une destination possible
          const isPossibleMove = possibleMoves.some(move => move.to === position);
          
          return (
            <div
              key={position}
              className={`${styles.square} ${isLight ? styles.light : styles.dark} ${isPossibleMove ? styles.possible : ''}`}
              onClick={() => onSquareClick(position)}
            >
              {piece && (
                <div className={`${styles.piece} ${piece.toLowerCase()}`}>
                  {getPieceSymbol(piece)}
                </div>
              )}
              <div className={styles.squareLabel}>{position}</div>
              {isPossibleMove && (
                <div className={styles.moveIndicator}>●</div>
              )}
            </div>
          );
        })
      ))}
    </div>
  );
};

// Composant affichage réserve
interface ReserveDisplayProps {
  reserve: Reserve;
}

const ReserveDisplay: React.FC<ReserveDisplayProps> = ({ reserve }) => {
  return (
    <div className={styles.reserve}>
      <div className={styles.pieceCount}>♟ Pions: {reserve.pawns}</div>
      <div className={styles.pieceCount}>♞ Cavaliers: {reserve.knights}</div>
      <div className={styles.pieceCount}>♗ Fous: {reserve.bishops}</div>
      <div className={styles.pieceCount}>♜ Tours: {reserve.rooks}</div>
      <div className={styles.pieceCount}>♛ Dames: {reserve.queens}</div>
    </div>
  );
};

// Composant sélecteur d'actions
interface ActionSelectorProps {
  availableActions: ActionType[];
  selectedAction: ActionType | null;
  onActionSelect: (action: ActionType) => void;
}

const ActionSelector: React.FC<ActionSelectorProps> = ({
  availableActions,
  selectedAction,
  onActionSelect
}) => {
  
  const actionLabels = {
    place_king: 'Placer le roi',
    generate_pawn: 'Générer un pion',
    move_piece: 'Déplacer une pièce',
    move_king_and_place: 'Déplacer roi + placer pièce',
    place_piece: 'Placer une pièce',
    exchange_pieces: 'Échanger des pions',
    promote_pawn: 'Promouvoir un pion'
  };
  
  return (
    <div className={styles.actionSelector}>
      {availableActions.map(action => (
        <button
          key={action}
          className={`${styles.actionButton} ${selectedAction === action ? styles.selected : ''}`}
          onClick={() => onActionSelect(action)}
        >
          {actionLabels[action]}
        </button>
      ))}
    </div>
  );
};

// Composant liste des coups
interface MovesListProps {
  moves: GameAction[];
  onMoveSelect: (move: GameAction) => void;
}

const MovesList: React.FC<MovesListProps> = ({ moves, onMoveSelect }) => {
  return (
    <div className={styles.movesList}>
      {moves.map((move, index) => (
        <button
          key={index}
          className={styles.moveButton}
          onClick={() => onMoveSelect(move)}
        >
          {formatMoveDescription(move)}
        </button>
      ))}
    </div>
  );
};

// Composant analyse de jeu
interface GameAnalysisDisplayProps {
  analysis: any;
}

const GameAnalysisDisplay: React.FC<GameAnalysisDisplayProps> = ({ analysis }) => {
  return (
    <div className={styles.analysisDisplay}>
      <div>Pièces en jeu - Blanc: {analysis.whitePiecesOnBoard} | Noir: {analysis.blackPiecesOnBoard}</div>
      <div>Valeur réserve - Blanc: {analysis.whiteReserveValue} | Noir: {analysis.blackReserveValue}</div>
    </div>
  );
};

// Fonctions utilitaires

function getPieceSymbol(piece: string): string {
  const symbols = {
    'WhiteKing': '♔', 'BlackKing': '♚',
    'WhiteQueen': '♕', 'BlackQueen': '♛',
    'WhiteRook': '♖', 'BlackRook': '♜',
    'WhiteBishop': '♗', 'BlackBishop': '♝',
    'WhiteKnight': '♘', 'BlackKnight': '♞',
    'WhitePawn': '♙', 'BlackPawn': '♟'
  };
  
  return symbols[piece as keyof typeof symbols] || '?';
}

function formatMoveDescription(move: GameAction): string {
  switch (move.type) {
    case 'place_king':
      return `Placer roi en ${move.to}`;
    case 'generate_pawn':
      return 'Générer un pion';
    case 'place_piece':
      return `Placer ${move.piece} en ${move.to}`;
    case 'move_piece':
      return `Déplacer ${move.piece} de ${move.from} à ${move.to}`;
    case 'move_king_and_place':
      return `Déplacer roi de ${move.from} à ${move.to} + placer ${move.piece}`;
    case 'exchange_pieces':
      return `Échanger ${move.cost} pions → ${move.exchangeTo}`;
    case 'promote_pawn':
      return `Promouvoir pion en ${move.piece}`;
    default:
      return `${move.type} ${move.from || ''} → ${move.to || ''}`;
  }
}

export default SecretKingBootGame;
