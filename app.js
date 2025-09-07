const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

let rooms = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", function (uniquesocket) {
    console.log("connected");

    uniquesocket.on("joinRoom", (roomId) => {
        uniquesocket.join(roomId);
        if (!rooms[roomId]) {
            rooms[roomId] = { players: {}, chess: new Chess() };
        }
        const room = rooms[roomId];
        if (!room.players.white) {
            room.players.white = uniquesocket.id;
            uniquesocket.emit("playerRole", "w");
        } else if (!room.players.black) {
            room.players.black = uniquesocket.id;
            uniquesocket.emit("playerRole", "b");
        } else {
            uniquesocket.emit("spectatorRole");
            io.to(roomId).emit("spectatorJoined");
        }

        uniquesocket.emit("initialBoard", { fen: room.chess.fen(), history: room.chess.history({ verbose: true }) });

        if (room.players.white && room.players.black) {
            io.to(roomId).emit("initialBoard", { fen: room.chess.fen(), history: room.chess.history({ verbose: true }) });
        }
    });

    uniquesocket.on("disconnect", function () {
        let roomIdToRemove = null;
        for (const roomId in rooms) {
            const room = rooms[roomId];
            if (uniquesocket.id === room.players.white) {
                delete room.players.white;
                if (!room.players.black) {
                    roomIdToRemove = roomId;
                }
            } else if (uniquesocket.id === room.players.black) {
                delete room.players.black;
                if (!room.players.white) {
                    roomIdToRemove = roomId;
                }
            }
        }
        if (roomIdToRemove) {
            delete rooms[roomIdToRemove];
        }
    });

    uniquesocket.on("move", (move) => {
        const roomsKeys = Object.keys(rooms);
        let roomId = null;
        let currentRoom = null;
        for (const rId of roomsKeys) {
            if (uniquesocket.rooms.has(rId)) {
                roomId = rId;
                currentRoom = rooms[rId];
                break;
            }
        }
        if (!currentRoom) return;

        try {
            if (currentRoom.chess.turn() === 'w' && uniquesocket.id !== currentRoom.players.white) return;
            if (currentRoom.chess.turn() === 'b' && uniquesocket.id !== currentRoom.players.black) return;

            const result = currentRoom.chess.move(move);
            if (result) {
                io.to(roomId).emit("move", result);
                io.to(roomId).emit("boardState", currentRoom.chess.fen());
            } else {
                console.log("invalidmove: ", move);
                uniquesocket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("Invalid move: ", move);
        }
    });

    uniquesocket.on("newGame", () => {
        const roomsKeys = Object.keys(rooms);
        let roomId = null;
        let currentRoom = null;
        for (const rId of roomsKeys) {
            if (uniquesocket.rooms.has(rId)) {
                roomId = rId;
                currentRoom = rooms[rId];
                break;
            }
        }
        if (!currentRoom) return;

        currentRoom.chess = new Chess();
        io.to(roomId).emit("initialBoard", { fen: currentRoom.chess.fen(), history: [] });
    });
});

server.listen(3000, function () {
    console.log("listening on port 3000");
});