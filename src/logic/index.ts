type F = (move: DeltaPos) => (orig: Piece, board: Board) => IsMoveValid

type D = (orig: Piece, board: Board) => IsMoveValid

//TODO: this could be better, like validAnd
function validOr(validator1: F, validator2: F) {
  return function applyValidOr(move: DeltaPos) {
    const cond1 = validator1(move);
    const cond2 = validator2(move);
    return function applyApplyValidOr(orig: Piece, board: Board): IsMoveValid {
      const xy1 = cond1(orig, board)
      return xy1 ? xy1 : cond2(orig, board)
    }
  }
}

function validAnd(cond1: D, cond2: F) {
  return function applyValidAnd(orig: Piece, board: Board): IsMoveValid {
    const p = cond1(orig, board)
    if (!p) return null
    const move: DeltaPos = {
      x: p.x - orig.x,
      y: p.y - orig.y,
    } //recalculate delta
    return cond2(move)(orig, board)
  }
}

function validTrue(move: DeltaPos) {
  return function applyValidTrue(idx, board): IsMoveValid {
    return add(idx, move)
  }
}
function validFalse(orig: Piece, board: Board): IsMoveValid { return null }

function validAll(...conds: D[]) {
  return function applyValidAll(orig: Piece, board: Board): IsMoveValid {
    function applyPrevious(prev: D, val: D) {
      return !prev(orig, board) ? validFalse : val
    }
    return conds.reduce(applyPrevious, conds[0])(orig, board)
  }
}
// for the pawn
function validIfEnemy(move: DeltaPos) {
  return function applyValidIfEnemy(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const piece = board.pieces[dest.x + dest.y * 8]
    return piece && (piece.group !== orig.group) ? dest : null
  }
}

// for the bishop, rogue, queen
function validIfEmpty(move: DeltaPos) {
  return function applyValidIfEmpty(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const piece = board.pieces[dest.x + dest.y * 8]
    return !piece ? dest : null
  }
}

function validIfBlackRank1(move: DeltaPos) {
  return function applyBlackRank1(orig: Piece, board: Board): IsMoveValid {
    return orig.y === 6 ? add(orig, move) : null
  }
}

function validIfWhiteRank1(move: DeltaPos) {
  return function applyWhiteRank1(orig: Piece, board: Board): IsMoveValid {
    return orig.y === 1 ? add(orig, move) : null
  }
}

// for the pawn
function validIfPassant(move: DeltaPos) {
  return function applyValidIfPassant(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    if (board.passant !== dest.x) return null
    const piece = board.pieces[dest.x + orig.y * 8]
    const isEnemy = piece && (piece.group !== orig.group)

    return isEnemy ? dest : null
  }
}

function printState(pieces: Piece[]) {
  let result = ''
  for (let j = 0; j < 64; j++) {
    const x = j % 8
    const y = Math.floor(j / 8)
    const i = x + (7 - y) * 8
    const c = pieces[i]
    result += (c ? c.type : ' ') + ((i + 1) % 8 ? '' : ` ${Math.floor(i / 8) + 1}\n`)
  }
  result += '\nabcdefgh'
  console.log(result)
}

function printThreat(attacked: number[]) {
  let result = ''
  for (let j = 0; j < 64; j++) {
    const x = j % 8
    const y = Math.floor(j / 8)
    const i = x + (7 - y) * 8
    const c = attacked[i]
    result += (c ? c : ' ') + ((i + 1) % 8 ? '' : ` ${Math.floor(i / 8) + 1}\n`)
  }
  result += '\nabcdefgh'
  console.log(result)
}

function threatZone(board: Board): number[] {
  const result = zeroArray()
  board.pieces.forEach(function updateDangerous(enemy) {
    if (enemy) {
      const algorithm = threatsByType[enemy.type];
      const zone = algorithm(enemy, board)
      zone.forEach(function mark(attack) {
        const gid = first20Primes[enemy.group]
        const idx = attack.x + attack.y * 8
        result[idx] += gid
      })
    }
  })

  // printState(board.pieces)
  // printThreat(result)
  return result
}

function zeroArray() {
  const r = Array<number>(8 * 8);
  r.fill(0)
  return r
}

function validIfKingSafe(move: DeltaPos) {
  return function applyValidIfKingSafe(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const king = orig.type == PieceType.King ? dest : board.pieces.find(p => p && (p.group === dest.group) && p.type === PieceType.King)
    if (!king) return dest // we are safe if there is no king in the board

    const nextBoard = {
      pieces: Array.from(board.pieces),
      castle: {}
    }
    nextBoard.pieces[orig.x + orig.y * 8] = null
    nextBoard.pieces[dest.x + dest.y * 8] = dest

    const attacked = threatZone(nextBoard);
    const safe = (attacked[king.x + king.y * 8] % first20Primes[king.group]) == 0

    return safe ? dest : null
  }
}
function validIfShortCastle(move: DeltaPos) {
  return function applyValidIfShortCastle(orig: Piece, board: Board): IsMoveValid {
    // history ok?
    if (board.castle[orig.group].didMoveKing || board.castle[orig.group].didMoveShortTower) return null

    // pieces in place?
    const king = board.pieces[4 + 0 * 8]
    const path5 = board.pieces[5 + 0 * 8]
    const path6 = board.pieces[6 + 0 * 8]
    const tower = board.pieces[7 + 0 * 8]

    if (!tower || tower.type != PieceType.Rook
      || path5 || path6
      || !king || king.type != PieceType.King) return null

    // path is safe?
    const attacked = threatZone(board);
    // const attacked = cacheBoard(ugly_and_naive_hashing1, threatZone, board);
    const pathSafe = (attacked[5 + 0 * 8] % first20Primes[king.group]) == 0
      && (attacked[6 + 0 * 8] % first20Primes[king.group]) == 0

    return pathSafe ? add(orig, move) : null
  }
}

function validIfLongCastle(move: DeltaPos) {
  return function applyValidIfLongCastle(orig: Piece, board: Board): IsMoveValid {
    if (board.castle[orig.group].didMoveKing || board.castle[orig.group].didMoveLongTower) return null
    const tower = board.pieces[0 + 0 * 8]
    const path1 = board.pieces[1 + 0 * 8]
    const path2 = board.pieces[2 + 0 * 8]
    const path3 = board.pieces[3 + 0 * 8]
    const king = board.pieces[4 + 0 * 8]

    if (!tower || tower.type != PieceType.Rook
      || path1 || path2 || path3
      || !king || king.type != PieceType.King) return null

    const attacked = threatZone(board);
    // const attacked = cacheBoard(ugly_and_naive_hashing1, threatZone, board);
    const pathSafe = (attacked[1 + 0 * 8] % first20Primes[king.group]) == 0
      && (attacked[2 + 0 * 8] % first20Primes[king.group]) == 0
      && (attacked[3 + 0 * 8] % first20Primes[king.group]) == 0

    return pathSafe ? add(orig, move) : null
  }
}

function validIfInside(move: DeltaPos) {
  return function applyValidIfInside(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const { x, y } = dest
    return x <= 7 && x >= 0 && y <= 7 && y >= 0 ? dest : null
  }
}

function validIfNoFriend(move: DeltaPos) {
  return function applyValidIfNoFriend(orig: Piece, board: Board): IsMoveValid {
    const dest = add(orig, move)
    const piece = board.pieces[dest.x + dest.y * 8]
    const isFriend = piece && (piece.group === dest.group)
    return !isFriend ? dest : null
  }
}

function add(p: Piece, move: DeltaPos): Piece {
  return ({ ...p, x: p.x + move.x, y: p.y + move.y })
}

type IsMoveValid = Pos | null
type Delta = [x: number, y: number]
type DeltaPos = Pos
const asDeltaPos = (d: Delta): DeltaPos => ({ x: d[0], y: d[1] })

export interface Pos {
  x: number,
  y: number,
}

export enum PieceType {
  WhitePawn = 1, BlackPawn, Knight, Rook, Bishop, Queen, King
}

export enum PieceName {
  WhitePawn      = 'P', 
  WhiteKnight    = 'N', 
  WhiteRook      = 'R', 
  WhiteBishop    = 'B', 
  WhiteQueen     = 'Q', 
  WhiteKing      = 'K',

  BlackPawn      = 'p', 
  BlackKnight    = 'n', 
  BlackRook      = 'r', 
  BlackBishop    = 'b', 
  BlackQueen     = 'q', 
  BlackKing      = 'k',
}

const first20Primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71]

// piece should not have a position
export interface Piece {
  x: number,
  y: number,
  group: number,
  type: PieceType,
  name: PieceName,
}
export interface Board {
  pieces: Piece[];// pieces on board
  passant?: number; //did group an en'passant on last move?
  castle: {
    [turn:number]: {
      didMoveKing?: boolean; //is still possible to castle?
      didMoveShortTower?: boolean; //is still possible to castle?
      didMoveLongTower?: boolean; //is still possible to castle?
    }
  };
}

const arraySizeSeven = [0, 1, 2, 3, 4, 5, 6]
function expandStepToPath(v: DeltaPos, i: number, a: DeltaPos[]) {
  return [...a].reverse().slice(-i - 1).reverse()
}
function checkValidInTheMiddle(validator: F) {
  return function applyValidatorOnPath(x: DeltaPos[]) {
    return x.slice(0, -1).map(x => validator(x)).concat(validTrue(x[x.length - 1]))
  }
}

function sevenWithClearPath(direction: (i: number) => Delta): D[] {
  return (
    arraySizeSeven.map(direction)
      .map(asDeltaPos)
      .map(expandStepToPath)
      .map(checkValidInTheMiddle(validIfEmpty))
      .map(x => x.reduce((p, c) => validAll(p, c)))
  )
}

function buildValidator(type: PieceType, moveValidators: D[]) {
  return function validator(orig: Piece, board: Board): Piece[] {
    function checkIfValid(v) { return v(orig, board) }

    return moveValidators.map(checkIfValid).filter(Boolean)
  }
}

const whitePawnMoves = [
  validIfEmpty(asDeltaPos([0, 1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([1, 1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([-1, 1])),
  validAll(validIfEmpty(asDeltaPos([0, 1])), validAnd(validIfEmpty(asDeltaPos([0, 2])), validIfWhiteRank1)),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside));

const whitePawnMovesWithKingSafe = whitePawnMoves.map(x => validAnd(x, validIfKingSafe))

const blackPawnMoves = [
  validIfEmpty(asDeltaPos([0, -1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([1, -1])),
  validOr(validIfPassant, validIfEnemy)(asDeltaPos([-1, -1])),
  validAll(validIfEmpty(asDeltaPos([0, -1])), validAnd(validIfEmpty(asDeltaPos([0, -2])), validIfBlackRank1)),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside));

const blackPawnMovesWithKingSafe = blackPawnMoves.map(x => validAnd(x, validIfKingSafe))

const KnightMoves = ([
  [+1, +2],
  [+1, -2],
  [-1, +2],
  [-1, -2],
  [+2, +1],
  [+2, -1],
  [-2, +1],
  [-2, -1],
] as Delta[])
  .map(asDeltaPos)
  .map(x => validIfNoFriend(x))
  .map(x => validAnd(x, validIfInside))

const KnightMovesWithKingSafe = KnightMoves.map(x => validAnd(x, validIfKingSafe))

const rookMoves = [
  ...sevenWithClearPath(i => [0, i + 1]),
  ...sevenWithClearPath(i => [i + 1, 0]),
  ...sevenWithClearPath(i => [-i - 1, 0]),
  ...sevenWithClearPath(i => [0, -i - 1]),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside))

const rookMovesWithKingSafe = rookMoves.map(x => validAnd(x, validIfKingSafe))

const bishopMoves = [
  ...sevenWithClearPath(i => [i + 1, i + 1]),
  ...sevenWithClearPath(i => [i + 1, -i - 1]),
  ...sevenWithClearPath(i => [-i - 1, i + 1]),
  ...sevenWithClearPath(i => [-i - 1, -i - 1]),
]
  .map(x => validAnd(x, validIfNoFriend))
  .map(x => validAnd(x, validIfInside))

const bishopMovesWithKingSafe = bishopMoves.map(x => validAnd(x, validIfKingSafe))

const queenMoves = [...rookMoves, ...bishopMoves]

const queenMovesWithKingSafe = queenMoves.map(x => validAnd(x, validIfKingSafe))

const kingMoves = ([
  [+1, +1],
  [+1, 0],
  [+1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, +1],
  [0, +1],
] as Delta[])
  .map(asDeltaPos)
  .map(x => validIfNoFriend(x))
  .map(x => validAnd(x, validIfInside))

const kingMovesWithKingSafe = kingMoves
  .concat(validIfLongCastle(asDeltaPos([-2, 0])))
  .concat(validIfShortCastle(asDeltaPos([2, 0])))
  .map(x => validAnd(x, validIfKingSafe))

export const moves: { [k: string]: ((orig: Piece, board: Board) => Piece[]) } = {
  wp: buildValidator(PieceType.WhitePawn, whitePawnMovesWithKingSafe),
  bp: buildValidator(PieceType.BlackPawn, blackPawnMovesWithKingSafe),
  n: buildValidator(PieceType.Knight, KnightMovesWithKingSafe),
  r: buildValidator(PieceType.Rook, rookMovesWithKingSafe),
  b: buildValidator(PieceType.Bishop, bishopMovesWithKingSafe),
  q: buildValidator(PieceType.Queen, queenMovesWithKingSafe),
  k: buildValidator(PieceType.King, kingMovesWithKingSafe),
}

export function move(p: Pos, board: Board): Piece[] {
  const idx = p.x + p.y * 8
  const piece = board.pieces[idx]
  if (!piece) return []
  const algorithm = movesByType[piece.type]
  return algorithm(piece, board)
}


export interface Action {
  from: Piece;
  dest: Piece;
}

export enum MoveType {
  NORMAL, CONVERT, PASSANT, KING_MOVE, RIGHT_ROOK, LEFT_ROOK, RIGHT_CASTLE, LEFT_CASTLE,
}

export function makeMove(board: Board, action: Action): Board & {moveType: MoveType} {
  const { from, dest } = action
  const from_idx = from.x + from.y * 8
  const dest_idx = dest.x + dest.y * 8

  const castle: any = { ...board.castle };
  const pieces: Piece[] = [...board.pieces]

  const fi = board.pieces[from_idx]

  const fromRank = from.type === PieceType.WhitePawn ? 
    from.y : 
    (from.type === PieceType.BlackPawn ? 7 - from.y : 0);

  const toRank = from.type === PieceType.WhitePawn ? 
    dest.y : 
    (from.type === PieceType.BlackPawn ? 7 - dest.y : 0);

  const passant = (fromRank === 1 && toRank === 3) ? dest.x : undefined;
  const convert = toRank === 7

  // move pieces
  pieces[dest_idx] = { ...fi, x: dest.x, y: dest.y }
  pieces[from_idx] = null
  let moveType = MoveType.NORMAL;
  // last rank pawn convert to queen
  if (convert) {
    pieces[dest_idx].type = PieceType.Queen
    pieces[dest_idx].name = pieces[dest_idx].name === PieceName.BlackPawn ?
      PieceName.BlackQueen : 
      PieceName.WhiteQueen;

    moveType = MoveType.CONVERT;
  }

  // eat passant
  if ((from.type === PieceType.WhitePawn || from.type === PieceType.BlackPawn) && board.passant === dest.x && board.passant !== from.x) {
    pieces[dest.x + from.y * 8] = null
    moveType = MoveType.PASSANT;
  }
  
  // move the king cancel castle
  if (from.type === PieceType.King) {
    castle[fi.group].didMoveKing = true
    moveType = MoveType.KING_MOVE;
  }

  // move right rook cancel short castle
  if (from.type === PieceType.Rook && from.x === 7) {
    castle[fi.group].didMoveShortTower = true
    moveType = MoveType.RIGHT_ROOK;
  }

  // move left rook cancel long castle
  if (from.type === PieceType.Rook && from.x === 0) {
    castle[fi.group].didMoveLongTower = true
    moveType = MoveType.LEFT_ROOK;
  }

  // short castle
  if (from.type === PieceType.King && from.x === 4 && dest.x === 6) {
    const tower = pieces[7 + from.y * 8]
    pieces[7 + from.y * 8] = null
    pieces[5 + from.y * 8] = tower
    tower.x = 5
    moveType = MoveType.RIGHT_CASTLE;
  }

  // long castle
  if (from.type === PieceType.King && from.x === 4 && dest.x === 2) {
    const tower = pieces[0 + from.y * 8]
    pieces[0 + from.y * 8] = null
    pieces[3 + from.y * 8] = tower
    tower.x = 3
    moveType = MoveType.LEFT_CASTLE;
  }

  return { castle, passant, pieces, moveType }
}

const threats: { [k: string]: ((orig: Piece, board: Board) => Piece[]) } = {
  wp: buildValidator(PieceType.WhitePawn, whitePawnMoves),
  bp: buildValidator(PieceType.BlackPawn, blackPawnMoves),
  n: buildValidator(PieceType.Knight, KnightMoves),
  r: buildValidator(PieceType.Rook, rookMoves),
  b: buildValidator(PieceType.Bishop, bishopMoves),
  q: buildValidator(PieceType.Queen, queenMoves),
  k: buildValidator(PieceType.King, kingMoves),
}

export const movesByType = [
  (): Piece[] => [], //noop
  moves.wp,
  moves.bp,
  moves.n,
  moves.r,
  moves.b,
  moves.q,
  moves.k,
]

export const threatsByType = [
  (): Piece[] => [], //noop
  threats.wp,
  threats.bp,
  threats.n,
  threats.r,
  threats.b,
  threats.q,
  threats.k,
]

function createPiece(name: string) {
  return {
    x: name.codePointAt(2) - 'a'.codePointAt(0),
    y: name.codePointAt(3) - '1'.codePointAt(0),
    group: (name.charAt(0) !== name.charAt(0).toLocaleLowerCase()) ? 2 : 3,
    type: pieceTypeByName(name.charAt(0)),
    name: pieceNameByName(name.charAt(0)),
  }
}

function explodeFen(id: string): string | Array<null> {
  const v = parseInt(id)
  if (!isNaN(v)) {
    const emptyList = Array<null>(v);
    emptyList.fill(null)
    return emptyList
  }
  return id
}

function createFen(id: string | null, y: number, x: number): Piece {
  if (!id) return null
  return {
    x,y,
    group: (id !== id.toLocaleLowerCase()) ? 2 : 3,
    type: pieceTypeByName(id),
    name: pieceNameByName(id),
  }
}

export function translateFen(fen: string): Piece[] {
  const fields = fen.split(' ')
  if (!fields && fields.length < 6) throw Error(`invalid fen: no enough fields "${fen}"`)
  const [ pieces, turn, castling, passant, clock, moves ] = fields
  return pieces.split('/').map((row, ir) => {
    return row.split('').map(explodeFen).flat().map((p, ic) => createFen(p,ir,ic))
  }).flat()
  // return orderPieces([])
}

export function translatePieces(ps: string[]): Piece[] {
  return orderPieces(ps.map(createPiece))
}

function orderPieces<T extends Pos>(pieces: T[]): T[] {
  const emptyBoard = Array(8 * 8);
  emptyBoard.fill(null)
  pieces.forEach(function setBoardIfPresent(p) {
    if (p) emptyBoard[p.x + p.y * 8] = p
  })
  return emptyBoard
}


export const pieceTypeByName = (str: string): PieceType => {
  switch (str.toLowerCase()) {
    case 'b': return PieceType.Bishop;
    case 'k': return PieceType.King;
    case 'n': return PieceType.Knight;
    case 'r': return PieceType.Rook;
    case 'q': return PieceType.Queen;
    case 'p': return str !== str.toLowerCase() ? PieceType.WhitePawn : PieceType.BlackPawn;
    default: throw Error('unkown piace type' + str)
  }
}

export const pieceNameByName = (str: string): PieceName => {
  switch (str) {
    case 'p': return PieceName.BlackPawn;
    case 'b': return PieceName.BlackBishop;
    case 'k': return PieceName.BlackKing;
    case 'n': return PieceName.BlackKnight;
    case 'r': return PieceName.BlackRook;
    case 'q': return PieceName.BlackQueen;

    case 'P': return PieceName.WhitePawn;
    case 'B': return PieceName.WhiteBishop;
    case 'K': return PieceName.WhiteKing;
    case 'N': return PieceName.WhiteKnight;
    case 'R': return PieceName.WhiteRook;
    case 'Q': return PieceName.WhiteQueen;

    default: throw Error('unknown piece name' + str)
  }
}

/**
 * Trouve le roi d'un groupe donné sur le plateau
 */
export function findKing(board: Board, group: number): Piece | null {
  return board.pieces.find(piece => 
    piece && piece.type === PieceType.King && piece.group === group
  ) || null;
}

/**
 * Vérifie si le roi d'un groupe donné est en échec
 */
export function isInCheck(board: Board, group: number): boolean {
  const king = findKing(board, group);
  if (!king) return false;
  
  const threatened = threatZone(board);
  const kingIndex = king.x + king.y * 8;
  
  // Le roi est en échec s'il est dans une zone de menace ennemie
  return (threatened[kingIndex] % first20Primes[group]) !== 0;
}

/**
 * Vérifie si un mouvement est légal (ne met pas son propre roi en échec)
 */
export function isLegalMove(board: Board, action: Action): boolean {
  const testBoard = makeMove(board, action);
  return !isInCheck(testBoard, action.from.group);
}

/**
 * Obtient tous les mouvements légaux pour une pièce spécifique
 */
export function getLegalMovesForPiece(board: Board, piece: Piece): Action[] {
  const possibleMoves = move({ x: piece.x, y: piece.y }, board);
  const legalMoves: Action[] = [];
  
  possibleMoves.forEach(dest => {
    const action: Action = {
      from: piece,
      dest: { ...dest, group: piece.group, type: piece.type, name: piece.name }
    };
    
    if (isLegalMove(board, action)) {
      legalMoves.push(action);
    }
  });
  
  return legalMoves;
}

/**
 * Obtient tous les mouvements légaux pour un groupe donné
 */
export function getAllLegalMoves(board: Board, group: number): Action[] {
  const legalMoves: Action[] = [];
  
  board.pieces.forEach((piece) => {
    if (!piece || piece.group !== group) return;
    
    const pieceLegalMoves = getLegalMovesForPiece(board, piece);
    legalMoves.push(...pieceLegalMoves);
  });
  
  return legalMoves;
}

/**
 * Vérifie si un groupe est en mat
 */
export function isCheckmate(board: Board, group: number): boolean {
  // Un groupe est en mat s'il est en échec ET n'a aucun mouvement légal
  return isInCheck(board, group) && getAllLegalMoves(board, group).length === 0;
}

/**
 * Vérifie si un groupe est en pat (stalemate)
 */
export function isStalemate(board: Board, group: number): boolean {
  // Un groupe est en pat s'il n'est PAS en échec mais n'a aucun mouvement légal
  return !isInCheck(board, group) && getAllLegalMoves(board, group).length === 0;
}

/**
 * Détermine l'état du jeu pour un groupe donné
 */
export enum GameState {
  NORMAL = 'normal',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate'
}

export function getGameState(board: Board, group: number): GameState {
  const inCheck = isInCheck(board, group);
  const hasLegalMoves = getAllLegalMoves(board, group).length > 0;
  
  if (inCheck && !hasLegalMoves) {
    return GameState.CHECKMATE;
  } else if (!inCheck && !hasLegalMoves) {
    return GameState.STALEMATE;
  } else if (inCheck) {
    return GameState.CHECK;
  } else {
    return GameState.NORMAL;
  }
}

/**
 * Vérifie si un mouvement donné met le roi adverse en échec
 */
export function givesCheck(board: Board, action: Action): boolean {
  const newBoard = makeMove(board, action);
  const opponentGroup = action.from.group === 2 ? 3 : 2; // Alterne entre groupe 2 et 3
  return isInCheck(newBoard, opponentGroup);
}

/**
 * Vérifie si un mouvement donné met le roi adverse en mat
 */
export function givesCheckmate(board: Board, action: Action): boolean {
  const newBoard = makeMove(board, action);
  const opponentGroup = action.from.group === 2 ? 3 : 2;
  return isCheckmate(newBoard, opponentGroup);
}

/**
 * Vérifie s'il y a suffisamment de matériel pour faire mat
 */
export function hasSufficientMaterial(board: Board): boolean {
  const pieces = board.pieces.filter(p => p !== null);
  
  // Compter les pièces par type et couleur
  const whitePieces = pieces.filter(p => p.group === 2);
  const blackPieces = pieces.filter(p => p.group === 3);
  
  const hasQueen = (pieces: Piece[]) => pieces.some(p => p.type === PieceType.Queen);
  const hasRook = (pieces: Piece[]) => pieces.some(p => p.type === PieceType.Rook);
  const hasPawn = (pieces: Piece[]) => pieces.some(p => p.type === PieceType.WhitePawn || p.type === PieceType.BlackPawn);
  const bishopCount = (pieces: Piece[]) => pieces.filter(p => p.type === PieceType.Bishop).length;
  const knightCount = (pieces: Piece[]) => pieces.filter(p => p.type === PieceType.Knight).length;
  
  // Si l'un des camps a une dame, une tour ou un pion, il y a suffisamment de matériel
  if (hasQueen(whitePieces) || hasQueen(blackPieces) || 
      hasRook(whitePieces) || hasRook(blackPieces) ||
      hasPawn(whitePieces) || hasPawn(blackPieces)) {
    return true;
  }
  
  // Vérifier les cas spéciaux de matériel insuffisant
  for (const pieces of [whitePieces, blackPieces]) {
    const bishops = bishopCount(pieces);
    const knights = knightCount(pieces);
    
    // Roi + 2 cavaliers ou plus peut faire mat
    if (knights >= 2) return true;
    
    // Roi + fou + cavalier peut faire mat
    if (bishops >= 1 && knights >= 1) return true;
    
    // Roi + 2 fous ou plus peut faire mat
    if (bishops >= 2) return true;
  }
  
  // Cas insuffisants : Roi seul, Roi + cavalier, Roi + fou
  return false;
}

/**
 * Structure pour représenter l'état complet du jeu incluant l'historique
 */
export interface GameInfo {
  board: Board;
  currentPlayer: number; // 2 pour blanc, 3 pour noir
  moveHistory: Action[];
  fiftyMoveCounter: number;
  positionHistory: string[]; // Pour détecter la répétition
}

/**
 * Vérifie si la partie est nulle par la règle des 50 coups
 */
export function isFiftyMoveRule(gameInfo: GameInfo): boolean {
  return gameInfo.fiftyMoveCounter >= 50;
}

/**
 * Vérifie si la partie est nulle par répétition de position (3 fois)
 */
export function isThreefoldRepetition(gameInfo: GameInfo): boolean {
  const currentPosition = gameInfo.positionHistory[gameInfo.positionHistory.length - 1];
  const occurrences = gameInfo.positionHistory.filter(pos => pos === currentPosition).length;
  return occurrences >= 3;
}

/**
 * État complet du jeu incluant toutes les conditions de fin
 */
export enum CompleteGameState {
  NORMAL = 'normal',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW_FIFTY_MOVE = 'draw_fifty_move',
  DRAW_REPETITION = 'draw_repetition',
  DRAW_INSUFFICIENT_MATERIAL = 'draw_insufficient_material'
}

/**
 * Détermine l'état complet du jeu
 */
export function getCompleteGameState(gameInfo: GameInfo): CompleteGameState {
  const { board, currentPlayer } = gameInfo;
  
  // Vérifier les conditions de nullité
  if (isFiftyMoveRule(gameInfo)) {
    return CompleteGameState.DRAW_FIFTY_MOVE;
  }
  
  if (isThreefoldRepetition(gameInfo)) {
    return CompleteGameState.DRAW_REPETITION;
  }
  
  if (!hasSufficientMaterial(board)) {
    return CompleteGameState.DRAW_INSUFFICIENT_MATERIAL;
  }
  
  // Vérifier l'état du joueur actuel
  const basicState = getGameState(board, currentPlayer);
  
  switch (basicState) {
    case GameState.CHECKMATE:
      return CompleteGameState.CHECKMATE;
    case GameState.STALEMATE:
      return CompleteGameState.STALEMATE;
    case GameState.CHECK:
      return CompleteGameState.CHECK;
    default:
      return CompleteGameState.NORMAL;
  }
}

/**
 * Crée une représentation string de la position pour détecter les répétitions
 */
export function getPositionString(board: Board): string {
  let position = '';
  
  // Ajouter les pièces
  for (let i = 0; i < 64; i++) {
    const piece = board.pieces[i];
    if (piece) {
      position += `${piece.name}${i}`;
    }
  }
  
  // Ajouter les droits de roque
  Object.keys(board.castle).forEach(group => {
    const castleRights = board.castle[group];
    position += `${group}:${castleRights.didMoveKing}${castleRights.didMoveShortTower}${castleRights.didMoveLongTower}`;
  });
  
  // Ajouter en passant
  if (board.passant !== undefined) {
    position += `ep${board.passant}`;
  }
  
  return position;
}

/**
 * Met à jour le GameInfo après un mouvement
 */
export function updateGameInfo(gameInfo: GameInfo, action: Action): GameInfo {
  const newBoard = makeMove(gameInfo.board, action);
  const { from } = action;
  
  // Mettre à jour le compteur de 50 coups
  let newFiftyMoveCounter = gameInfo.fiftyMoveCounter + 1;
  
  // Réinitialiser si c'est un mouvement de pion ou une capture
  const isPawnMove = from.type === PieceType.WhitePawn || from.type === PieceType.BlackPawn;
  const isCapture = gameInfo.board.pieces[action.dest.x + action.dest.y * 8] !== null;
  
  if (isPawnMove || isCapture) {
    newFiftyMoveCounter = 0;
  }
  
  // Alterner le joueur
  const newCurrentPlayer = gameInfo.currentPlayer === 2 ? 3 : 2;
  
  // Ajouter la nouvelle position à l'historique
  const newPositionString = getPositionString(newBoard);
  const newPositionHistory = [...gameInfo.positionHistory, newPositionString];
  
  return {
    board: newBoard,
    currentPlayer: newCurrentPlayer,
    moveHistory: [...gameInfo.moveHistory, action],
    fiftyMoveCounter: newFiftyMoveCounter,
    positionHistory: newPositionHistory
  };
}

/**
 * Crée un GameInfo initial
 */
export function createInitialGameInfo(board: Board, startingPlayer: number = 2): GameInfo {
  return {
    board,
    currentPlayer: startingPlayer,
    moveHistory: [],
    fiftyMoveCounter: 0,
    positionHistory: [getPositionString(board)]
  };
}

// function printState(pieces) {
//   let result = ''
//   for(let j = 0; j < 64; j++) {
//     const x = j%8
//     const y = Math.floor(j/8)
//     const i = x + (7-y) * 8
//     const c = pieces[i]
//     result += (c?c.type:' ')+((i+1)%8?'':` ${Math.floor(i/8)+1}\n`)
//   }
//   result += '\nabcdefgh'
//   console.log(result)
// }

