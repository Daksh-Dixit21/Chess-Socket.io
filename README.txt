# Chess Game

This is a real-time multiplayer Chess game built with Node.js, Express, Socket.io, and Chess.js. It allows two players to play chess online in a shared room, with support for spectators, move history, and game state synchronization.

## Features

- Real-time gameplay between two players (White and Black) using WebSockets.
- Spectator mode to watch ongoing games.
- Move validation and game state management using Chess.js.
- Visual board rendering with drag-and-drop piece movement.
- Highlighting of legal moves and check status.
- Move history display with SAN notation.
- Automatic game reset on checkmate or draw.
- Room creation and joining via URL.
- Copyable room links for easy sharing.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd chess
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

- Click "Create Room" to start a new game room.
- Share the room URL with an opponent to join the game.
- Drag and drop pieces to make moves.
- Spectators can join the room URL to watch the game.
- The game automatically resets after checkmate or draw.
- Move history is displayed and synchronized for all participants.

## Project Structure

- `app.js`: Server-side application with Express and Socket.io.
- `public/js/chessgame.js`: Client-side JavaScript handling UI and socket communication.
- `public/css/style.css`: Styles for the chessboard and UI.
- `views/index.ejs`: Main HTML template rendered by Express.

## Dependencies

- [Express](https://expressjs.com/) - Web framework for Node.js.
- [Socket.io](https://socket.io/) - Real-time bidirectional event-based communication.
- [Chess.js](https://github.com/jhlywa/chess.js) - Chess game logic and move validation.
- [EJS](https://ejs.co/) - Embedded JavaScript templating.

## Future Improvements

- Add user profiles and authentication.
- Implement game timers and clocks.
- Enhance UI/UX with animations and sound effects.
- Add chat functionality within rooms.
- Support for game saving and loading.

## License

This project is licensed under the ISC License.
