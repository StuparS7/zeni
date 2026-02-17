import { connectSocket } from './net/socket.js';
import { createInput } from './game/input.js';
import { startLoop } from './game/loop.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const roomInfo = document.getElementById('roomInfo');
const playersList = document.getElementById('players');
const overlay = document.getElementById('overlay');
const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');

const state = {
  players: new Map(),
  localId: null,
  roomCode: null
};

const input = createInput(canvas);
let socket = null;

joinBtn.addEventListener('click', () => {
  const code = (roomInput.value || 'DEMO').trim().toUpperCase();
  const name = (nameInput.value || 'Player').trim();
  if (!code) return;
  joinBtn.disabled = true;
  setStatus('Connecting...');

  socket = connectSocket({
    roomCode: code,
    playerName: name,
    inputState: input,
    handlers: {
      onRoomJoined: (data) => {
        state.localId = data.playerId;
        state.roomCode = data.roomCode;
        mergeSnapshot(data);
        setStatus(`In room ${data.roomCode}`);
        roomInfo.textContent = `Room: ${data.roomCode}`;
        updatePlayersUI(data.players);
        overlay.style.display = 'none';
      },
      onPlayersUpdate: (payload) => {
        updatePlayersUI(payload.players);
        // sync names if present
        payload.players?.forEach((p) => {
          const existing = state.players.get(p.id);
          if (existing) existing.name = p.name;
        });
      },
      onSnapshot: (data) => {
        mergeSnapshot(data);
        updatePlayersUI(data.players);
      },
      onError: (msg) => {
        setStatus(msg);
        joinBtn.disabled = false;
      }
    }
  });
});

startLoop(state, input, ctx);

function mergeSnapshot(snapshot) {
  const seen = new Set();
  snapshot.players.forEach((p) => {
    seen.add(p.id);
    if (!state.players.has(p.id)) {
      state.players.set(p.id, {
        id: p.id,
        name: p.name || 'Player',
        renderX: p.x,
        renderY: p.y,
        targetX: p.x,
        targetY: p.y
      });
    }
    const local = state.players.get(p.id);
    local.targetX = p.x;
    local.targetY = p.y;
    local.name = p.name || local.name;
  });

  // remove players that vanished
  Array.from(state.players.keys()).forEach((id) => {
    if (!seen.has(id)) state.players.delete(id);
  });
}

function updatePlayersUI(players) {
  if (!players) return;
  playersList.innerHTML = players
    .map((p) => `${p.name || 'Player'} ${p.id === state.localId ? '(you)' : ''}`)
    .join('<br>');
}

function setStatus(text) {
  status.textContent = text;
}
