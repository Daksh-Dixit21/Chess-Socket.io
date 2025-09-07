const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let lastMove = null;
let king_in_check = null;
let gameHistory = [];

// UI Elements
const waitingOverlay = document.getElementById("waiting-overlay");
const waitingText = document.getElementById("waiting-text");
const createRoomBtn = document.getElementById("create-room-btn");
const shareLinkBtn = document.getElementById("share-link-btn");
const playerStatus = document.getElementById("player-status");
const roomInfo = document.getElementById("room-info");
const roomIdDisplay = document.getElementById("room-id-display");
const copyRoomUrlBtn = document.getElementById("copy-room-url-btn");
const turnInfo = document.getElementById("turn-info");
const moveHistory = document.getElementById("move-history");
const gameOverOverlay = document.getElementById("game-over-overlay");
const gameOverTitle = document.getElementById("game-over-title");
const gameOverMessage = document.getElementById("game-over-message");
const newGameBtn = document.getElementById("new-game-btn");

// Get room from URL
const urlParams = new URLSearchParams(window.location.search);
let currentRoomId = urlParams.get('room');

// If room in URL, join it
if (currentRoomId) {
    socket.emit('joinRoom', currentRoomId);
    waitingText.textContent = "Joining room...";
} else {
    waitingText.textContent = "Create a room to start playing.";
}

// Create Room Button
createRoomBtn.addEventListener('click', () => {
    const newRoomId = Math.random().toString(36).substring(2, 15);
    currentRoomId = newRoomId;
    const newUrl = `${window.location.origin}${window.location.pathname}?room=${newRoomId}`;
    window.history.pushState({}, '', newUrl);
    socket.emit('joinRoom', newRoomId);
    shareLinkBtn.style.display = 'inline-block';
    waitingText.textContent = "Room created. Waiting for opponent...";
});

// Share Link Button
shareLinkBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('Link copied to clipboard!');
    });
});

// Copy Room ID Button
copyRoomUrlBtn.addEventListener('click', () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('Room URL copied to clipboard!');
    });
});

newGameBtn.addEventListener('click', () => {
    socket.emit('newGame');
});

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    clearLegalMoves();

    if (chess.in_check()) {
        const board = chess.board();
        let kingRow = -1;
        let kingCol = -1;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const square = board[r][c];
                if (square && square.type === 'k' && square.color === chess.turn()) {
                    kingRow = r;
                    kingCol = c;
                    break;
                }
            }
            if (kingRow !== -1) break;
        }
        if (kingRow !== -1 && kingCol !== -1) {
            const kingSquareElement = document.querySelector(`[data-row='${kingRow}'][data-col='${kingCol}']`);
            if (kingSquareElement) {
                kingSquareElement.classList.add('check');
            }
        }
    }

    board.forEach((row, rowindex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareIndex;

            if (lastMove && lastMove.from === `${String.fromCharCode(97 + squareIndex)}${8 - rowindex}` || lastMove && lastMove.to === `${String.fromCharCode(97 + squareIndex)}${8 - rowindex}`) {
                squareElement.classList.add("last-move-highlight");
            }

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                        showLegalMoves(sourceSquare);
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                    clearLegalMoves();
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
    updateTurnInfo();
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q",
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
        P: "♟", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
    };
    return unicodePieces[piece.type] || "";
};

const showLegalMoves = (square) => {
    const moves = chess.moves({ square: `${String.fromCharCode(97 + square.col)}${8 - square.row}`, verbose: true });
    moves.forEach(move => {
        const targetSquare = document.querySelector(`[data-row='${8 - parseInt(move.to.slice(1, 2))}'][data-col='${move.to.charCodeAt(0) - 97}']`);
        if (targetSquare) {
            const dot = document.createElement('div');
            dot.classList.add('legal-move-dot');
            targetSquare.appendChild(dot);
        }
    });
};

const clearLegalMoves = () => {
    const dots = document.querySelectorAll('.legal-move-dot');
    dots.forEach(dot => dot.remove());
};

const updateTurnInfo = () => {
    turnInfo.textContent = `Turn: ${chess.turn() === 'w' ? 'White' : 'Black'}`;
};

const updateMoveHistory = () => {
    moveHistory.innerHTML = "";
    const history = gameHistory;
    if (!Array.isArray(history)) return;
    for (let i = 0; i < history.length; i += 2) {
        const whiteMove = (history[i] && history[i].san) ? history[i].san : '';
        const blackMove = (history[i + 1] && history[i + 1].san) ? history[i + 1].san : '';
        const moveElement = document.createElement("div");
        moveElement.textContent = `${Math.floor(i / 2) + 1}. ${whiteMove} ${blackMove}`;
        moveHistory.appendChild(moveElement);
    }
    moveHistory.scrollTop = moveHistory.scrollHeight;
};

socket.on("playerRole", (role) => {
    playerRole = role;
    waitingOverlay.style.display = 'none';
    if (currentRoomId) {
        roomIdDisplay.textContent = currentRoomId;
    }
    if (role === 'w') {
        playerStatus.textContent = 'You are Player 1 (White)';
    } else if (role === 'b') {
        playerStatus.textContent = 'You are Player 2 (Black)';
    }
});

socket.on("spectatorRole", () => {
    playerRole = null;
    waitingOverlay.style.display = 'none';
    if (currentRoomId) {
        roomIdDisplay.textContent = currentRoomId;
    }
    playerStatus.textContent = 'You are a Spectator';
});

socket.on("spectatorJoined", () => {
    alert("A spectator has joined the room.");
});

socket.on("initialBoard", (data) => {
    gameHistory = Array.isArray(data.history) ? data.history : [];
    chess.reset();
    gameHistory.forEach(move => {
        if (move) chess.move(move);
    });
    lastMove = null;
    king_in_check = null;
    renderBoard();
    updateMoveHistory();
});

socket.on("move", (move) => {
    chess.move(move);
    lastMove = move;
    gameHistory.push(move);
    renderBoard();
    updateMoveHistory();

    if (chess.game_over()) {
        gameOverOverlay.style.display = "flex";
        if (chess.in_checkmate()) {
            gameOverTitle.textContent = "Checkmate!";
            gameOverMessage.textContent = `${chess.turn() === 'w' ? 'Black' : 'White'} wins by checkmate.`;
        } else if (chess.in_draw()) {
            gameOverTitle.textContent = "Draw!";
            let reason = "";
            if (chess.in_stalemate()) {
                reason = "Stalemate";
            } else if (chess.in_threefold_repetition()) {
                reason = "Threefold Repetition";
            } else if (chess.insufficient_material()) {
                reason = "Insufficient Material";
            }
            gameOverMessage.textContent = `The game is a draw due to ${reason}.`;
        }
        setTimeout(() => {
            socket.emit('newGame');
        }, 3000);
    }
});

socket.on("invalidMove", (move) => {
    console.log("Invalid move:", move);
});
