import { SecretKingBootGameState } from './types';

/**
 * Module amélioré pour la gestion des échecs dans Secret King Boot
 * Ce module réimplémente la logique de détection d'échec, d'échec et mat, et de pat
 * avec des vérifications plus robustes et des tests complets.
 */

/**
 * Convertit une position algébrique (ex: "E4") en coordonnées numériques
 */
export function positionToCoordinates(position: string): { x: number; y: number } {
  const file = position.charCodeAt(0) - 65; // A=0, B=1, etc.
  const rank = parseInt(position[1]) - 1;   // 1=0, 2=1, etc.
  return { x: file, y: rank };
}

/**
 * Convertit des coordonnées numériques en position algébrique
 */
export function coordinatesToPosition(x: number, y: number): string {
  return String.fromCharCode(65 + x) + (y + 1);
}

/**
 * Vérifie si une position est valide sur l'échiquier
 */
export function isValidPosition(x: number, y: number): boolean {
  return x >= 0 && x < 8 && y >= 0 && y < 8;
}

/**
 * Vérifie si une pièce appartient au joueur spécifié
 */
export function isPieceOwnedBy(piece: string, player: 'white' | 'black'): boolean {
  return player === 'white' ? piece.includes('White') : piece.includes('Black');
}

/**
 * Trouve la position du roi sur l'échiquier
 */
export function findKingPosition(board: (string | null)[][], player: 'white' | 'black'): { x: number; y: number } | null {
  const kingPiece = player === 'white' ? 'WhiteKing' : 'BlackKing';
  
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] === kingPiece) {
        return { x, y };
      }
    }
  }
  return null;
}

/**
 * Vérifie si le chemin entre deux positions est libre
 */
export function isPathClear(
  fromX: number, 
  fromY: number, 
  toX: number, 
  toY: number, 
  board: (string | null)[][]
): boolean {
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  
  // Distance et direction
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  const stepX = deltaX === 0 ? 0 : deltaX / Math.abs(deltaX);
  const stepY = deltaY === 0 ? 0 : deltaY / Math.abs(deltaY);
  
  // Vérifier chaque case intermédiaire
  for (let i = 1; i < steps; i++) {
    const checkX = fromX + i * stepX;
    const checkY = fromY + i * stepY;
    
    if (board[checkY][checkX] !== null) {
      return false; // Chemin bloqué
    }
  }
  
  return true;
}

/**
 * Vérifie si une pièce peut attaquer une case donnée
 */
export function canPieceAttackSquare(
  piece: string,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  board: (string | null)[][],
  player: 'white' | 'black'
): boolean {
  if (!isValidPosition(fromX, fromY) || !isValidPosition(toX, toY)) {
    return false;
  }
  
  if (fromX === toX && fromY === toY) {
    return false; // Même case
  }
  
  const deltaX = toX - fromX;
  const deltaY = toY - fromY;
  
  // Logique spécifique à chaque type de pièce
  if (piece.includes('Pawn')) {
    const direction = player === 'white' ? 1 : -1;
    // Les pions attaquent en diagonale
    return Math.abs(deltaX) === 1 && deltaY === direction;
  }
  
  if (piece.includes('King')) {
    // Le roi attaque dans toutes les directions adjacentes
    return Math.abs(deltaX) <= 1 && Math.abs(deltaY) <= 1;
  }
  
  if (piece.includes('Knight')) {
    // Le cavalier attaque en L
    return (Math.abs(deltaX) === 2 && Math.abs(deltaY) === 1) || 
           (Math.abs(deltaX) === 1 && Math.abs(deltaY) === 2);
  }
  
  if (piece.includes('Bishop')) {
    // Le fou attaque en diagonale
    if (Math.abs(deltaX) === Math.abs(deltaY) && deltaX !== 0) {
      return isPathClear(fromX, fromY, toX, toY, board);
    }
    return false;
  }
  
  if (piece.includes('Rook')) {
    // La tour attaque en ligne droite
    if ((deltaX === 0 && deltaY !== 0) || (deltaY === 0 && deltaX !== 0)) {
      return isPathClear(fromX, fromY, toX, toY, board);
    }
    return false;
  }
  
  if (piece.includes('Queen')) {
    // La dame combine fou et tour
    const isRookMove = (deltaX === 0 && deltaY !== 0) || (deltaY === 0 && deltaX !== 0);
    const isBishopMove = Math.abs(deltaX) === Math.abs(deltaY) && deltaX !== 0;
    
    if (isRookMove || isBishopMove) {
      return isPathClear(fromX, fromY, toX, toY, board);
    }
    return false;
  }
  
  return false;
}

/**
 * Vérifie si une case est attaquée par le joueur spécifié
 */
export function isSquareAttacked(
  targetX: number,
  targetY: number,
  byPlayer: 'white' | 'black',
  board: (string | null)[][]
): boolean {
  if (!isValidPosition(targetX, targetY)) {
    return false;
  }
  
  // Parcourir toutes les pièces du joueur attaquant
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = board[y][x];
      if (!piece || !isPieceOwnedBy(piece, byPlayer)) {
        continue;
      }
      
      // Vérifier si cette pièce peut attaquer la case cible
      if (canPieceAttackSquare(piece, x, y, targetX, targetY, board, byPlayer)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Vérifie si le roi est en échec
 */
export function isKingInCheck(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  const kingPosition = findKingPosition(gameState.board, player);
  if (!kingPosition) {
    console.warn(`Roi ${player} introuvable sur l'échiquier`);
    return false;
  }
  
  const opponent = player === 'white' ? 'black' : 'white';
  return isSquareAttacked(kingPosition.x, kingPosition.y, opponent, gameState.board);
}

/**
 * Simule un mouvement et vérifie si le roi reste en sécurité
 */
export function wouldMoveLeaveKingInCheck(
  gameState: SecretKingBootGameState,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  player: 'white' | 'black'
): boolean {
  // Créer une copie temporaire du plateau
  const tempBoard = gameState.board.map(row => [...row]);
  
  // Effectuer le mouvement temporaire
  const piece = tempBoard[fromY][fromX];
  tempBoard[toY][toX] = piece;
  tempBoard[fromY][fromX] = null;
  
  // Créer un état temporaire
  const tempState: SecretKingBootGameState = {
    ...gameState,
    board: tempBoard
  };
  
  // Vérifier si le roi est en échec après ce mouvement
  return isKingInCheck(tempState, player);
}

/**
 * Génère tous les mouvements légaux possibles pour une pièce
 */
export function generateLegalMovesForPiece(
  gameState: SecretKingBootGameState,
  pieceX: number,
  pieceY: number,
  piece: string,
  player: 'white' | 'black'
): { x: number; y: number }[] {
  const legalMoves: { x: number; y: number }[] = [];
  
  // Générer tous les mouvements possibles selon le type de pièce
  const possibleMoves = generatePossibleMovesForPiece(piece, pieceX, pieceY, gameState.board, player);
  
  // Filtrer les mouvements qui laisseraient le roi en échec
  for (const move of possibleMoves) {
    if (!wouldMoveLeaveKingInCheck(gameState, pieceX, pieceY, move.x, move.y, player)) {
      legalMoves.push(move);
    }
  }
  
  return legalMoves;
}

/**
 * Génère tous les mouvements possibles pour une pièce (sans vérifier l'échec)
 */
function generatePossibleMovesForPiece(
  piece: string,
  fromX: number,
  fromY: number,
  board: (string | null)[][],
  player: 'white' | 'black'
): { x: number; y: number }[] {
  const moves: { x: number; y: number }[] = [];
  
  if (piece.includes('King')) {
    // Roi : toutes les directions adjacentes
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const newX = fromX + dx;
        const newY = fromY + dy;
        
        if (isValidPosition(newX, newY)) {
          const targetPiece = board[newY][newX];
          if (!targetPiece || !isPieceOwnedBy(targetPiece, player)) {
            moves.push({ x: newX, y: newY });
          }
        }
      }
    }
  } else if (piece.includes('Queen')) {
    // Dame : combinaison tour + fou
    moves.push(...generateLinearMoves(fromX, fromY, board, player, true, true));
  } else if (piece.includes('Rook')) {
    // Tour : mouvements linéaires
    moves.push(...generateLinearMoves(fromX, fromY, board, player, true, false));
  } else if (piece.includes('Bishop')) {
    // Fou : mouvements diagonaux
    moves.push(...generateLinearMoves(fromX, fromY, board, player, false, true));
  } else if (piece.includes('Knight')) {
    // Cavalier : mouvements en L
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    for (const [dx, dy] of knightMoves) {
      const newX = fromX + dx;
      const newY = fromY + dy;
      
      if (isValidPosition(newX, newY)) {
        const targetPiece = board[newY][newX];
        if (!targetPiece || !isPieceOwnedBy(targetPiece, player)) {
          moves.push({ x: newX, y: newY });
        }
      }
    }
  } else if (piece.includes('Pawn')) {
    // Pion : logique spéciale
    moves.push(...generatePawnMoves(fromX, fromY, board, player));
  }
  
  return moves;
}

/**
 * Génère les mouvements linéaires (tour, fou, dame)
 */
function generateLinearMoves(
  fromX: number,
  fromY: number,
  board: (string | null)[][],
  player: 'white' | 'black',
  includeStraight: boolean,
  includeDiagonal: boolean
): { x: number; y: number }[] {
  const moves: { x: number; y: number }[] = [];
  
  const directions: [number, number][] = [];
  if (includeStraight) {
    directions.push([0, 1], [0, -1], [1, 0], [-1, 0]);
  }
  if (includeDiagonal) {
    directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
  }
  
  for (const [dx, dy] of directions) {
    for (let distance = 1; distance < 8; distance++) {
      const newX = fromX + dx * distance;
      const newY = fromY + dy * distance;
      
      if (!isValidPosition(newX, newY)) break;
      
      const targetPiece = board[newY][newX];
      if (!targetPiece) {
        // Case vide
        moves.push({ x: newX, y: newY });
      } else if (!isPieceOwnedBy(targetPiece, player)) {
        // Pièce adverse - capture possible
        moves.push({ x: newX, y: newY });
        break; // Arrêter dans cette direction
      } else {
        // Pièce alliée - arrêter
        break;
      }
    }
  }
  
  return moves;
}

/**
 * Génère les mouvements de pion selon les règles de Secret King Boot
 */
function generatePawnMoves(
  fromX: number,
  fromY: number,
  board: (string | null)[][],
  player: 'white' | 'black'
): { x: number; y: number }[] {
  const moves: { x: number; y: number }[] = [];
  const direction = player === 'white' ? 1 : -1;
  
  // Règles spéciales Secret King Boot pour les pions
  // Pions blancs sur rang 0 peuvent aller jusqu'au rang 3
  // Pions noirs sur rang 7 peuvent aller jusqu'au rang 4
  const isOnStartingRank = (player === 'white' && fromY === 0) || (player === 'black' && fromY === 7);
  const maxDistance = isOnStartingRank ? (player === 'white' ? 3 : 3) : 1; // Jusqu'à 3 cases depuis le rang de départ
  
  // Mouvement vers l'avant (peut être multiple pour Secret King Boot)
  for (let distance = 1; distance <= maxDistance; distance++) {
    const newY = fromY + (direction * distance);
    
    if (!isValidPosition(fromX, newY)) break;
    
    // Vérifier que la case est libre
    if (board[newY][fromX]) break; // Chemin bloqué, arrêter
    
    moves.push({ x: fromX, y: newY });
    
    // Si pas sur le rang de départ, ne faire qu'un pas
    if (!isOnStartingRank) break;
  }
  
  // Captures en diagonale (règle standard)
  for (const dx of [-1, 1]) {
    const captureX = fromX + dx;
    const captureY = fromY + direction;
    
    if (isValidPosition(captureX, captureY)) {
      const targetPiece = board[captureY][captureX];
      if (targetPiece && !isPieceOwnedBy(targetPiece, player)) {
        moves.push({ x: captureX, y: captureY });
      }
    }
  }
  
  return moves;
}

/**
 * Vérifie si le joueur a des mouvements légaux disponibles
 */
export function hasLegalMoves(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  // Parcourir toutes les pièces du joueur
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const piece = gameState.board[y][x];
      if (!piece || !isPieceOwnedBy(piece, player)) {
        continue;
      }
      
      // Vérifier si cette pièce a des mouvements légaux
      const legalMoves = generateLegalMovesForPiece(gameState, x, y, piece, player);
      if (legalMoves.length > 0) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Vérifie si le roi est en échec et mat
 */
export function isKingInCheckmate(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  // D'abord vérifier si le roi est en échec
  if (!isKingInCheck(gameState, player)) {
    return false;
  }
  
  // Ensuite vérifier s'il y a des mouvements légaux
  return !hasLegalMoves(gameState, player);
}

/**
 * Vérifie si la partie est en pat (stalemate)
 */
export function isStalemate(gameState: SecretKingBootGameState, player: 'white' | 'black'): boolean {
  // Le roi ne doit pas être en échec
  if (isKingInCheck(gameState, player)) {
    return false;
  }
  
  // Mais il ne doit y avoir aucun mouvement légal
  return !hasLegalMoves(gameState, player);
}

/**
 * Détermine l'état de la partie
 */
export function getGameState(gameState: SecretKingBootGameState, player: 'white' | 'black'): {
  status: 'normal' | 'check' | 'checkmate' | 'stalemate';
  inCheck: boolean;
  hasLegalMoves: boolean;
} {
  const inCheck = isKingInCheck(gameState, player);
  const hasMovesAvailable = hasLegalMoves(gameState, player);
  
  if (inCheck && !hasMovesAvailable) {
    return { status: 'checkmate', inCheck: true, hasLegalMoves: false };
  } else if (!inCheck && !hasMovesAvailable) {
    return { status: 'stalemate', inCheck: false, hasLegalMoves: false };
  } else if (inCheck) {
    return { status: 'check', inCheck: true, hasLegalMoves: true };
  } else {
    return { status: 'normal', inCheck: false, hasLegalMoves: true };
  }
}
