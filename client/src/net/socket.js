import { EVENTS } from './netTypes.js';
import { INPUT_RATE_MS } from '../shared/constants.js';

export function connectSocket({ roomCode, playerName, inputState, handlers }) {
  const socket = io();
  let seq = 0;
  const code = (roomCode || 'DEMO').toUpperCase();
  const name = playerName || `Player${Math.floor(Math.random() * 90 + 10)}`;

  socket.on('connect', () => {
    socket.emit(EVENTS.JOIN_ROOM, { roomCode: code, name });
  });

  socket.on(EVENTS.ROOM_JOINED, (data) => {
    handlers?.onRoomJoined?.(data);
  });

  socket.on(EVENTS.PLAYERS_UPDATE, (data) => {
    handlers?.onPlayersUpdate?.(data);
  });

  socket.on(EVENTS.SHOT, (data) => {
    handlers?.onShot?.(data);
  });

  socket.on(EVENTS.SNAPSHOT, (data) => {
    handlers?.onSnapshot?.(data);
  });

  socket.on(EVENTS.ROOM_FULL, (msg) => {
    handlers?.onError?.(`Room ${msg.roomCode} is full (${msg.max})`);
  });

  socket.on('connect_error', () => {
    handlers?.onError?.('Cannot connect to server.');
  });

  const inputTimer = setInterval(() => {
    if (socket.connected && inputState) {
      socket.emit(EVENTS.INPUT, { seq: ++seq, input: inputState.flags });
    }
  }, INPUT_RATE_MS);

  socket.on('disconnect', () => clearInterval(inputTimer));

  return socket;
}
