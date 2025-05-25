const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('client'));

const games = {};
const playerData = {}; // socket.id -> { name, x, y, color }
const wyrVotes = {}; // { roomCode: { questionIndex: { a: count, b: count } } }

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getRandomColor() {
  // Generates a random hex color
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

io.on('connection', (socket) => {
  socket.on('createGame', ({ name }) => {
    let code;
    do {
      code = generateCode();
    } while (games[code]);
    games[code] = [socket.id];
    const playerColor = getRandomColor();
    playerData[socket.id] = { name, x: 100, y: 100, color: playerColor }; // spawn at (100, 100)
    socket.join(code);
    socket.emit('gameCreated', code);
    socket.emit('playerColor', playerColor);
    updatePlayerList(code);
    sendPlayerPositions(code);
  });

  socket.on('joinGame', ({ code, name }) => {
    if (!games[code]) {
      socket.emit('errorMsg', 'Room code not found.');
      return;
    }
    if (games[code].length >= 20) { // Set your desired limit here
      socket.emit('errorMsg', 'Room is full.');
      return;
    }
    games[code].push(socket.id);
    const playerColor = getRandomColor();
    playerData[socket.id] = { name, x: 400, y: 200, color: playerColor }; // spawn at (400, 200)
    socket.join(code);
    socket.emit('gameJoined', code);
    socket.emit('playerColor', playerColor);
    updatePlayerList(code);
    sendPlayerPositions(code);
  });

  socket.on('getPlayerList', () => {
    const code = getPlayerGameCode(socket.id);
    if (code) updatePlayerList(code);
  });

  socket.on('chatMessage', (msg) => {
    const code = getPlayerGameCode(socket.id);
    if (code && playerData[socket.id]) {
      io.to(code).emit('chatMessage', { name: playerData[socket.id].name, msg });
    }
  });

  socket.on('leaveGame', () => {
    const code = getPlayerGameCode(socket.id);
    if (code) {
      games[code] = games[code].filter(id => id !== socket.id);
      if (games[code].length === 0) delete games[code];
      else {
        updatePlayerList(code);
        sendPlayerPositions(code);
      }
    }
    delete playerData[socket.id];
  });

  socket.on('disconnect', () => {
    const code = getPlayerGameCode(socket.id);
    if (code) {
      games[code] = games[code].filter(id => id !== socket.id);
      if (games[code].length === 0) delete games[code];
      else {
        updatePlayerList(code);
        sendPlayerPositions(code);
      }
    }
    delete playerData[socket.id];
  });

  // Handle movement
  socket.on('move', ({ dx, dy }) => {
    if (playerData[socket.id]) {
      playerData[socket.id].x += dx;
      playerData[socket.id].y += dy;
      const code = getPlayerGameCode(socket.id);
      if (code) sendPlayerPositions(code);
    }
  });

  socket.on('kickPlayer', (targetId) => {
    const code = getPlayerGameCode(socket.id);
    if (!code) return;
    const hostId = games[code][0];
    if (socket.id !== hostId) return; // Only host can kick

    // Remove the player from the game
    games[code] = games[code].filter(id => id !== targetId);
    if (games[code].length === 0) {
      delete games[code];
    } else {
      updatePlayerList(code);
      sendPlayerPositions(code);
    }
    // Notify the kicked player
    io.to(targetId).emit('kicked');
    delete playerData[targetId];
  });

  socket.on('wyrVote', ({ code, questionIndex, option }) => {
    if (!wyrVotes[code]) wyrVotes[code] = {};
    if (!wyrVotes[code][questionIndex]) wyrVotes[code][questionIndex] = { a: 0, b: 0 };
    wyrVotes[code][questionIndex][option]++;
    // Broadcast results to everyone in the room
    io.to(code).emit('wyrResults', {
      questionIndex,
      results: wyrVotes[code][questionIndex]
    });
  });

  function updatePlayerList(code) {
    const hostId = games[code][0]; // First player is host
    const players = games[code].map(id => ({
      id,
      name: playerData[id]?.name || 'Unknown',
      isHost: id === hostId
    }));
    io.to(code).emit('playerList', { players, hostId });
  }

  // Send all player positions to clients in the room
  function sendPlayerPositions(code) {
    const positions = games[code].map(id => ({
      name: playerData[id].name,
      x: playerData[id].x,
      y: playerData[id].y,
      color: playerData[id].color
    }));
    io.to(code).emit('playerPositions', positions);
  }

  function getPlayerGameCode(socketId) {
    for (const code in games) {
      if (games[code].includes(socketId)) {
        return code;
      }
    }
    return null;
  }
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server listening on http://0.0.0.0:3000');
});