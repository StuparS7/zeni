import { connectSocket } from './net/socket.js';
import { createInput } from './game/input.js';
import { startLoop } from './game/loop.js';
import {
  SHOT_TTL,
  RENDER_SCALE,
  WEAPONS,
  DEFAULT_WEAPON_ID,
  WEAPON_PICKUP_RADIUS,
  AMMO_PICKUP_RADIUS,
  VEHICLE_INTERACT_RADIUS,
  PLAYER_MAX_HP
} from './shared/constants.js';
import { EVENTS } from './net/netTypes.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const roomInfo = document.getElementById('roomInfo');
const playersList = document.getElementById('players');
const scoreEl = document.getElementById('score');
const weaponEl = document.getElementById('weapon');
const weaponNameEl = document.getElementById('weaponName');
const ammoEl = document.getElementById('ammo');
const hpValueEl = document.getElementById('hpValue');
const roundEl = document.getElementById('roundInfo');
const promptEl = document.getElementById('prompt');
const startRoundBtn = document.getElementById('startRoundBtn');
const overlay = document.getElementById('overlay');
const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');

const state = {
  players: new Map(),
  zombies: new Map(),
  vehicles: new Map(),
  localId: null,
  roomCode: null,
  obstacles: [],
  weaponSpawns: [],
  ammoPickups: [],
  shots: [],
  renderScale: RENDER_SCALE,
  roundActive: false
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
        if (data.map?.obstacles) {
          state.obstacles = data.map.obstacles;
        }
        if (data.map?.weapons) {
          state.weaponSpawns = data.map.weapons;
        }
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
      onShot: (data) => {
        state.shots.push({
          shooterId: data.shooterId,
          sx: data.sx,
          sy: data.sy,
          ex: data.ex,
          ey: data.ey,
          ttl: SHOT_TTL,
          life: SHOT_TTL
        });
      },
      onError: (msg) => {
        setStatus(msg);
        joinBtn.disabled = false;
      }
    }
  });
});

startRoundBtn.addEventListener('click', () => {
  if (socket) socket.emit(EVENTS.START_ROUND);
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
        targetY: p.y,
        score: p.score || 0,
        weaponId: p.weaponId || DEFAULT_WEAPON_ID,
        ammo: p.ammo || null,
        hp: p.hp ?? PLAYER_MAX_HP,
        alive: p.alive !== false,
        inVehicle: !!p.inVehicle,
        vehicleId: p.vehicleId || null
      });
    }
    const local = state.players.get(p.id);
    local.targetX = p.x;
    local.targetY = p.y;
    local.name = p.name || local.name;
    local.score = p.score || 0;
    local.weaponId = p.weaponId || local.weaponId;
    local.ammo = p.ammo || local.ammo;
    local.hp = p.hp ?? local.hp;
    local.alive = p.alive !== false;
    local.inVehicle = !!p.inVehicle;
    local.vehicleId = p.vehicleId || null;
  });

  // remove players that vanished
  Array.from(state.players.keys()).forEach((id) => {
    if (!seen.has(id)) state.players.delete(id);
  });

  mergeZombies(snapshot.zombies || []);
  mergeVehicles(snapshot.vehicles || []);
  mergeAmmoPickups(snapshot.ammoPickups || []);
  state.roundActive = !!snapshot.roundActive;
  updateScoreUI();
  updateRoundUI(snapshot.round, snapshot.roundTimeLeft);
  updatePromptUI();
}

function mergeZombies(zombies) {
  const seen = new Set();
  zombies.forEach((z) => {
    seen.add(z.id);
    if (!state.zombies.has(z.id)) {
      state.zombies.set(z.id, {
        id: z.id,
        renderX: z.x,
        renderY: z.y,
        targetX: z.x,
        targetY: z.y,
        hp: z.hp
      });
    }
    const local = state.zombies.get(z.id);
    local.targetX = z.x;
    local.targetY = z.y;
    local.hp = z.hp;
  });
  Array.from(state.zombies.keys()).forEach((id) => {
    if (!seen.has(id)) state.zombies.delete(id);
  });
}

function updatePlayersUI(players) {
  if (!players) return;
  playersList.innerHTML = players
    .map((p) => `${p.name || 'Player'} - ${p.score || 0} ${p.id === state.localId ? '(you)' : ''}`)
    .join('<br>');
}

function setStatus(text) {
  status.textContent = text;
}

function updateScoreUI() {
  const local = state.players.get(state.localId);
  const score = local ? local.score || 0 : 0;
  const hp = local ? Math.max(0, local.hp ?? PLAYER_MAX_HP) : PLAYER_MAX_HP;
  scoreEl.textContent = `Score: ${score} | HP: ${hp}`;
  const weaponId = local?.weaponId || DEFAULT_WEAPON_ID;
  const weaponName = WEAPONS[weaponId]?.name || 'Unknown';
  weaponEl.textContent = `Weapon: ${weaponName}`;
  if (weaponNameEl) weaponNameEl.textContent = weaponName.toUpperCase();
  if (hpValueEl) hpValueEl.textContent = `${hp}`;
  if (ammoEl) {
    const ammo =
      local?.ammo?.mag != null
        ? local.ammo
        : local?.ammo?.[weaponId];
    ammoEl.textContent = ammo ? `${ammo.mag} / ${ammo.reserve}` : '-- / --';
  }
}

function updateRoundUI(round, timeLeftMs) {
  if (!roundEl) return;
  if (!state.roundActive || !round || timeLeftMs == null) {
    roundEl.textContent = 'Round: stopped';
    startRoundBtn.classList.remove('hidden');
    return;
  }
  const seconds = Math.ceil(timeLeftMs / 1000);
  roundEl.textContent = `Round ${round} - ${seconds}s`;
  startRoundBtn.classList.add('hidden');
}

function updatePromptUI() {
  if (!promptEl) return;
  const local = state.players.get(state.localId);
  if (!local) {
    promptEl.textContent = '';
    return;
  }
  const options = [];

  const weapon = findNearestWeapon(local);
  if (weapon) {
    const name = WEAPONS[weapon.weaponId]?.name || 'Weapon';
    options.push({ d2: weapon.d2, text: `Press E: Pick up ${name}` });
  }

  const ammo = findNearestAmmo(local);
  if (ammo) {
    options.push({ d2: ammo.d2, text: 'Press E: Pick up ammo' });
  }

  const vehicle = findNearestVehicle(local);
  if (vehicle) {
    const text = local.inVehicle && local.vehicleId === vehicle.id
      ? 'Press Q: Exit vehicle'
      : 'Press Q: Enter vehicle';
    options.push({ d2: vehicle.d2, text });
  }

  if (!options.length) {
    promptEl.textContent = '';
    return;
  }
  options.sort((a, b) => a.d2 - b.d2);
  promptEl.textContent = options[0].text;
}

function mergeVehicles(vehicles) {
  const seen = new Set();
  vehicles.forEach((v) => {
    seen.add(v.id);
    if (!state.vehicles.has(v.id)) {
      state.vehicles.set(v.id, {
        id: v.id,
        renderX: v.x,
        renderY: v.y,
        targetX: v.x,
        targetY: v.y,
        angle: v.angle || 0,
        driverId: v.driverId || null,
        steer: v.steer || 0
      });
    }
    const local = state.vehicles.get(v.id);
    local.targetX = v.x;
    local.targetY = v.y;
    local.angle = v.angle || 0;
    local.driverId = v.driverId || null;
    local.steer = v.steer || 0;
  });
  Array.from(state.vehicles.keys()).forEach((id) => {
    if (!seen.has(id)) state.vehicles.delete(id);
  });
}

function mergeAmmoPickups(pickups) {
  state.ammoPickups = pickups.map((p) => ({ ...p }));
}

function findNearestWeapon(local) {
  if (!state.weaponSpawns?.length) return null;
  let best = null;
  let bestD2 = WEAPON_PICKUP_RADIUS * WEAPON_PICKUP_RADIUS;
  state.weaponSpawns.forEach((w) => {
    const dx = w.x - local.renderX;
    const dy = w.y - local.renderY;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = w;
    }
  });
  if (!best) return null;
  return { ...best, d2: bestD2 };
}

function findNearestAmmo(local) {
  if (!state.ammoPickups?.length) return null;
  let best = null;
  let bestD2 = AMMO_PICKUP_RADIUS * AMMO_PICKUP_RADIUS;
  state.ammoPickups.forEach((a) => {
    if (!a.active) return;
    const dx = a.x - local.renderX;
    const dy = a.y - local.renderY;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = a;
    }
  });
  if (!best) return null;
  return { ...best, d2: bestD2 };
}

function findNearestVehicle(local) {
  if (!state.vehicles?.size) return null;
  let best = null;
  let bestD2 = VEHICLE_INTERACT_RADIUS * VEHICLE_INTERACT_RADIUS;
  state.vehicles.forEach((v) => {
    const dx = v.renderX - local.renderX;
    const dy = v.renderY - local.renderY;
    const d2 = dx * dx + dy * dy;
    if (d2 <= bestD2) {
      bestD2 = d2;
      best = v;
    }
  });
  if (!best) return null;
  return { ...best, d2: bestD2 };
}
