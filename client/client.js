const socket = io();

const nameInput = document.getElementById('nameInput');
const createGameBtn = document.getElementById('createGameBtn');
const joinGameBtn = document.getElementById('joinGameBtn');
const gameCodeInput = document.getElementById('gameCodeInput');
const statusDiv = document.getElementById('status');
const ieuDiv = document.getElementById('ieu');
const playerListDiv = document.getElementById('playerList');
const chatMessagesDiv = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const leaveIeuBtn = document.getElementById('leaveIeuBtn');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const playerPanel = document.getElementById('playerPanel');
const toggleTVBtn = document.getElementById('toggleTVBtn');
const bfdiPlayer = document.getElementById('bfdiPlayer');

toggleTVBtn.onclick = () => {
  if (bfdiPlayer.style.display === 'none' || !bfdiPlayer.style.display) {
    bfdiPlayer.style.display = 'block';
    bfdiPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    bfdiPlayer.style.display = 'none';
  }
};

let playerPositions = [];
let myColor = '#000000';
let mySocketId = null;
let currentRoomCode = null;
let currentQuestionIndex = null;

createGameBtn.onclick = () => {
  const name = nameInput.value.trim();
  if (!name) {
    statusDiv.textContent = 'Please enter your name.';
    return;
  }
  socket.emit('createGame', { name });
};

joinGameBtn.onclick = () => {
  const name = nameInput.value.trim();
  const code = gameCodeInput.value.trim();
  if (!name) {
    statusDiv.textContent = 'Please enter your name.';
    return;
  }
  if (code.length === 6) {
    socket.emit('joinGame', { code, name });
  } else {
    statusDiv.textContent = 'Please enter a valid 6-digit code.';
  }
};

sendChatBtn.onclick = () => {
  const msg = chatInput.value.trim();
  if (msg) {
    socket.emit('chatMessage', msg);
    chatInput.value = '';
  }
};

leaveIeuBtn.onclick = () => {
  socket.emit('leaveGame');
  ieuDiv.style.display = 'none';
  leaveIeuBtn.style.display = 'none';
  statusDiv.textContent = 'You left the game.';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

socket.on('connect', () => {
  mySocketId = socket.id;
});

socket.on('gameCreated', (code) => {
  currentRoomCode = code; // Add this line
  statusDiv.textContent = `Game created! Code: ${code}. Waiting for players...`;
  createGameBtn.textContent = `Code: ${code}`;
  showIEU();
});

socket.on('gameJoined', (code) => {
  currentRoomCode = code; // Add this line
  statusDiv.textContent = `Joined game ${code}!`;
  showIEU();
});

socket.on('errorMsg', (msg) => {
  statusDiv.textContent = msg;
});

socket.on('playerList', ({ players, hostId }) => {
  renderPlayerList(players);
  playerPanel.innerHTML = '';
  players.forEach(player => {
    const div = document.createElement('div');
    div.className = 'playerPanel-player';
    div.textContent = player.name;

    // Host indicator
    if (player.isHost) {
      const goldSquare = document.createElement('span');
      goldSquare.className = 'playerPanel-host-gold';
      div.appendChild(goldSquare);
    }

    // Kick button (only if you are host and not yourself)
    if (hostId === mySocketId && player.id !== mySocketId) {
      const kickBtn = document.createElement('button');
      kickBtn.className = 'playerPanel-kick';
      kickBtn.textContent = 'Kick';
      kickBtn.onclick = () => {
        socket.emit('kickPlayer', player.id);
      };
      div.appendChild(kickBtn);
    }

    playerPanel.appendChild(div);
  });
});

socket.on('chatMessage', ({ name, msg }) => {
  const div = document.createElement('div');
  div.textContent = `${name}: ${msg}`;
  chatMessagesDiv.appendChild(div);
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Auto-scroll to bottom
});

socket.on('playerPositions', (positions) => {
  playerPositions = positions;
  drawPlayers();
});

socket.on('playerColor', (color) => {
  myColor = color;
  // Use this color for your player display
});

socket.on('kicked', () => {
  alert('You have been kicked from the lobby.');
  location.reload();
});

function showIEU() {
  ieuDiv.style.display = 'block';
  leaveIeuBtn.style.display = 'inline-block';
  socket.emit('getPlayerList');
}

function drawPlayers() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of playerPositions) {
    ctx.fillStyle = p.color || "#3b82f6"; // Use player's color, fallback to default
    ctx.beginPath();
    ctx.fillRect(p.x - 15, p.y - 15, 30, 30); // Draws a square centered at (p.x, p.y)
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(p.name, p.x, p.y - 20);
  }
}

function renderPlayerList(players) {
  const playerListDiv = document.getElementById('playerList');
  playerListDiv.innerHTML = '';
  players.forEach(player => {
    const div = document.createElement('div');
    div.textContent = player.name;
    div.style.color = player.color; // Use assigned color
    playerListDiv.appendChild(div);
  });
}

// Movement controls (WASD or arrow keys)
document.addEventListener('keydown', (e) => {
  let dx = 0, dy = 0;
  if (e.key === 'ArrowUp' || e.key === 'w') dy = -5;
  if (e.key === 'ArrowDown' || e.key === 's') dy = 5;
  if (e.key === 'ArrowLeft' || e.key === 'a') dx = -5;
  if (e.key === 'ArrowRight' || e.key === 'd') dx = 5;
  if (dx !== 0 || dy !== 0) {
    socket.emit('move', { dx, dy });
  }
});

window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('toggleChat').addEventListener('change', function() {
    document.getElementById('chat').style.display = this.checked ? '' : 'none';
  });
  document.getElementById('togglePlayerList').addEventListener('change', function() {
    document.getElementById('playerList').style.display = this.checked ? '' : 'none';
  });
  document.getElementById('toggleMusic').addEventListener('change', function() {
    document.getElementById('musicPlayerWidget').style.display = this.checked ? '' : 'none';
  });
});

const wyrQuestions = [
  { a: "Be able to fly", b: "Be invisible" },
  { a: "Live without music", b: "Live without TV" },
  { a: "Only eat sweet food", b: "Only eat salty food" },
  { a: "Blue Bell", b: "Ben & Jerry's" },
  { a: "Eat 10 pizzas", b: "Eat 10 tacos" },
  { a: "Celebrate Cinco De' Mayo", b: "Celebrate Honicas" },
  { a: "Work for 15 hours strait", b: "Stay in school for 15 hours" },
  // Add more questions here!
];

const openWYRBtn = document.getElementById('openWYRBtn');
const wyrModal = document.getElementById('wyrModal');
const closeWYRBtn = document.getElementById('closeWYRBtn');
const wyrQuestionDiv = document.getElementById('wyrQuestion');
const wyrOptionA = document.getElementById('wyrOptionA');
const wyrOptionB = document.getElementById('wyrOptionB');

openWYRBtn.onclick = () => {
  currentQuestionIndex = Math.floor(Math.random() * wyrQuestions.length); // Add this line
  const q = wyrQuestions[currentQuestionIndex];
  wyrQuestionDiv.textContent = "Would you rather...";
  wyrOptionA.textContent = q.a;
  wyrOptionB.textContent = q.b;
  wyrOptionA.style.display = '';
  wyrOptionB.style.display = '';
  wyrModal.style.display = 'flex';
};

closeWYRBtn.onclick = () => {
  wyrModal.style.display = 'none';
};

wyrOptionA.onclick = () => {
  socket.emit('wyrVote', { code: currentRoomCode, questionIndex: currentQuestionIndex, option: 'a' });
};
wyrOptionB.onclick = () => {
  socket.emit('wyrVote', { code: currentRoomCode, questionIndex: currentQuestionIndex, option: 'b' });
};

socket.on('wyrResults', ({ questionIndex, results }) => {
  // Only show if this is the current question
  if (questionIndex !== currentQuestionIndex) return;

  // Render a simple bar graph
  const total = results.a + results.b;
  const percentA = total ? (results.a / total) * 100 : 0;
  const percentB = total ? (results.b / total) * 100 : 0;

  wyrQuestionDiv.innerHTML = `
    <div style="margin:16px 0;">
      <div>Option A: ${results.a} vote(s)</div>
      <div style="background:#e0e0e0;width:100%;height:24px;border-radius:6px;overflow:hidden;">
        <div style="background:#4caf50;width:${percentA}%;height:100%;"></div>
      </div>
      <div>Option B: ${results.b} vote(s)</div>
      <div style="background:#e0e0e0;width:100%;height:24px;border-radius:6px;overflow:hidden;">
        <div style="background:#2196f3;width:${percentB}%;height:100%;"></div>
      </div>
    </div>
  `;
  wyrOptionA.style.display = 'none';
  wyrOptionB.style.display = 'none';
});