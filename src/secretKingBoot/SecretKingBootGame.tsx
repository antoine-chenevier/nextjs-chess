import React, { useState, useCallback, useEffect } from 'react';
import styles from './SecretKingBoot.module.css';
import { 
  SecretKingBootGameState, 
  GameAction, 
  ActionType,
  Reserve 
} from './types';
import { 
  createInitialGameState, 
  isValidAction,
  createTestCheckState,
  createTestCheckmateState
} from './gameLogic';
import { 
  applyAction 
} from './gameActions';
import { 
  getAvailableActions, 
  getPossibleMoves,
  analyzeGameState 
} from './gameAnalysis';
import { createBot, BotDifficulty, Bot, getDifficultyDescription } from './bot';
import { validateGameIntegrity } from './gameLogic';

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
  const [selectedPieceForKingMove, setSelectedPieceForKingMove] = useState<string | null>(null);
  const [selectedPieceForPlacement, setSelectedPieceForPlacement] = useState<string | null>(null);
  const [selectedPiecePosition, setSelectedPiecePosition] = useState<string | null>(null);
  
  // États pour le bot
  const [bot, setBot] = useState<Bot | null>(null);
  const [isPlayerVsBot, setIsPlayerVsBot] = useState(false);
  const [botDifficulty, setBotDifficulty] = useState(BotDifficulty.MEDIUM);
  const [isBotThinking, setIsBotThinking] = useState(false);
  
  // Effectuer une action
  const handleAction = useCallback((action: GameAction) => {
    // Si c'est une sélection de pièce pour "move_king_and_place"
    if (action.type === 'move_king_and_place' && !action.from && !action.to) {
      setSelectedPieceForKingMove(action.piece!);
      // Générer les mouvements possibles du roi
      const kingMoves = getPossibleMoves(gameState, 'move_piece').filter(move => 
        move.piece && move.piece.includes('King')
      );
      // Ajouter la pièce sélectionnée à chaque mouvement
      const movesWithPiece = kingMoves.map(move => ({
        ...move,
        type: 'move_king_and_place' as ActionType,
        piece: action.piece
      }));
      setPossibleMoves(movesWithPiece);
      return;
    }
    
    // Si c'est une sélection de pièce pour "place_piece"
    if (action.type === 'place_piece' && !action.to) {
      setSelectedPieceForPlacement(action.piece!);
      // Générer les positions possibles pour cette pièce
      const placementMoves = getPossibleMoves(gameState, 'place_piece').filter(move => 
        move.piece === action.piece
      );
      setPossibleMoves(placementMoves);
      return;
    }
    
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
    
    // Vérifier si la partie est terminée et afficher un message
    if (newState.gameStatus) {
      switch (newState.gameStatus.status) {
        case 'check':
          console.log(`${newState.gameStatus.player === 'white' ? 'Blanc' : 'Noir'} est en échec !`);
          break;
        case 'checkmate':
          const winner = newState.gameStatus.winner === 'white' ? 'Blanc' : 'Noir';
          alert(`Échec et mat ! ${winner} gagne la partie !`);
          if (onGameEnd) {
            onGameEnd(newState.gameStatus.winner as 'white' | 'black' | 'draw');
          }
          break;
        case 'stalemate':
          alert('Pat ! La partie se termine par un match nul.');
          if (onGameEnd) {
            onGameEnd('draw');
          }
          break;
      }
    }
    
    // Reset des sélections
    setSelectedAction(null);
    setPossibleMoves([]);
    setSelectedPieceForKingMove(null);
    setSelectedPieceForPlacement(null);
    setSelectedPiecePosition(null);
    
  }, [gameState]);
  
  // Sélectionner un type d'action
  const handleActionSelection = useCallback((actionType: ActionType) => {
    // Empêcher les actions si la partie est terminée
    if (gameState.gamePhase === 'ended') {
      alert('La partie est terminée. Commencez une nouvelle partie.');
      return;
    }
    
    // Pour "generate_pawn", exécuter directement l'action
    if (actionType === 'generate_pawn') {
      const generatePawnAction: GameAction = {
        type: 'generate_pawn',
        player: gameState.currentPlayer,
        turn: gameState.turn
      };
      handleAction(generatePawnAction);
      return;
    }
    
    // Pour "move_king_and_place", afficher uniquement les pièces disponibles
    if (actionType === 'move_king_and_place') {
      setSelectedAction(actionType);
      const reserve = gameState.currentPlayer === 'white' ? 
        gameState.whiteReserve : gameState.blackReserve;
      
      // Créer des actions pour chaque type de pièce disponible
      const pieceOptions: GameAction[] = [];
      const player = gameState.currentPlayer;
      const turn = gameState.turn;
      
      if (reserve.pawns > 0) {
        pieceOptions.push({
          type: 'move_king_and_place',
          player,
          turn,
          piece: 'Pawn'
        });
      }
      if (reserve.knights > 0) {
        pieceOptions.push({
          type: 'move_king_and_place',
          player,
          turn,
          piece: 'Knight'
        });
      }
      if (reserve.bishops > 0) {
        pieceOptions.push({
          type: 'move_king_and_place',
          player,
          turn,
          piece: 'Bishop'
        });
      }
      if (reserve.rooks > 0) {
        pieceOptions.push({
          type: 'move_king_and_place',
          player,
          turn,
          piece: 'Rook'
        });
      }
      if (reserve.queens > 0) {
        pieceOptions.push({
          type: 'move_king_and_place',
          player,
          turn,
          piece: 'Queen'
        });
      }
      
      setPossibleMoves(pieceOptions);
      return;
    }
    
    // Pour "place_piece", afficher uniquement les pièces disponibles
    if (actionType === 'place_piece') {
      setSelectedAction(actionType);
      const reserve = gameState.currentPlayer === 'white' ? 
        gameState.whiteReserve : gameState.blackReserve;
      
      // Créer des actions pour chaque type de pièce disponible
      const pieceOptions: GameAction[] = [];
      const player = gameState.currentPlayer;
      const turn = gameState.turn;
      
      if (reserve.pawns > 0) {
        pieceOptions.push({
          type: 'place_piece',
          player,
          turn,
          piece: 'Pawn'
        });
      }
      if (reserve.knights > 0) {
        pieceOptions.push({
          type: 'place_piece',
          player,
          turn,
          piece: 'Knight'
        });
      }
      if (reserve.bishops > 0) {
        pieceOptions.push({
          type: 'place_piece',
          player,
          turn,
          piece: 'Bishop'
        });
      }
      if (reserve.rooks > 0) {
        pieceOptions.push({
          type: 'place_piece',
          player,
          turn,
          piece: 'Rook'
        });
      }
      if (reserve.queens > 0) {
        pieceOptions.push({
          type: 'place_piece',
          player,
          turn,
          piece: 'Queen'
        });
      }
      
      setPossibleMoves(pieceOptions);
      return;
    }
    
    // Pour "move_piece", d'abord sélectionner une pièce sur l'échiquier
    if (actionType === 'move_piece') {
      setSelectedAction(actionType);
      setSelectedPiecePosition(null); // Réinitialiser la sélection
      setPossibleMoves([]); // Pas de mouvements jusqu'à ce qu'une pièce soit sélectionnée
      return;
    }
    
    // Pour "exchange_pieces", afficher directement les échanges possibles
    if (actionType === 'exchange_pieces') {
      setSelectedAction(actionType);
      const moves = getPossibleMoves(gameState, actionType);
      setPossibleMoves(moves);
      return;
    }
    
    // Pour les autres actions, afficher les mouvements possibles
    setSelectedAction(actionType);
    const moves = getPossibleMoves(gameState, actionType);
    setPossibleMoves(moves);
  }, [gameState, handleAction]);
  
  // Réinitialiser la partie
  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setSelectedAction(null);
    setPossibleMoves([]);
    setGameAnalysis(null);
    setSelectedPieceForKingMove(null);
    setSelectedPieceForPlacement(null);
    setSelectedPiecePosition(null);
    setSelectedPieceForPlacement(null);
    setIsBotThinking(false);
  }, []);
  
  // Fonctions pour gérer le bot
  const enableBotMode = useCallback((difficulty: BotDifficulty) => {
    const newBot = createBot(difficulty);
    setBot(newBot);
    setIsPlayerVsBot(true);
    setBotDifficulty(difficulty);
    setIsBotThinking(false);
  }, []);

  const disableBotMode = useCallback(() => {
    setBot(null);
    setIsPlayerVsBot(false);
    setIsBotThinking(false);
  }, []);

  // Effet pour faire jouer le bot quand c'est son tour
  useEffect(() => {
    if (isPlayerVsBot && bot && 
        gameState.currentPlayer === 'black' && 
        gameState.gamePhase !== 'ended' &&
        !isBotThinking) {
      
      setIsBotThinking(true);
      
      const makeBotMove = async () => {
        try {
          const action = await bot.makeMove(gameState);
          const newState = applyAction(gameState, action);
          setGameState(newState);
        } catch (error) {
          console.error('Erreur du bot:', error);
        } finally {
          setIsBotThinking(false);
        }
      };
      
      makeBotMove();
    }
  }, [gameState.currentPlayer, isPlayerVsBot, bot, gameState, isBotThinking]);

  // Effet pour surveiller l'intégrité du jeu
  useEffect(() => {
    if (gameState.gamePhase === 'playing') {
      const integrity = validateGameIntegrity(gameState);
      if (!integrity.valid) {
        console.error('🚨 PROBLÈME D\'INTÉGRITÉ DÉTECTÉ:');
        integrity.errors.forEach(error => console.error(error));
        
        // Afficher une alerte à l'utilisateur
        alert('ERREUR CRITIQUE DÉTECTÉE:\n' + integrity.errors.join('\n') + 
              '\n\nLe jeu va être réinitialisé pour éviter la corruption.');
        
        // Réinitialiser le jeu
        resetGame();
      }
    }
  }, [gameState, resetGame]);
  
  const availableActions = getAvailableActions(gameState);
  
  // Formater le statut du jeu pour l'affichage
  const getGameStatusDisplay = () => {
    if (!gameState.gameStatus) return '';
    
    switch (gameState.gameStatus.status) {
      case 'playing':
        return '';
      case 'check':
        return gameState.gameStatus.player === 'white' ? '⚠️ Blanc en échec' : '⚠️ Noir en échec';
      case 'checkmate':
        return gameState.gameStatus.player === 'white' ? '♛ Échec et mat - Noir gagne!' : '♛ Échec et mat - Blanc gagne!';
      case 'stalemate':
        return '🤝 Pat - Match nul';
      default:
        return '';
    }
  };
  
  return (
    <div className={styles.secretKingBootGame}>
      <div className={styles.gameHeader}>
        <h2>La Botte Secrète du Roi</h2>
        <div className={styles.gameInfo}>
          <div>Joueur: {gameState.currentPlayer === 'white' ? 'Blanc' : 'Noir'}</div>
          <div>Tour: {gameState.turn}</div>
          <div>Phase: {gameState.gamePhase === 'setup' ? 'Placement' : 'Jeu'}</div>
          {getGameStatusDisplay() && (
            <div className={styles.gameStatus}>{getGameStatusDisplay()}</div>
          )}
        </div>
        <button onClick={resetGame} className={styles.resetButton}>
          Nouvelle partie
        </button>
        <div className={styles.testButtons}>
          <button 
            onClick={() => setGameState(createTestCheckState())} 
            className={styles.testButton}
          >
            Test Échec
          </button>
          <button 
            onClick={() => setGameState(createTestCheckmateState())} 
            className={styles.testButton}
          >
            Test Mat
          </button>
        </div>
        
        {/* Contrôles du bot */}
        <div className={styles.botControls}>
          <h3>Mode de jeu</h3>
          {!isPlayerVsBot ? (
            <div className={styles.botSelection}>
              <p>Jouer contre :</p>
              <div className={styles.difficultyButtons}>
                <button 
                  onClick={() => enableBotMode(BotDifficulty.EASY)}
                  className={styles.botButton}
                  title={getDifficultyDescription(BotDifficulty.EASY)}
                >
                  🤖 Bot Facile
                </button>
                <button 
                  onClick={() => enableBotMode(BotDifficulty.MEDIUM)}
                  className={styles.botButton}
                  title={getDifficultyDescription(BotDifficulty.MEDIUM)}
                >
                  🤖 Bot Moyen
                </button>
                <button 
                  onClick={() => enableBotMode(BotDifficulty.HARD)}
                  className={styles.botButton}
                  title={getDifficultyDescription(BotDifficulty.HARD)}
                >
                  🤖 Bot Difficile
                </button>
              </div>
              <button 
                onClick={disableBotMode}
                className={styles.humanButton}
              >
                👥 2 Joueurs
              </button>
            </div>
          ) : (
            <div className={styles.botStatus}>
              <p>🤖 Mode Bot ({botDifficulty})</p>
              {isBotThinking && (
                <p className={styles.botThinking}>🤔 Le bot réfléchit...</p>
              )}
              <button onClick={disableBotMode} className={styles.humanButton}>
                👥 Passer en mode 2 joueurs
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.gameContent}>
        {/* Échiquier */}
        <div className={styles.boardSection}>
          <ChessBoard 
            gameState={gameState}
            selectedAction={selectedAction}
            possibleMoves={possibleMoves}
            onSquareClick={(position) => {
              // Empêcher les actions si la partie est terminée
              if (gameState.gamePhase === 'ended') {
                alert('La partie est terminée. Commencez une nouvelle partie.');
                return;
              }
              
              // Empêcher les actions si c'est le tour du bot
              if (isPlayerVsBot && gameState.currentPlayer === 'black') {
                if (isBotThinking) {
                  alert('Le bot est en train de réfléchir...');
                } else {
                  alert('C\'est le tour du bot.');
                }
                return;
              }
              
              // Gérer les clics sur l'échiquier
              
              // Si on est en mode "move_piece" et qu'aucune pièce n'est sélectionnée
              if (selectedAction === 'move_piece' && !selectedPiecePosition) {
                // Vérifier qu'il y a une pièce du joueur actuel à cette position
                const [file, rank] = [position.charCodeAt(0) - 65, parseInt(position[1]) - 1];
                const piece = gameState.board[rank]?.[file];
                
                if (piece && isPieceOwnedByCurrentPlayer(piece, gameState.currentPlayer)) {
                  // Sélectionner cette pièce et afficher ses mouvements possibles
                  setSelectedPiecePosition(position);
                  
                  // Récupérer les mouvements possibles pour cette pièce spécifique
                  const allMoves = getPossibleMoves(gameState, 'move_piece');
                  const pieceMoves = allMoves.filter(move => move.from === position);
                  setPossibleMoves(pieceMoves);
                }
                return;
              }
              
              if (selectedAction && possibleMoves.length > 0) {
                // Chercher un mouvement correspondant
                let move = null;
                
                if (selectedAction === 'place_king') {
                  // Pour les placements, chercher par position de destination
                  move = possibleMoves.find(m => m.to === position);
                } else if (selectedAction === 'move_piece' || selectedAction === 'move_king_and_place') {
                  // Pour les déplacements, chercher par position de destination
                  move = possibleMoves.find(m => m.to === position);
                }
                
                if (move) {
                  handleAction(move);
                  // Réinitialiser la sélection après le mouvement
                  if (selectedAction === 'move_piece') {
                    setSelectedPiecePosition(null);
                  }
                } else {
                  // Si aucun mouvement trouvé et qu'on est en mode move_piece avec une pièce sélectionnée,
                  // permettre de sélectionner une autre pièce
                  if (selectedAction === 'move_piece' && selectedPiecePosition) {
                    const [file, rank] = [position.charCodeAt(0) - 65, parseInt(position[1]) - 1];
                    const piece = gameState.board[rank]?.[file];
                    
                    if (piece && isPieceOwnedByCurrentPlayer(piece, gameState.currentPlayer)) {
                      // Sélectionner cette nouvelle pièce
                      setSelectedPiecePosition(position);
                      
                      const allMoves = getPossibleMoves(gameState, 'move_piece');
                      const pieceMoves = allMoves.filter(move => move.from === position);
                      setPossibleMoves(pieceMoves);
                    }
                  }
                }
              }
            }}
          />
        </div>
        
        {/* Panneau de contrôle */}
        <div className={styles.controlPanel}>
          <div className={styles.reserveDisplay}>
            <h3>Réserves</h3>
            <div className={styles.bothReserves}>
              <div className={`${styles.reserveSection} ${gameState.currentPlayer === 'white' ? styles.activePlayer : ''}`}>
                <h4>♔ Blanc</h4>
                <ReserveDisplay reserve={gameState.whiteReserve} />
              </div>
              <div className={`${styles.reserveSection} ${gameState.currentPlayer === 'black' ? styles.activePlayer : ''}`}>
                <h4>♚ Noir</h4>
                <ReserveDisplay reserve={gameState.blackReserve} />
              </div>
            </div>
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
              <h3>
                {selectedAction === 'move_piece' && !selectedPiecePosition
                  ? 'Cliquer sur une pièce à déplacer'
                  : selectedAction === 'move_piece' && selectedPiecePosition
                    ? `Mouvements possibles pour la pièce en ${selectedPiecePosition}`
                    : selectedAction === 'move_king_and_place' && !selectedPieceForKingMove 
                      ? 'Choisir une pièce à placer' 
                      : selectedAction === 'move_king_and_place' && selectedPieceForKingMove
                        ? `Déplacer le roi (pièce: ${selectedPieceForKingMove})`
                        : selectedAction === 'place_piece' && !selectedPieceForPlacement
                          ? 'Choisir une pièce à placer'
                          : selectedAction === 'place_piece' && selectedPieceForPlacement
                            ? `Choisir la position pour ${selectedPieceForPlacement}`
                            : selectedAction === 'exchange_pieces'
                              ? 'Échanges possibles'
                              : 'Coups possibles'
                }
              </h3>
              <MovesList 
                moves={possibleMoves}
                onMoveSelect={handleAction}
              />
            </div>
          )}
          
          {selectedAction === 'move_piece' && !selectedPiecePosition && possibleMoves.length === 0 && (
            <div className={styles.movesSection}>
              <h3>Cliquer sur une pièce à déplacer</h3>
              <p>Sélectionnez une de vos pièces sur l'échiquier pour voir ses mouvements possibles.</p>
            </div>
          )}
          
          {/* Aide contextuelle pour les situations d'échec */}
          {gameState.gameStatus?.status === 'check' && (
            <div className={styles.checkHelp}>
              <h3>🚨 Votre roi est en échec !</h3>
              <p>Vous devez impérativement sortir votre roi de cette situation :</p>
              <ul>
                <li>🏃 Déplacer le roi vers une case sûre</li>
                <li>🛡️ Bloquer l'attaque avec une autre pièce</li>
                <li>⚔️ Capturer la pièce qui attaque le roi</li>
              </ul>
              <p><em>Seuls les mouvements qui sortent le roi d'échec sont autorisés.</em></p>
            </div>
          )}
          
          {gameState.gameStatus?.status === 'checkmate' && (
            <div className={styles.checkmateInfo}>
              <h3>♛ Échec et mat !</h3>
              <p>La partie est terminée. Le roi ne peut plus échapper à l'échec.</p>
              <p><strong>Vainqueur : {gameState.gameStatus.winner === 'white' ? '⚪ Blanc' : '⚫ Noir'}</strong></p>
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
          
          // Vérifier si le roi sur cette case est en échec
          const isKingInCheck = piece && 
            ((piece === 'WhiteKing' && gameState.gameStatus?.status === 'check' && gameState.gameStatus?.player === 'white') ||
             (piece === 'BlackKing' && gameState.gameStatus?.status === 'check' && gameState.gameStatus?.player === 'black'));
          
          return (
            <div
              key={position}
              className={`${styles.square} ${isLight ? styles.light : styles.dark} ${isPossibleMove ? styles.possible : ''} ${isKingInCheck ? styles.inCheck : ''}`}
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
      if (!move.to) {
        // Sélection de pièce
        return `Sélectionner ${move.piece}`;
      } else {
        // Placement de pièce
        return `Placer ${move.piece} en ${move.to}`;
      }
    case 'move_piece':
      return `Déplacer ${move.piece} de ${move.from} à ${move.to}`;
    case 'move_king_and_place':
      if (!move.from && !move.to) {
        // Sélection de pièce
        return `Sélectionner ${move.piece}`;
      } else {
        // Mouvement du roi avec pièce
        return `Déplacer roi de ${move.from} à ${move.to} + placer ${move.piece}`;
      }
    case 'exchange_pieces':
      const pieceNames = {
        knight: 'Cavalier',
        bishop: 'Fou', 
        rook: 'Tour',
        queen: 'Dame'
      };
      const pieceName = pieceNames[move.exchangeTo as keyof typeof pieceNames] || move.exchangeTo;
      return `${move.cost} pions → ${pieceName}`;
    case 'promote_pawn':
      return `Promouvoir pion en ${move.piece}`;
    default:
      return `${move.type} ${move.from || ''} → ${move.to || ''}`;
  }
}

// Fonction utilitaire pour vérifier si une pièce appartient au joueur actuel
const isPieceOwnedByCurrentPlayer = (piece: string, currentPlayer: 'white' | 'black'): boolean => {
  const isWhitePiece = piece.includes('White');
  const isBlackPiece = piece.includes('Black');
  
  if (currentPlayer === 'white') {
    return isWhitePiece;
  } else {
    return isBlackPiece;
  }
};

export default SecretKingBootGame;
