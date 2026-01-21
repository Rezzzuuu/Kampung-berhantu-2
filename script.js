// Default Config
const defaultConfig = {
  font_family: 'Cinzel',
  font_size: 16
};

// Game State
let players = [];
let gameData = [];
let currentGameId = null;
let gamePhase = 'setup'; 
let roundNumber = 0;
let gameLog = [];
let selectedEliminationPlayer = null;

// Roles
const ROLES = {
  Pontianak: { name: 'Pontianak', emoji: '🐺', team: 'evil', description: 'Hunt villagers each night' },
  villager: { name: 'Villager', emoji: '👨‍🌾', team: 'good', description: 'Find and eliminate werewolves' },
  Bomoh: { name: 'Bomoh', emoji: '🔮', team: 'good', description: 'See one role per night' },
  Ustaz: { name: 'Ustaz', emoji: '💉', team: 'good', description: 'Save one player each night' },
  Pendekar: { name: 'Pendekar', emoji: '🏹', team: 'good', description: 'Shoot when eliminated' },
  cupid: { name: 'Cupid', emoji: '💕', team: 'good', description: 'Link two lovers' },
  witch: { name: 'Witch', emoji: '🧙', team: 'good', description: 'Heal & kill potion' },
  mayor: { name: 'Mayor', emoji: '👑', team: 'good', description: 'Vote counts double' }
};

let roleCounts = {
  Pontianak: 0, villager: 0, Bomoh: 0, Ustaz: 0, Pendekar: 0, cupid: 0, witch: 0, mayor: 0
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Only init role config if we are on the game page
    if (document.getElementById('role-config')) {
        initializeRoleConfig();
        updateStartButton(); // Ensure button state is correct on load
    }
    
    // Only init history if we are on history page
    if (document.getElementById('history-container')) {
        // In a real app with database, we would fetch data here.
        // For static files without DB, history is lost on refresh unless using localStorage.
        loadHistoryFromStorage();
    }
});

// --- Role Logic ---
function initializeRoleConfig() {
  const container = document.getElementById('role-config');
  if (!container) return;
  
  container.innerHTML = Object.entries(ROLES).map(([key, role]) => `
    <div class="p-3 rounded-lg" style="background: rgba(139, 92, 246, 0.2);">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-2xl">${role.emoji}</span>
        <span class="font-bold text-sm" style="color: #f5f3ff;">${role.name}</span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="adjustRole('${key}', -1)" class="w-8 h-8 rounded-full flex items-center justify-center bg-purple-900 text-white">-</button>
        <span id="role-count-${key}" class="w-8 text-center font-bold" style="color: #f5f3ff;">0</span>
        <button onclick="adjustRole('${key}', 1)" class="w-8 h-8 rounded-full flex items-center justify-center bg-purple-900 text-white">+</button>
      </div>
    </div>
  `).join('');
}

function adjustRole(roleKey, delta) {
  const newCount = Math.max(0, roleCounts[roleKey] + delta);
  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0) - roleCounts[roleKey] + newCount;
  
  if (totalRoles <= players.length) {
    roleCounts[roleKey] = newCount;
    document.getElementById(`role-count-${roleKey}`).textContent = newCount;
    updateStartButton();
  } else {
    showToast('Cannot assign more roles than players!', 'error');
  }
}

// --- Player Management ---
function addPlayer() {
  const input = document.getElementById('player-name');
  const name = input.value.trim();
  
  if (!name) return showToast('Enter name', 'error');
  if (players.length >= 15) return showToast('Max 15 players', 'error');
  if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) return showToast('Name exists', 'error');
  
  players.push({ id: Date.now().toString(), name: name, role: null, isAlive: true, revealed: false });
  input.value = '';
  renderPlayers();
  updateStartButton();
}

function removePlayer(playerId) {
  players = players.filter(p => p.id !== playerId);
  renderPlayers();
  updateStartButton();
}

function clearAllPlayers() {
  players = [];
  renderPlayers();
  updateStartButton();
}

function renderPlayers() {
  const container = document.getElementById('players-container');
  const countEl = document.getElementById('player-count');
  const hintEl = document.getElementById('player-hint');
  
  if(!container) return; // Guard clause

  countEl.textContent = players.length;
  
  if (players.length === 0) {
    container.innerHTML = '';
    hintEl.textContent = 'Add 5-15 players to start';
    hintEl.className = 'text-sm mt-3 text-center text-purple-300';
    return;
  }
  
  if (players.length < 5) {
    hintEl.textContent = `Need ${5 - players.length} more`;
    hintEl.className = 'text-sm mt-3 text-center text-yellow-400';
  } else {
    hintEl.textContent = 'Ready to start!';
    hintEl.className = 'text-sm mt-3 text-center text-green-400';
  }
  
  container.innerHTML = players.map(player => `
    <div class="flex items-center justify-between p-2 rounded-lg animate-fade-in" style="background: rgba(139, 92, 246, 0.3);">
      <span class="font-medium truncate text-white">${player.name}</span>
      <button onclick="removePlayer('${player.id}')" class="ml-2 text-red-400">✕</button>
    </div>
  `).join('');
}

function updateStartButton() {
  const btn = document.getElementById('start-game-btn');
  if(!btn) return;

  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  const hasPontianak = roleCounts.Pontianak > 0;
  const validPlayers = players.length >= 5 && players.length <= 15;
  const rolesMatch = totalRoles === players.length;
  
  btn.disabled = !(validPlayers && rolesMatch && hasPontianak);
}

// --- Game Logic ---
function startGame() {
  // Assign roles
  const rolePool = [];
  Object.entries(roleCounts).forEach(([role, count]) => {
    for (let i = 0; i < count; i++) rolePool.push(role);
  });
  
  // Shuffle
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }
  
  players.forEach((player, index) => {
    player.role = rolePool[index];
    player.isAlive = true;
    player.revealed = false;
  });
  
  currentGameId = Date.now().toString();
  gamePhase = 'night';
  roundNumber = 1;
  gameLog = [];
  
  addToLog('🎮 Game started!');
  
  // UI Switch
  document.getElementById('game-setup').classList.add('hidden');
  document.getElementById('game-board').classList.remove('hidden');
  document.getElementById('role-reveal').classList.remove('hidden');
  
  renderRoleCards();
  renderGamePlayers();
  updatePhaseDisplay();
}

function renderRoleCards() {
  const container = document.getElementById('role-cards-container');
  container.innerHTML = players.map(player => `
    <div id="card-${player.id}" class="card-flip cursor-pointer ${player.revealed ? 'flipped' : ''}" onclick="revealCard('${player.id}')">
      <div class="card-inner relative" style="height: 180px;">
        <div class="card-front absolute inset-0 rounded-xl flex flex-col items-center justify-center p-4" style="background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%); border: 2px solid #a78bfa;">
          <div class="text-4xl mb-2">🎴</div>
          <p class="font-bold text-center text-white">${player.name}</p>
          <p class="text-xs mt-2 text-purple-200">Tap to reveal</p>
        </div>
        <div class="card-back absolute inset-0 rounded-xl flex flex-col items-center justify-center p-4" style="background: ${ROLES[player.role]?.team === 'evil' ? '#7f1d1d' : '#14532d'}; border: 2px solid white;">
          <div class="text-4xl mb-2">${ROLES[player.role]?.emoji}</div>
          <p class="font-bold text-center text-white">${player.name}</p>
          <p class="text-sm font-bold text-white">${ROLES[player.role]?.name}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function revealCard(playerId) {
  const player = players.find(p => p.id === playerId);
  if (player) {
    player.revealed = true;
    const card = document.getElementById(`card-${playerId}`);
    if(card) card.classList.add('flipped');
  }
}

function renderGamePlayers() {
  const container = document.getElementById('game-players-container');
  const aliveCount = document.getElementById('alive-count');
  const deadCount = document.getElementById('dead-count');
  
  if(aliveCount) aliveCount.textContent = players.filter(p => p.isAlive).length;
  if(deadCount) deadCount.textContent = players.filter(p => !p.isAlive).length;
  
  container.innerHTML = players.map(player => `
    <div class="p-3 rounded-xl transition-all ${player.isAlive ? '' : 'opacity-50'}" 
         style="background: ${player.isAlive ? 'rgba(139, 92, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}; border: 1px solid white;">
      <div class="flex items-center gap-2">
        <span class="text-2xl">${player.isAlive ? '😊' : '💀'}</span>
        <div>
          <p class="font-bold text-white">${player.name}</p>
          <p class="text-xs text-gray-300">${player.isAlive ? 'Alive' : 'Eliminated'}</p>
        </div>
      </div>
    </div>
  `).join('');
}

function updatePhaseDisplay() {
  const icon = document.getElementById('phase-icon');
  const title = document.getElementById('phase-title');
  const desc = document.getElementById('phase-description');
  const round = document.getElementById('round-counter');
  
  if (gamePhase === 'night') {
    icon.textContent = '🌙';
    title.textContent = 'Night Phase';
    desc.textContent = 'Werewolves are hunting!';
  } else {
    icon.textContent = '☀️';
    title.textContent = 'Day Phase';
    desc.textContent = 'Discuss and Vote!';
  }
  round.textContent = `Round ${roundNumber}`;
}

function advancePhase() {
  if (gamePhase === 'night') {
    gamePhase = 'day';
    addToLog(`☀️ Day ${roundNumber} begins`);
  } else {
    gamePhase = 'night';
    roundNumber++;
    addToLog(`🌙 Night ${roundNumber} falls`);
  }
  updatePhaseDisplay();
  checkWinCondition();
}

// --- Elimination ---
function eliminatePlayer() {
  const alivePlayers = players.filter(p => p.isAlive);
  if (alivePlayers.length === 0) return showToast('No active players', 'error');
  
  const container = document.getElementById('elimination-options');
  container.innerHTML = alivePlayers.map(player => `
    <label class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-purple-800 border border-purple-500">
      <input type="radio" name="elimination" value="${player.id}" onchange="selectedEliminationPlayer = '${player.id}'; document.getElementById('confirm-elimination-btn').disabled = false;">
      <span class="text-white">${player.name}</span>
    </label>
  `).join('');
  
  selectedEliminationPlayer = null;
  document.getElementById('confirm-elimination-btn').disabled = true;
  document.getElementById('elimination-modal').classList.remove('hidden');
}

function closeEliminationModal() {
  document.getElementById('elimination-modal').classList.add('hidden');
}

function confirmElimination() {
  if (!selectedEliminationPlayer) return;
  
  const player = players.find(p => p.id === selectedEliminationPlayer);
  if (player) {
    player.isAlive = false;
    addToLog(`☠️ ${player.name} was eliminated`);
    renderGamePlayers();
    renderRoleCards(); // Update cards visuals if needed
    closeEliminationModal();
    checkWinCondition();
  }
}

// --- Win Condition ---
function checkWinCondition() {
  const alivePlayers = players.filter(p => p.isAlive);
  const aliveWerewolves = alivePlayers.filter(p => ROLES[p.role]?.team === 'evil').length;
  const aliveVillagers = alivePlayers.filter(p => ROLES[p.role]?.team === 'good').length;
  
  let winner = null;
  let message = '';
  
  if (aliveWerewolves === 0) {
    winner = 'Villagers';
    message = 'All werewolves eliminated!';
  } else if (aliveWerewolves >= aliveVillagers) {
    winner = 'Werewolves';
    message = 'Werewolves have taken over!';
  }
  
  if (winner) {
    gamePhase = 'ended';
    document.getElementById('game-board').classList.add('hidden');
    const winScreen = document.getElementById('winner-announcement');
    winScreen.classList.remove('hidden');
    document.getElementById('winner-title').textContent = `${winner} Win!`;
    document.getElementById('winner-message').textContent = message;
    
    saveHistory(winner); // Simple localstorage save
  }
}

function endGame() {
  // Force end
  const aliveWerewolves = players.filter(p => p.isAlive && ROLES[p.role]?.team === 'evil').length;
  if(aliveWerewolves > 0) {
      document.getElementById('winner-title').textContent = "Werewolves Win!";
      document.getElementById('winner-message').textContent = "Game ended early.";
  } else {
      document.getElementById('winner-title').textContent = "Villagers Win!";
      document.getElementById('winner-message').textContent = "Game ended early.";
  }
  document.getElementById('game-board').classList.add('hidden');
  document.getElementById('winner-announcement').classList.remove('hidden');
}

function resetGame() {
  location.reload(); // Simplest way to reset in static file setup
}

// --- Utilities ---
function addToLog(message) {
  const time = new Date().toLocaleTimeString();
  gameLog.push({ time, message });
  const container = document.getElementById('game-log');
  if (container) {
    container.innerHTML = gameLog.map(e => `
      <div class="flex gap-2"><span class="text-gray-400">[${e.time}]</span> <span class="text-white">${e.message}</span></div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }
}

function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const div = document.createElement('div');
  div.className = `px-4 py-2 rounded shadow text-white mb-2 ${type==='error'?'bg-red-500':'bg-green-500'}`;
  div.innerText = msg;
  container.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function toggleSettings() {
    const p = document.getElementById('settings-panel');
    if(p) p.classList.toggle('hidden');
}

// --- Printing ---
function printGameLog() {
    // Basic implementation for brevity
    window.print();
}

function printGameSummary() {
    window.print();
}

// --- Simple History (LocalStorage) ---
function saveHistory(winner) {
    let history = JSON.parse(localStorage.getItem('mw_history') || '[]');
    history.push({
        date: new Date().toLocaleDateString(),
        winner: winner,
        rounds: roundNumber,
        playerCount: players.length
    });
    localStorage.setItem('mw_history', JSON.stringify(history));
}

function loadHistoryFromStorage() {
    const container = document.getElementById('history-container');
    if(!container) return;
    
    let history = JSON.parse(localStorage.getItem('mw_history') || '[]');
    if(history.length === 0) {
        container.innerHTML = '<p class="text-center py-8 text-purple-300">No games played yet.</p>';
        return;
    }
    
    container.innerHTML = history.reverse().map((game, i) => `
        <div class="p-4 rounded-xl border border-purple-500 mb-2">
            <h4 class="font-bold text-white">Game ${history.length - i}</h4>
            <p class="text-sm text-gray-300">${game.date} - Winner: ${game.winner}</p>
        </div>
    `).join('');
}

function printAllHistory() {
    window.print();
}