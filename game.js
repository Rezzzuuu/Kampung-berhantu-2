// game.js - Kampung Berhantu Logic (Pendekar Pre-Select Fix)
let gameSettings = {
    anonymousMode: false,
    discussionTime: 120
};
// --- Game State ---
let players = [];
let currentGameId = null;
let gamePhase = 'setup'; 
let roundNumber = 0;
let gameLog = [];

// Turn & Timer Logic
let turnIndex = 0;
let turnMode = 'reveal'; 
let discussionInterval = null; 

// Special Data
let lovers = []; 
// nightActions stores actions for the CURRENT night
// Added 'PendekarTarget' to store who the Pendekar aimed at
let nightActions = { targets: {}, protected: [], inspections: [], suspicions: {}, cupid: [], kills: {}, witchKill: null, PendekarTarget: null };

// Witch State
let witchPotions = { heal: true, poison: true };

// Cari baris ini di bahagian atas game.js
let roleCounts = { 
    Pontianak: 0, villager: 0, Bomoh: 0, Ustaz: 0, Pendekar: 0, 
    cupid: 0, witch: 0, mayor: 0, bajang: 0, hantu_raya: 0,
    pelesit: 0 
};
    
// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadSkins(); // <--- ADD THIS LINE HERE
    const hasSavedData = loadGameProgress();
    initializeRoleConfig();
    if (gamePhase === 'setup') {
        const timeInput = document.getElementById('setting-time');
        const anonInput = document.getElementById('setting-anonymous');
        const timeVal = document.getElementById('display-time-val');
        
        if (timeInput && gameSettings) {
            timeInput.value = gameSettings.discussionTime || 120;
            if(timeVal) timeVal.innerText = (gameSettings.discussionTime || 120) + 's';
        }
        if (anonInput && gameSettings) {
            anonInput.checked = gameSettings.anonymousMode || false;
        }
    }
    
    if (loadGameProgress()) {
        if (gamePhase === 'setup') {
            renderPlayers();
            
            // KIRA JUMLAH WATAK YANG DAH DIPILIH
            const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);

            // LOGIK BARU: Hanya lompat ke Step 2 jika pemain cukup DAN watak sudah dipilih
            // Jika watak = 0 (baru lepas reset), ia akan kekal di Step 1
            if(players.length >= 5 && totalRoles > 0) {
                document.getElementById('setup-step-1').classList.add('hidden');
                document.getElementById('setup-step-2').classList.remove('hidden');
                updateStartButton();
            } else {
                // Kekal di Step 1
                document.getElementById('setup-step-1').classList.remove('hidden');
                document.getElementById('setup-step-2').classList.add('hidden');
                updateNextButton();
            }
        } else {
            // Logic game sedang berjalan (Night/Day/Vote)
            document.getElementById('game-setup').classList.add('hidden');
            document.getElementById('game-board').classList.remove('hidden');
            updateBoardUI();
            
            if (turnIndex < players.length && (gamePhase === 'night' || turnMode === 'vote')) {
                startTurnOverlay();
            } else if (gamePhase === 'day' && turnMode !== 'vote') {
                startDiscussionPhase();
            }
        }
    } else {
        updateStartButton();
    }
});

// --- Constants (Images) ---
// --- Constants (Images & Skins) ---

// 1. Define Available Skins (Must match watak.js)
const ROLE_SKINS = {
        villager: [
            { name: "Mythic", img: "images/orang_kampung_mytic.png" },
            { name: "Mythic Color", img: "images/orang_kampung_mytic(color_version).png" }, 
            { name: "Legend", img: "images/orang_kampung_legend.png" }, 
            { name: "Legend Color", img: "images/soldier.png" },
            { name: "Collab", img: "images/pelajar.png" },
            { name: "Collab Terminator", img: "images/terminatorpremium.png" },
            { name: "Collab Terminator(Color)", img: "images/terminatorberdiri.png" }
        ],
        Pontianak: [
            { name: "Asal", img: "images/pontianak1.png" },
            { name: "Common", img: "images/pontianak_biasa.png" }
        ],
        Pendekar: [
            { name: "Asal", img: "images/pendekar.png" },
            { name: "Collector", img: "images/pendekarpremium.png" }
        ],
        pelesit: [
            { name: "Asal", img: "images/pelesitnormal.png" },
            { name: "Collector", img: "images/pelesitbotak.png" }
        ],
        mayor: [
        { name: "Asal", img: "images/ketuabiasa.png" },
        { name: "Collector", img: "images/ketuatua.png" },
        { name: "Legend", img: "images/ketuapremium.png" }
        ],
        bajang: [
        { name: "Asal", img: "images/sakabiasa.png" },
        { name: "Collector", img: "images/sakatua.png" }
        ],
        Bomoh: [
        { name: "Asal", img: "images/bomoh.png" }
        ],
        witch: [
        { name: "Asal", img: "images/nenek2.png" },
        { name: "Epik", img: "images/nenek1.png" }
        ],
        cupid: [
        { name: "Asal", img: "images/makandam.png" },
        { name: "Warna", img: "images/makandam2.png" }
        ],
        
        hantu_raya: [
        { name: "Asal", img: "images/hanturaya.png" },
        { name: "Elit", img: "images/hanturaya2.png"},
        ],
        Ustaz: [
            { name: "Elit", img: "images/ustaz.png"},
            { name: "Elit", img: "images/ustaz1.png"}
        ]
};

// 2. Define Default Images (Changed 'const' to 'let' so they can update)
let ROLE_IMAGES = {
        Pontianak: 'images/pontianak1.png',
        villager: 'images/orang_kampung_mytic.png',
        Bomoh: 'images/bomoh.png',
        Ustaz: 'images/ustaz.png',
        Pendekar: 'images/pendekar.png',
        cupid: 'images/makandam.png',
        witch: 'images/nenek2.png',
        mayor: 'images/ketuabiasa.png',
        hantu_raya: 'images/hanturaya.png',
        pelesit: 'images/pelesitnormal.png',
        bajang: 'images/sakaBiasa.png'
};

// 3. Skin System Logic
const SKIN_KEY = 'kb_equipped_skins_v2';
let equippedSkins = {};

function loadSkins() {
    try {
        const saved = JSON.parse(localStorage.getItem(SKIN_KEY)) || {};
        equippedSkins = saved;
        // Apply saved skins to the game images
        Object.keys(equippedSkins).forEach(key => {
            const idx = equippedSkins[key];
            if (ROLE_SKINS[key] && ROLE_SKINS[key][idx]) {
                ROLE_IMAGES[key] = ROLE_SKINS[key][idx].img;
            }
        });
    } catch(e) { console.log("No skins saved"); }
}

function cycleSkin(roleKey) {
    if (!ROLE_SKINS[roleKey]) return;

    const skins = ROLE_SKINS[roleKey];
    let currentIdx = equippedSkins[roleKey] || 0;
    
    // Move to next skin
    let nextIdx = (currentIdx + 1) % skins.length;
    
    // Save
    equippedSkins[roleKey] = nextIdx;
    localStorage.setItem(SKIN_KEY, JSON.stringify(equippedSkins));
    
    // Apply to game
    ROLE_IMAGES[roleKey] = skins[nextIdx].img;
    
    // Refresh the UI immediately
    const role = ROLES[roleKey]; 
    const isEvil = role.team === 'evil';
    updatePanelUI(isEvil ? 'evil' : 'good', role, ROLE_IMAGES[roleKey], roleKey);
    
    // Update the small icon in the list
    const cardImg = document.querySelector(`#roster-card-${roleKey} .avatar-img`);
    if(cardImg) cardImg.src = ROLE_IMAGES[roleKey];
}

// --- State for Setup UI ---
let activeEvilKey = null;
let activeGoodKey = null;
// --- SISTEM AUTO-SAVE ---
const STORAGE_KEY = 'kb_active_session_v1';

function saveGameProgress() {
    const gameState = {
        players, currentGameId, gamePhase, roundNumber, gameLog, 
        turnIndex, turnMode, lovers, nightActions, witchPotions, roleCounts, gameSettings
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
}

function loadGameProgress() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) return false;
    
    try {
        const state = JSON.parse(savedData);
        // Masukkan semula data ke variable
        players = state.players || [];
        currentGameId = state.currentGameId;
        gamePhase = state.gamePhase || 'setup';
        roundNumber = state.roundNumber || 0;
        gameLog = state.gameLog || [];
        turnIndex = state.turnIndex || 0;
        turnMode = state.turnMode || 'reveal';
        lovers = state.lovers || [];
        nightActions = state.nightActions || {};
        witchPotions = state.witchPotions || { heal: true, poison: true };
        roleCounts = state.roleCounts || roleCounts;
        gameSettings = state.gameSettings || { anonymousMode: false, discussionTime: 120 };
        return true;
    } catch (e) { return false; }
}

function clearGameProgress() {
    localStorage.removeItem(STORAGE_KEY);
}
// --- Role Setup ---
// Dalam game.js

function initializeRoleConfig() {
    const evilContainer = document.getElementById('evil-roster-setup');
    const goodContainer = document.getElementById('good-roster-setup');
    
    if (!evilContainer || !goodContainer) return;

    evilContainer.innerHTML = '';
    goodContainer.innerHTML = '';

    let firstEvil = null;
    let firstGood = null;

    Object.keys(ROLES).forEach(key => {
        const role = ROLES[key];
        const isEvil = role.team === 'evil';
        const customImage = ROLE_IMAGES[key];
        
        if (isEvil && !firstEvil) firstEvil = key;
        if (!isEvil && !firstGood) firstGood = key;

        const card = document.createElement('div');
        const borderClass = isEvil ? 'border-red-900/30 hover:bg-red-900/20 evil-glow' : 'border-emerald-900/30 hover:bg-emerald-900/20 good-glow';
        
        card.id = `roster-card-${key}`;
        card.className = `char-card cursor-pointer flex items-center gap-3 p-2 mb-2 rounded-xl border bg-black/40 transition-all ${borderClass}`;
        
        let miniImg = customImage ? `<img src="${customImage}" class="avatar-img">` : `<div class="text-3xl">${role.emoji}</div>`;
        
        // DAPATKAN JUMLAH TERKINI (FIX QTY 0)
        const currentQty = roleCounts[key] || 0;
        const badgeColor = currentQty > 0 ? 'bg-emerald-600 text-white font-bold' : 'bg-black/50 text-gray-500';

        card.innerHTML = `
            <div class="w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-white/20 shrink-0 bg-black flex items-center justify-center">
                ${miniImg}
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center h-full">
                <h3 class="font-title font-bold text-lg leading-tight ${isEvil ? 'text-red-400' : 'text-emerald-400'}">${role.name}</h3>
                <span id="badge-count-${key}" class="text-xs font-mono px-2 py-0.5 rounded w-fit mt-1 ${badgeColor}">Qty: ${currentQty}</span>
            </div>
            
            <div class="flex flex-col gap-1 mr-1">
                <button onclick="event.stopPropagation(); adjustRole('${key}', 1)" class="w-8 h-8 rounded bg-gray-700 hover:bg-gray-600 text-white font-bold border border-gray-500 flex items-center justify-center transition active:scale-95 text-lg">+</button>
                <button onclick="event.stopPropagation(); adjustRole('${key}', -1)" class="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold border border-gray-600 flex items-center justify-center transition active:scale-95 text-lg">-</button>
            </div>
        `;

        card.onclick = () => selectSetupRole(key);

        if (isEvil) evilContainer.appendChild(card);
        else goodContainer.appendChild(card);
    });

    if (firstEvil) selectSetupRole(firstEvil);
    if (firstGood) selectSetupRole(firstGood);
}

function selectSetupRole(key) {
    const role = ROLES[key];
    const isEvil = role.team === 'evil';
    const imgMsg = ROLE_IMAGES[key];

    
    if (isEvil) {
        activeEvilKey = key;
        updatePanelUI('evil', role, imgMsg, key);
    } else {
        activeGoodKey = key;
        updatePanelUI('good', role, imgMsg, key);
    }

    // Highlight kad dalam senarai
    // Padam highlight lama dalam kategori yang sama
    const containerID = isEvil ? 'evil-roster-setup' : 'good-roster-setup';
    document.getElementById(containerID).querySelectorAll('.char-card').forEach(c => c.classList.remove('bg-white/10', 'border-white/40'));
    
    // Tambah highlight baru
    const activeCard = document.getElementById(`roster-card-${key}`);
    if(activeCard) activeCard.classList.add('bg-white/10', 'border-white/40');
}

// Updated Helper for UI (With Skin Button)
function updatePanelUI(type, role, imgPath, key) {
    document.getElementById(`${type}-panel-empty`).classList.add('hidden');
    const panel = document.getElementById(`${type}-panel`);
    panel.classList.remove('hidden');

    panel.classList.remove('animate-fade-in');
    void panel.offsetWidth; 
    panel.classList.add('animate-fade-in');

    document.getElementById(`${type}-role-name`).innerText = role.name;
    document.getElementById(`${type}-role-desc`).innerText = role.description;
    
    const countDisplay = document.getElementById(`${type}-count-display`);
    if(countDisplay) countDisplay.innerText = roleCounts[key] || 0;

    const visualContainer = document.getElementById(`${type}-visual-container`);
    visualContainer.innerHTML = '';
    
    // Check if skins are available
    const hasSkins = ROLE_SKINS[key] && ROLE_SKINS[key].length > 1;
    
    if (imgPath) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = "relative w-full h-full group cursor-pointer";
        
        const img = document.createElement('img');
        img.src = imgPath;
        img.className = "w-full h-full object-cover skin-enter rounded-lg shadow-lg"; 
        imgWrapper.appendChild(img);
        
        // Add overlay if skins exist
        if (hasSkins) {
             const overlay = document.createElement('div');
             overlay.className = "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg";
             overlay.innerHTML = `<span class="text-white font-bold border border-white px-3 py-1 rounded-full text-xs">🎨 KLIK TUKAR</span>`;
             imgWrapper.appendChild(overlay);
             imgWrapper.onclick = () => cycleSkin(key);
        }
        
        visualContainer.appendChild(imgWrapper);
    } else {
        visualContainer.innerHTML = `<span class="text-6xl animate-float">${role.emoji}</span>`;
    }
    
    // Remove old button if exists
    const existingBtn = document.getElementById(`${type}-skin-btn`);
    if(existingBtn) existingBtn.remove();
    
    // Add button below image if skins exist
    if (hasSkins) {
        const btn = document.createElement('button');
        btn.id = `${type}-skin-btn`;
        btn.className = "mt-2 px-3 py-1 text-[10px] bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 hover:text-white uppercase tracking-wider w-full";
        // Get current skin name safely
        const currentImg = ROLE_IMAGES[key];
        const currentSkinName = ROLE_SKINS[key].find(s => s.img === currentImg)?.name || "Kustom";
        
        btn.innerText = `🎨 TUKAR KULIT (${currentSkinName})`;
        btn.onclick = () => cycleSkin(key);
      
         // Add 'mb-4' to create space below the button
         btn.classList.add("mb-8", "mt-2"); 
      
        visualContainer.parentElement.insertBefore(btn, visualContainer.nextSibling);
    }
}

// Logic Adjust Role
function adjustRole(roleKey, delta) {
  const currentTotalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  const currentQty = roleCounts[roleKey] || 0;
  const newRoleCount = Math.max(0, currentQty + delta);
  const role = ROLES[roleKey];
  const isEvil = role.team === 'evil';
  
  // 1. LIMIT WATAK ISTIMEWA (MAX 1)
  // Hanya 'villager' dan 'Pontianak' boleh lebih daripada 1. Yang lain unik.
  if (delta > 0 && roleKey !== 'villager' && roleKey !== 'Pontianak' && newRoleCount > 1) {
      showToast(`${role.name} adalah watak unik (Maksimum 1)!`, 'error');
      return;
  }

  // 2. LIMIT JUMLAH HANTU (Maksimum 1/3 daripada pemain)
  if (delta > 0 && isEvil) {
      const currentEvilCount = Object.keys(roleCounts).reduce((sum, k) => ROLES[k].team === 'evil' ? sum + roleCounts[k] : sum, 0);
      const maxEvil = Math.floor(players.length / 3);
      
      // Benarkan sekurang-kurangnya 1 hantu walaupun pemain sikit
      const absoluteMax = Math.max(1, maxEvil); 
      
      if (currentEvilCount + 1 > absoluteMax) { 
          showToast(`Maksimum ${absoluteMax} Hantu dibenarkan!`, 'error'); 
          return; 
      }
  }

  // 3. LIMIT JUMLAH KESELURUHAN (Tidak boleh lebih jumlah pemain)
  if (currentTotalRoles - currentQty + newRoleCount <= players.length || players.length === 0) {
    
    // Semakan Tambahan: Adakah kita memenuhi semua slot dengan Orang Baik?
    if (delta > 0 && !isEvil && (currentTotalRoles + 1 === players.length)) {
        // Kira jika ada hantu
        const hasEvil = Object.keys(roleCounts).some(k => ROLES[k].team === 'evil' && roleCounts[k] > 0);
        if (!hasEvil) {
            showToast("Amaran: Anda perlukan sekurang-kurangnya 1 Hantu untuk mula!", "warning");
            // Kita benarkan tambah, tapi toast ini beri peringatan
        }
    }

    // LAKUKAN KEMASKINI
    roleCounts[roleKey] = newRoleCount;
    
    // Update Badge Kecil
    const badge = document.getElementById(`badge-count-${roleKey}`);
    if(badge) {
        badge.innerText = `Qty: ${newRoleCount}`;
        if (newRoleCount > 0) {
            badge.className = "text-xs font-mono px-2 py-0.5 rounded w-fit mt-1 bg-emerald-600 text-white font-bold transition-all";
        } else {
            badge.className = "text-xs font-mono px-2 py-0.5 rounded w-fit mt-1 bg-black/50 text-gray-500 transition-all";
        }
    }

    // Update Display Besar (Jika wujud/aktif)
    if (roleKey === activeEvilKey) {
        const disp = document.getElementById('evil-count-display');
        if(disp) disp.innerText = newRoleCount;
    }
    if (roleKey === activeGoodKey) {
        const disp = document.getElementById('good-count-display');
        if(disp) disp.innerText = newRoleCount;
    }

    updateStartButton();
    saveGameProgress(); // Simpan perubahan
  } else { 
      showToast('Jumlah watak tidak boleh melebihi jumlah pemain!', 'error'); 
  }
}

// --- Player Mgmt ---
// --- Navigation Logic (Step 1 <-> Step 2) ---

function goToRoleSelection() {
    if (players.length < 5) {
        showToast("Minima 5 pemain diperlukan!", "error");
        return;
    }
    
    // Hide Step 1, Show Step 2
    document.getElementById('setup-step-1').classList.add('hidden');
    document.getElementById('setup-step-2').classList.remove('hidden');
    
    // Refresh UI
    document.getElementById('display-player-total').textContent = players.length;
    initializeRoleConfig();
    updateStartButton(); // Validate roles against player count
}

function backToPlayerEntry() {
    // Hide Step 2, Show Step 1
    document.getElementById('setup-step-2').classList.add('hidden');
    document.getElementById('setup-step-1').classList.remove('hidden');
}

// --- Player Mgmt (Updated for Grid Layout) ---
function addPlayer() {
  const input = document.getElementById('player-name');
  const name = input.value.trim();
  
  if (!name) return showToast('Sila masukkan nama pemain.', 'error');
  if (players.length >= 15) return showToast('Maksimum 15 pemain sahaja.', 'error');

  const isDuplicate = players.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (isDuplicate) return showToast('Nama tersebut sudah wujud!', 'error');

  players.push({ id: Date.now().toString(), name: name, role: null, isAlive: true, voteCount: 0 });
  input.value = ''; 
  input.focus();
  
  renderPlayers();
  updateNextButton(); // Check if we can proceed to Step 2
  saveGameProgress();
}

function removePlayer(id) { 
    players = players.filter(p => p.id !== id); 
    renderPlayers(); 
    updateNextButton();
    saveGameProgress();
}

// Gantikan function clearAllPlayers() yang lama dengan ini:
function clearAllPlayers() { 
    if(confirm("Adakah anda pasti mahu memadam semua pemain dan data permainan?")) {
        // 1. Padam simpanan auto-save
        clearGameProgress(); 
        
        // 2. Reload page untuk mula dari kosong
        location.reload(); 
    }
}

function renderPlayers() {
  const container = document.getElementById('players-grid-container');
  const countSpan = document.getElementById('player-count-step1');
  
  if(countSpan) countSpan.textContent = players.length;
  
  if(container) {
      if (players.length === 0) {
          container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10 italic flex flex-col items-center"><span class="text-4xl mb-2 opacity-50">👥</span>Belum ada pemain didaftarkan.</div>`;
          return;
      }

      container.innerHTML = players.map(player => `
        <div class="relative group bg-emerald-900/20 border border-emerald-700/50 hover:border-red-500/50 hover:bg-red-900/20 rounded-xl p-3 flex items-center gap-3 transition-all">
          <div class="w-10 h-10 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-200 font-bold border border-emerald-600 shrink-0">
            ${player.name.charAt(0).toUpperCase()}
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-emerald-100 truncate">${player.name}</h4>
          </div>
          <button onclick="removePlayer('${player.id}')" class="w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 text-gray-400 hover:text-red-400 hover:bg-red-900/40 border border-transparent hover:border-red-500/50 transition" title="Buang Pemain">
            ✕
          </button>
        </div>
      `).join('');
  }
}

// Logic untuk butang "Seterusnya" di Step 1
function updateNextButton() {
    const btn = document.getElementById('btn-goto-roles');
    if (players.length >= 5) {
        btn.disabled = false;
        btn.classList.remove('bg-gray-800', 'text-gray-500', 'border-gray-600', 'cursor-not-allowed');
        btn.classList.add('bg-emerald-800', 'text-white', 'border-emerald-600', 'hover:bg-emerald-700', 'shadow-lg', 'animate-pulse-glow');
    } else {
        btn.disabled = true;
        btn.classList.add('bg-gray-800', 'text-gray-500', 'border-gray-600', 'cursor-not-allowed');
        btn.classList.remove('bg-emerald-800', 'text-white', 'border-emerald-600', 'hover:bg-emerald-700', 'shadow-lg', 'animate-pulse-glow');
    }
}

// Logic untuk butang "Mula Permainan" di Step 2
function updateStartButton() {
  const btn = document.getElementById('start-game-btn');
  const statusSpan = document.getElementById('start-btn-status');
  const displayTotal = document.getElementById('display-role-total');

  // Kira jumlah watak
  const totalRoles = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  if(displayTotal) displayTotal.textContent = totalRoles;
  
  // Semakan Syarat:
  const hasPontianak = roleCounts.Pontianak > 0;
  const rolesBalanced = totalRoles === players.length;
  const isValid = rolesBalanced && hasPontianak;
  
  btn.disabled = !isValid;
  
  statusSpan.innerText = `${totalRoles}/${players.length}`;
  
  if (!hasPontianak) {
      statusSpan.className = "text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-500/50";
      // Optional tooltip/toast logic can go here
  } else if (!rolesBalanced) {
      statusSpan.className = "text-xs bg-yellow-600/50 text-yellow-100 px-2 py-1 rounded border border-yellow-500";
  } else {
      statusSpan.className = "text-xs bg-emerald-500 text-black font-bold px-2 py-1 rounded";
  }

  if(isValid) {
      btn.classList.remove('bg-gray-800', 'text-gray-500', 'border-gray-600', 'cursor-not-allowed');
      btn.classList.add('bg-red-900', 'text-red-100', 'border-red-700', 'hover:bg-red-800', 'hover:scale-105', 'animate-pulse-glow');
  } else {
      btn.classList.add('bg-gray-800', 'text-gray-500', 'border-gray-600', 'cursor-not-allowed');
      btn.classList.remove('bg-red-900', 'text-red-100', 'border-red-700', 'hover:bg-red-800', 'hover:scale-105', 'animate-pulse-glow');
  }
}

// --- Game Logic ---
function startGame() {
    if (players.length < 5) {
      showToast("Perlukan sekurang-kurangnya 5 pemain untuk bermula!", "error");
      return; 
  }
  const timeInput = document.getElementById('setting-time');
    const anonInput = document.getElementById('setting-anonymous');
    
    if (timeInput) gameSettings.discussionTime = parseInt(timeInput.value);
    if (anonInput) gameSettings.anonymousMode = anonInput.checked;
  const rolePool = [];
  Object.entries(roleCounts).forEach(([role, count]) => { for (let i = 0; i < count; i++) rolePool.push(role); });
  for (let i = rolePool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]]; }
  players.forEach((player, index) => { 
    player.role = rolePool[index]; 
    player.isAlive = true; 
    player.voteCount = 0; 
    player.suspectCount = 0; // <--- TAMBAH INI
});
  currentGameId = Date.now().toString();
  gameLog = [];
  lovers = []; 
  witchPotions = { heal: true, poison: true };
  addToLog(`Permainan bermula... Mode: ${gameSettings.anonymousMode ? 'Misteri' : 'Biasa'}`); // Log info
  
  document.getElementById('game-setup').classList.add('hidden');
  document.getElementById('game-board').classList.remove('hidden');
  turnMode = 'reveal';
  turnIndex = 0;
  startTurnOverlay();
  saveGameProgress();
}
// --- FUNGSI GENERATOR KAD BARU (UPDATED FOR MOBILE WATAK STYLE) ---
function generateActionGrid(targets, colorTheme, callbackName, idPrefix = 'card') {
    if (targets.length === 0) return '<div class="text-gray-500 italic text-center col-span-2 text-xs py-4">Tiada sasaran tersedia.</div>';
    
    // Determine color classes based on theme
    let borderClass = 'border-gray-700';
    let ringClass = 'ring-white';
    let bgClass = 'bg-gray-800';
    
    if (colorTheme === 'red') { borderClass = 'border-red-900/50'; ringClass = 'ring-red-500'; bgClass = 'bg-red-950/30'; }
    else if (colorTheme === 'green') { borderClass = 'border-emerald-900/50'; ringClass = 'ring-emerald-500'; bgClass = 'bg-emerald-950/30'; }
    else if (colorTheme === 'blue') { borderClass = 'border-blue-900/50'; ringClass = 'ring-blue-500'; bgClass = 'bg-blue-950/30'; }
    else if (colorTheme === 'purple') { borderClass = 'border-purple-900/50'; ringClass = 'ring-purple-500'; bgClass = 'bg-purple-950/30'; }
    else if (colorTheme === 'yellow') { borderClass = 'border-yellow-900/50'; ringClass = 'ring-yellow-500'; bgClass = 'bg-yellow-950/30'; }
    else if (colorTheme === 'pink') { borderClass = 'border-pink-900/50'; ringClass = 'ring-pink-500'; bgClass = 'bg-pink-950/30'; }

    return `
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-fade-in pb-2">
        ${targets.map(t => {
            const initial = t.name.charAt(0).toUpperCase();
            // Use the compact card design from watak.html
            // Mobile: w-full (in grid), p-1.5 padding, smaller text
            return `
            <div id="${idPrefix}-${t.id}" onclick="${callbackName}('${t.id}', '${colorTheme}')" 
                 class="target-card group cursor-pointer flex flex-col items-center gap-1 p-1.5 rounded-lg border ${borderClass} ${bgClass} hover:bg-black/40 transition-all relative">
                
                <div class="w-9 h-12 md:w-12 md:h-16 rounded overflow-hidden shadow-md border border-white/20 shrink-0 bg-black flex items-center justify-center text-lg md:text-xl font-bold text-gray-300 card-avatar-box transition-transform group-hover:scale-105">
                    ${initial}
                </div>
                
                <h4 class="font-title font-bold text-[10px] md:text-xs text-gray-300 uppercase truncate w-full text-center leading-tight mt-1">${t.name}</h4>
                
                <div class="status-badge absolute top-1 right-1 opacity-0 transition-opacity">
                    <span class="w-2 h-2 rounded-full bg-${colorTheme === 'red' ? 'red-500' : (colorTheme === 'blue' ? 'blue-500' : (colorTheme === 'green' ? 'emerald-500' : (colorTheme === 'purple' ? 'purple-500' : 'white')))} block shadow-lg animate-pulse"></span>
                </div>
            </div>
            `;
        }).join('')}
    </div>
    `;
}

// --- Turn Overlay ---
function startTurnOverlay() { document.getElementById('turn-overlay').classList.remove('hidden'); renderTurnPass(); }

function renderTurnPass() {
    const player = players[turnIndex];
    // Skip dead players for actions AND voting
    if ((turnMode === 'action' || turnMode === 'vote') && !player.isAlive) { completeTurn(); return; }
    
    const container = document.getElementById('turn-content');
    container.innerHTML = `
        <div class="text-6xl mb-6 text-emerald-600 animate-float">📱</div>
        <h2 class="font-title text-2xl text-gray-400 mb-2">Serahkan peranti kepada</h2>
        <h1 class="font-title text-5xl font-bold text-red-500 mb-10 tracking-widest uppercase">${player.name}</h1>
        <p class="text-emerald-900/50 mb-8 text-sm">Jangan intip jika ini bukan nama anda.</p>
        <button onclick="renderTurnActive()" class="px-8 py-4 border border-emerald-500 text-emerald-100 hover:bg-emerald-900 font-bold transition w-full">SAYA IALAH ${player.name}</button>
    `;
}


// --- ACTION LOGIC ---
// --- HELPER UNTUK BUTANG UNIK (SKIP/SIMPAN) ---

// 1. Fungsi untuk Nenek Kebayan (Simpan Ramuan)
window.selectWitchSkip = function(btn) {
    window.tempWitchAction = { type: 'skip' };
    
    // Reset visual semua KAD pemain
    document.querySelectorAll('.target-card').forEach(c => c.className = 'target-card group');
    
    // Reset visual semua butang skip
    document.querySelectorAll('.skip-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-gray-400', 'bg-gray-700', 'text-white', 'animate-pulse-glow');
        b.classList.add('text-gray-400', 'border-gray-600');
    });

    // Highlight butang yang ditekan
    if(btn) {
        btn.classList.remove('text-gray-400', 'border-gray-600');
        btn.classList.add('ring-2', 'ring-gray-400', 'bg-gray-700', 'text-white', 'animate-pulse-glow');
    }
    
    validateTurnCompletion();
}

// 2. Fungsi untuk Pontianak (Tiada Pembunuhan)
window.selectPontianakSkip = function(btn) {
    window.selectActionTarget('SKIP');
    
    // Reset visual semua KAD pemain
    document.querySelectorAll('.target-card').forEach(c => c.classList.remove('selected-red', 'animate-pulse-glow'));
    
    // Highlight butang ini
    if(btn) {
        btn.classList.remove('text-gray-400', 'border-gray-600');
        btn.classList.add('ring-2', 'ring-red-500', 'bg-gray-800', 'text-white', 'animate-pulse-glow');
    }
    
    validateTurnCompletion();
}

// Fungsi Highlight Kad (Versi Akhir & Stabil)
window.selectCardVisual = function(id, colorTheme) {
    // 1. Reset semua kad
    document.querySelectorAll('.target-card').forEach(card => {
        card.className = `target-card group`; 
    });

    // 2. Reset semua butang skip
    document.querySelectorAll('.skip-btn').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-red-500', 'ring-gray-400', 'bg-gray-700', 'text-white', 'animate-pulse-glow');
        btn.classList.add('text-gray-400', 'border-gray-600');
    });

    if (!id) return; // Jika id null (reset sahaja), berhenti di sini

    // 3. Tentukan ID elemen yang betul
    // Inilah bahagian PENTING yang memadankan prefix dari langkah 1 tadi
    let targetDomId = `card-${id}`;
    if (colorTheme === 'green') targetDomId = `heal-card-${id}`;
    if (colorTheme === 'purple') targetDomId = `poison-card-${id}`;

    // 4. Highlight kad tersebut
    const activeCard = document.getElementById(targetDomId);
    if (activeCard) {
        activeCard.classList.add(`selected-${colorTheme}`);
        activeCard.classList.add('animate-pulse-glow');
    }
}

function renderTurnActive() {
    const player = players[turnIndex];
    const container = document.getElementById('turn-content');
    const role = ROLES[player.role];
    const roleImg = ROLE_IMAGES[player.role]; 
    
    // Reset state awal
    window.tempActionTarget = null;
    window.tempCupidTargets = [];
    window.tempWitchAction = null;
    window.tempSuspectChoice = null; 

    // --- TEMPLATE KAD RESPONSIF ---
    const wrapInCard = (contentHTML, footerHTML) => `
        <div class="flex flex-col w-full h-auto max-h-[85dvh] bg-gray-900/95 rounded-xl border border-emerald-500/30 p-3 md:p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden animate-fade-in">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
            
            <div class="shrink-0 flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 ${role.team === 'evil' ? 'border-red-500' : 'border-emerald-500'} overflow-hidden bg-black shadow-lg">
                        <img src="${roleImg}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Giliran</span>
                        <span class="text-base md:text-xl font-bold text-white leading-none truncate max-w-[120px] md:max-w-xs">${player.name}</span>
                    </div>
                </div>
                <div class="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] md:text-xs text-gray-300 font-mono">
                    ${ROLES[player.role].name}
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
                ${contentHTML}
            </div>

            <div class="shrink-0 pt-2 mt-2 border-t border-white/10 grid gap-2">
                ${footerHTML}
            </div>
        </div>
    `;

    const suspectTargets = players.filter(p => p.isAlive); 

    // --- WITCH TAB HELPER (DENGAN RESET) ---
    window.switchWitchTab = function(tab) {
        // 1. Reset Action Nenek Kebayan bila tukar tab
        window.tempWitchAction = null;
        
        // 2. Reset Visual Kad & Butang Skip
        document.querySelectorAll('.target-card').forEach(c => c.className = 'target-card group');
        document.querySelectorAll('.skip-btn').forEach(b => {
            b.classList.remove('ring-2', 'ring-gray-400', 'bg-gray-700', 'text-white', 'animate-pulse-glow');
            b.classList.add('text-gray-400', 'border-gray-600');
        });

        // 3. Update Validasi (Disable butang Sahkan)
        validateTurnCompletion();

        // 4. Tukar Paparan Tab
        document.getElementById('witch-content-heal').classList.add('hidden');
        document.getElementById('witch-content-poison').classList.add('hidden');
        
        // Reset Butang Tab Style
        const btnHeal = document.getElementById('tab-btn-heal');
        const btnPoison = document.getElementById('tab-btn-poison');
        
        btnHeal.className = "witch-tab-btn p-2 rounded bg-gray-800 text-gray-500 border border-transparent hover:bg-gray-700 font-bold text-xs flex items-center justify-center gap-1 w-full";
        btnPoison.className = "witch-tab-btn p-2 rounded bg-gray-800 text-gray-500 border border-transparent hover:bg-gray-700 font-bold text-xs flex items-center justify-center gap-1 w-full";

        if (tab === 'heal') {
            document.getElementById('witch-content-heal').classList.remove('hidden');
            btnHeal.className = "witch-tab-btn active p-2 rounded bg-green-900/30 text-green-400 border border-green-500 font-bold text-xs flex items-center justify-center gap-1 w-full shadow-[0_0_10px_rgba(34,197,94,0.3)]";
        } else {
            document.getElementById('witch-content-poison').classList.remove('hidden');
            btnPoison.className = "witch-tab-btn active p-2 rounded bg-purple-900/30 text-purple-400 border border-purple-500 font-bold text-xs flex items-center justify-center gap-1 w-full shadow-[0_0_10px_rgba(168,85,247,0.3)]";
        }
    };

    // --- RENDER LOGIC ---

    if (turnMode === 'reveal') {
        const content = `
            <div class="text-center py-2">
                <h2 class="font-title text-xl text-white mb-2">Identiti Anda</h2>
                <div class="relative w-32 h-44 mx-auto mb-4 rounded-lg overflow-hidden border-4 ${role.team === 'evil' ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'border-emerald-600 shadow-[0_0_30px_rgba(16,185,129,0.4)]'} bg-black group perspective-1000">
                    <img src="${roleImg}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                </div>
                <div class="bg-black/40 p-3 rounded-lg border border-white/10 text-left">
                    <p class="text-xs text-gray-300 italic mb-2">"${role.description}"</p>
                    <ul class="text-[10px] space-y-1 text-gray-400 list-disc list-inside">
                        ${player.role === 'mayor' ? '<li class="text-yellow-400">Undian bernilai x2</li>' : ''}
                        ${player.role === 'witch' ? '<li class="text-purple-400">Ada 1 Penawar & 1 Racun</li>' : ''}
                        ${player.role === 'Pendekar' ? '<li class="text-orange-400">Tembak musuh jika mati malam ini.</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
        const footer = `<button onclick="completeTurn()" class="px-4 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg w-full transition shadow-lg border border-emerald-600 text-sm">FAHAM & TUTUP</button>`;
        container.innerHTML = wrapInCard(content, footer);
    } 
    else if (turnMode === 'action') {
        const targets = players.filter(p => p.id !== player.id && p.isAlive);
        let content = '';
        let footer = '';

        // --- 1. WITCH (NENEK KEBAYAN) - UI FIXED ---
        if (player.role === 'witch') {
            content += `<div class="text-center mb-4"><h2 class="font-title text-xl text-purple-400">Ramuan Kebayan</h2><p class="text-xs text-gray-400">Satu nyawa untuk diselamat, satu nyawa untuk ditamat.</p></div>`;
            
            // TABS BUTTONS
            content += `
            <div class="flex gap-2 mb-4 p-1 bg-black/40 rounded-lg border border-white/10">
                <button id="tab-btn-heal" onclick="switchWitchTab('heal')" class="witch-tab-btn flex-1 py-2 rounded text-xs font-bold flex flex-col items-center gap-1 ${witchPotions.heal ? 'text-green-400' : 'text-gray-600 grayscale'}">
                    <span class="text-lg">🧪</span><span>PENAWAR</span>
                </button>
                <button id="tab-btn-poison" onclick="switchWitchTab('poison')" class="witch-tab-btn flex-1 py-2 rounded text-xs font-bold flex flex-col items-center gap-1 ${witchPotions.poison ? 'text-purple-400' : 'text-gray-600 grayscale'}">
                    <span class="text-lg">☠️</span><span>RACUN</span>
                </button>
            </div>`;

            // CONTENT: HEAL
            content += `<div id="witch-content-heal" class="animate-fade-in w-full">`;
            if (witchPotions.heal) {
                content += `<p class="text-[10px] text-green-400 text-center mb-2 uppercase font-bold">Pilih Untuk Dilindungi</p>`;
                // PEMBETULAN: Tambah 'heal-card' sebagai parameter ke-4
                content += generateActionGrid(players.filter(p => p.isAlive), 'green', 'selectWitchCard', 'heal-card');
                content += `<button onclick="selectWitchSkip(this)" class="skip-btn w-full mt-4 p-3 bg-gray-800 border border-gray-600 rounded text-gray-400 hover:text-white transition font-bold text-xs flex justify-center items-center gap-2">🚫 SIMPAN PENAWAR</button>`;
            } else {
                content += `<div class="p-6 bg-gray-900/50 border border-dashed border-gray-700 rounded-xl text-gray-500 text-xs italic text-center">Ramuan habis.</div>`;
                content += `<button onclick="window.tempWitchAction={type:'skip'}; validateTurnCompletion();" class="w-full mt-4 p-3 bg-gray-800 border border-gray-600 rounded text-white font-bold text-xs">TERUSKAN</button>`;
            }
            content += `</div>`;

            // CONTENT: POISON
            content += `<div id="witch-content-poison" class="hidden animate-fade-in w-full">`;
            if (witchPotions.poison) {
                content += `<p class="text-[10px] text-purple-400 text-center mb-2 uppercase font-bold">Pilih Untuk Diracun</p>`;
                // PEMBETULAN: Tambah 'poison-card' sebagai parameter ke-4
                content += generateActionGrid(targets, 'purple', 'selectWitchCard', 'poison-card');
                content += `<button onclick="selectWitchSkip(this)" class="skip-btn w-full mt-4 p-3 bg-gray-800 border border-gray-600 rounded text-gray-400 hover:text-white transition font-bold text-xs flex justify-center items-center gap-2">🚫 SIMPAN RACUN</button>`;
            } else {
                content += `<div class="p-6 bg-gray-900/50 border border-dashed border-gray-700 rounded-xl text-gray-500 text-xs italic text-center">Ramuan habis.</div>`;
                content += `<button onclick="window.tempWitchAction={type:'skip'}; validateTurnCompletion();" class="w-full mt-4 p-3 bg-gray-800 border border-gray-600 rounded text-white font-bold text-xs">TERUSKAN</button>`;
            }
            content += `</div>`;

            content += generateSuspectSection(suspectTargets, player.role);

            // LOGIC TAB SWITCHING
            window.switchWitchTab = function(tab) {
                window.tempWitchAction = null; 
                selectCardVisual(null, ''); 
                
                document.getElementById('witch-content-heal').classList.add('hidden');
                document.getElementById('witch-content-poison').classList.add('hidden');
                document.getElementById('tab-btn-heal').classList.remove('active', 'bg-green-900/30', 'border-green-500');
                document.getElementById('tab-btn-poison').classList.remove('active', 'bg-purple-900/30', 'border-purple-500');

                if (tab === 'heal') {
                    document.getElementById('witch-content-heal').classList.remove('hidden');
                    document.getElementById('tab-btn-heal').classList.add('active', 'bg-green-900/30', 'border-green-500');
                } else {
                    document.getElementById('witch-content-poison').classList.remove('hidden');
                    document.getElementById('tab-btn-poison').classList.add('active', 'bg-purple-900/30', 'border-purple-500');
                }
                validateTurnCompletion();
            };

            setTimeout(() => window.switchWitchTab('heal'), 50);

            window.selectWitchCard = function(id, theme) {
                const type = theme === 'green' ? 'heal' : 'poison';
                window.tempWitchAction = { type: type, target: id };
                selectCardVisual(id, theme); // Ini akan memanggil helper yang betul
                validateTurnCompletion();
            };

            footer = `<button id="btn-confirm-witch" onclick="submitWitchAction()" disabled class="w-full py-4 bg-purple-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-purple-500 shadow-lg text-sm tracking-widest">SAHKAN PILIHAN</button>`;
        }

        // --- 2. PONTIANAK (DIBAIKI) ---
        // --- 2. PONTIANAK (Logik: Kenal Kawan & Tak Boleh Bunuh Kawan) ---
// --- 2. PONTIANAK (Logik: Kenal Kawan + LIHAT PILIHAN KAWAN) ---
        else if (player.role === 'Pontianak') {
            
            // A. Cari Rakan Sepasukan
            const teammates = players.filter(p => p.role === 'Pontianak' && p.id !== player.id);
            
            // B. [BARU] Semak siapa yang Rakan dah vote malam ni
            // Kita tengok dalam nightActions.kills yang sedang terkumpul
            let currentTargetInfo = "";
            const existingVotes = nightActions.kills || {};
            const votedIds = Object.keys(existingVotes);

            if (votedIds.length > 0) {
                // Ada undian telah dibuat!
                const voteList = votedIds.map(id => {
                    const victim = players.find(p => p.id === id);
                    const count = existingVotes[id];
                    return victim ? `<li class="text-white font-bold">• ${victim.name} <span class="text-xs font-normal text-gray-400">(${count} undi)</span></li>` : '';
                }).join('');

                currentTargetInfo = `
                    <div class="mt-2 pt-2 border-t border-red-800/50">
                        <p class="text-[9px] text-red-300 uppercase mb-1">Sedang Disasarkan:</p>
                        <ul class="text-xs bg-black/40 p-2 rounded border border-red-500/30">
                            ${voteList}
                        </ul>
                        <p class="text-[9px] text-gray-500 italic mt-1">Ikut serta untuk pastikan kematian.</p>
                    </div>
                `;
            } else {
                currentTargetInfo = `
                    <div class="mt-2 pt-2 border-t border-red-800/50">
                        <p class="text-[9px] text-gray-400 italic">Belum ada serangan dibuat malam ini.</p>
                    </div>
                `;
            }

            // C. Bina Kotak Info Rakan (Gabung Info Kawan + Info Target)
            let teammateInfoHTML = '';
            
            if (teammates.length > 0) {
                const livingMates = teammates.filter(p => p.isAlive).map(p => p.name).join(', ');
                const deadMates = teammates.filter(p => !p.isAlive).map(p => p.name).join(', ');

                teammateInfoHTML = `
                    <div class="mb-4 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-center shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] animate-fade-in">
                        <h3 class="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1 flex justify-center items-center gap-2">
                            😈 Rakan Pontianak
                        </h3>
                        ${livingMates ? `<div class="text-sm font-bold text-white drop-shadow-md">✨ ${livingMates}</div>` : ''}
                        ${deadMates ? `<div class="text-[10px] text-red-800 mt-1 line-through decoration-red-600">${deadMates}</div>` : ''}
                        
                        ${currentTargetInfo}
                    </div>
                `;
            } else {
                // Solo Pontianak
                teammateInfoHTML = `
                    <div class="mb-4 p-2 bg-black/20 border border-white/5 rounded text-center">
                        <p class="text-[10px] text-gray-500 italic">Anda bergerak sendirian.</p>
                    </div>
                `;
            }

            // D. Tapis Sasaran (Jangan bunuh member)
            const sasaranPontianak = targets.filter(p => p.role !== 'Pontianak');

            // E. Paparan UI
            content += `
                ${teammateInfoHTML} 

                <h2 class="font-title text-lg text-red-500 mb-1">Masa Untuk Makan</h2>
                <p class="text-[10px] text-gray-400 mb-3">Pilih mangsa untuk diserang.</p>
                
                ${generateActionGrid(sasaranPontianak, 'red', 'wrapperSelectAction')}
                
                <button onclick="selectPontianakSkip(this)" class="skip-btn w-full mt-3 p-2 bg-gray-800 border border-gray-600 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition font-bold text-xs flex justify-center items-center gap-2">
                    🚫 <span>TIADA PEMBUNUHAN</span>
                </button>
                
                ${generateSuspectSection(suspectTargets, player.role)}
            `;
            
            footer = `<button id="btn-confirm-action" onclick="submitStandardAction()" disabled class="w-full py-3 bg-red-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-red-500 shadow-lg tracking-widest text-sm">🩸 BUNUH</button>`;
        }
        // --- 3. CUPID ---
        else if (player.role === 'cupid') {
            if (roundNumber === 1) {
                window.wrapperSelectCupid = function(id, theme) {
                    toggleCupidTarget(id);
                    const card = document.getElementById(`card-${id}`);
                    const badge = card.querySelector('.status-badge');
                    
                    if(window.tempCupidTargets.includes(id)) {
                        card.classList.add('selected-pink', 'ring-2', 'ring-pink-500');
                        badge.classList.remove('opacity-0');
                        badge.innerHTML = window.tempCupidTargets.indexOf(id) + 1; 
                        badge.className = "status-badge absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-pink-500 text-white font-bold shadow-lg transform scale-110 transition-all";
                    } else {
                        card.classList.remove('selected-pink', 'ring-2', 'ring-pink-500');
                        badge.classList.add('opacity-0');
                        badge.innerHTML = "";
                    }
                };

                content += `
                    <h2 class="font-title text-lg text-pink-400 mb-1">Ikatan Kasih</h2>
                    <p class="text-[10px] text-gray-400 mb-3">Pilih <strong>DUA</strong> orang pemain.</p>
                    ${generateActionGrid(players.filter(p => p.isAlive), 'pink', 'wrapperSelectCupid')}
                    ${generateSuspectSection(suspectTargets, player.role)}
                `;
                footer = `<button id="btn-confirm-cupid" onclick="submitCupidAction()" disabled class="w-full py-3 bg-pink-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-pink-500 shadow-lg text-sm">💘 JODOHKAN</button>`;
            } else {
                content += `<h2 class="text-lg text-gray-400 mb-2">Tugas selesai.</h2><p class="text-xs text-gray-500">Rehatlah.</p>${generateSuspectSection(suspectTargets, player.role)}`;
                footer = `<button id="btn-villager-sleep" onclick="submitStandardAction()" disabled class="w-full py-3 bg-gray-700 text-white font-bold rounded-lg opacity-50 cursor-not-allowed text-sm">TIDUR</button>`;
            }
        }

        // --- 4. BOMOH ---
        else if (player.role === 'Bomoh') {
            content += `<h2 class="font-title text-lg text-yellow-400 mb-1">Tilikan Batin</h2><p class="text-[10px] text-gray-400 mb-3">Lihat identiti sebenar.</p>${generateActionGrid(targets, 'yellow', 'wrapperSelectAction')}${generateSuspectSection(suspectTargets, player.role)}`;
            footer = `<button id="btn-confirm-action" onclick="performBomohScan()" disabled class="w-full py-3 bg-yellow-700 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-yellow-500 shadow-lg text-sm">🔮 IMBAS</button>`;
        }
        // --- 5. PENDEKAR ---
        else if (player.role === 'Pendekar') {
            content += `<h2 class="font-title text-lg text-orange-500 mb-1">Naluri Pendekar</h2><p class="text-[10px] text-gray-400 mb-3">Pilih musuh (jika anda mati).</p>${generateActionGrid(targets, 'orange', 'wrapperSelectAction')}${generateSuspectSection(suspectTargets, player.role)}`;
            footer = `<button id="btn-confirm-action" onclick="submitStandardAction()" disabled class="w-full py-3 bg-orange-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-orange-600 shadow-lg text-sm">🗡️ KUNCI SASARAN</button>`;
        }
        // --- 6. HANTU RAYA ---
        else if (player.role === 'hantu_raya') {
            const pontianakHidup = players.filter(p => p.role === 'Pontianak' && p.isAlive).length;
            if (pontianakHidup > 0) {
                content += `<h2 class="font-title text-lg text-white mb-2">Tuan Masih Hidup</h2><p class="text-xs text-gray-400 mb-4">Lindungi Pontianak.</p><div class="p-3 bg-red-900/20 border border-red-900 rounded-lg text-center mb-4"><p class="text-[10px] text-gray-400 mb-1">Pontianak Aktif:</p><p class="text-base font-bold text-red-500 animate-pulse">${players.filter(p => p.role === 'Pontianak' && p.isAlive).map(p => p.name).join(', ')}</p></div>${generateSuspectSection(suspectTargets, player.role)}`;
                footer = `<button id="btn-villager-sleep" onclick="submitStandardAction()" disabled class="w-full py-3 bg-gray-700 text-white font-bold rounded-lg opacity-50 cursor-not-allowed text-sm">TIDUR</button>`;
            } else {
                // 1. Header & Grid
                content += `<h2 class="font-title text-lg text-red-600 mb-1">AMUKAN HANTU RAYA</h2><p class="text-[10px] text-gray-400 mb-3">Tuan mati. Giliran anda membaham.</p>${generateActionGrid(targets, 'red', 'wrapperSelectAction')}`;
                
                // 2. [NEW] BUTTON: JANGAN BUNUH (SKIP)
                content += `
                <div class="mt-3 mb-3 px-1">
                    <button onclick="selectPontianakSkip(this)" class="skip-btn w-full py-2 border border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition uppercase text-xs font-bold flex items-center justify-center gap-2">
                        <span>🚫</span> TIADA PEMBUNUHAN
                    </button>
                </div>`;

                // 3. Suspect Section & Footer
                content += `${generateSuspectSection(suspectTargets, player.role)}`;
                footer = `<button id="btn-confirm-action" onclick="submitStandardAction()" disabled class="w-full py-3 bg-red-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-red-700 shadow-lg text-sm">👹 BUNUH</button>`;
            }
        }
        // --- 7. PELESIT ---
        else if (player.role === 'pelesit') {
            content += `<h2 class="font-title text-lg text-green-400 mb-1">Bisikan Pelesit</h2><p class="text-[10px] text-gray-400 mb-3">Intip status kuasa.</p>${generateActionGrid(targets, 'green', 'wrapperSelectPelesit')}${generateSuspectSection(suspectTargets, player.role)}`;
            footer = `<button id="btn-pelesit-scan" onclick="performPelesitScan()" disabled class="w-full py-3 bg-green-800 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-green-600 shadow-lg text-sm">🦗 INTIP</button>`;
        }
        // --- 8. USTAZ ---
        else if (player.role === 'Ustaz') {
            const healTargets = players.filter(p => p.isAlive);
            content += `<h2 class="font-title text-lg text-blue-400 mb-1">Lindungi Mangsa</h2><p class="text-[10px] text-gray-400 mb-3">Pagar pemain daripada gangguan.</p>${generateActionGrid(healTargets, 'blue', 'wrapperSelectAction')}${generateSuspectSection(suspectTargets, player.role)}`;
            footer = `<button id="btn-confirm-action" onclick="submitStandardAction()" disabled class="w-full py-3 bg-blue-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-blue-500 shadow-lg text-sm">📿 LINDUNGI</button>`;
        }
        // --- 9. OTHERS ---
        else {
            content += `<h2 class="font-title text-lg text-white mb-2">Waktu Tidur</h2><p class="text-xs text-gray-400 mb-4 italic">Tiada kuasa aktif. Sila buat pemerhatian.</p>${generateSuspectSection(suspectTargets, player.role)}`;
            footer = `<button id="btn-villager-sleep" onclick="submitStandardAction()" disabled class="w-full py-3 bg-emerald-900 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-emerald-600 shadow-lg text-sm">TIDUR & SELESAI</button>`;
        }

        container.innerHTML = wrapInCard(content, footer);
    }
    
    // --- VOTE MODE ---
    else if (turnMode === 'vote') {
        // Tambah syarat && p.role !== 'Pontianak'
        const targets = players.filter(p => p.isAlive && p.id !== player.id);
        const voteWeightText = player.role === 'mayor' ? "2 Undi" : "1 Undi";
        
        const voteContent = `
            <div class="mb-4 bg-black/40 p-3 rounded-lg border border-orange-900/30">
                <h4 class="text-center text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 border-b border-orange-900/50 pb-1">📊 Laporan Perisikan</h4>
                ${getSuspectLeaderboardHTML()}
            </div>

            <div class="relative transform rotate-1 filter drop-shadow-md contrast-[1.1] text-black">
                <div class="p-4 relative overflow-hidden" style="background-color: #f4e4bc; background-image: radial-gradient(circle at center, #f9f1db 10%, #e8d5a7 90%); border: 1px solid #8c7b5a; box-shadow: inset 0 0 20px rgba(92, 51, 23, 0.2);">
                    
                    <div class="border-b-2 border-black/70 pb-2 mb-2 text-center pt-2 relative z-10">
                        <h2 class="font-serif font-bold text-xl uppercase tracking-widest text-black leading-none mb-1">Borang Undian</h2>
                        <p class="text-[10px] font-mono uppercase tracking-widest text-gray-700">Mesyuarat Kampung</p>
                    </div>

                    <div class="py-2 relative z-10">
                        <div class="font-mono text-[10px] space-y-1 border-2 border-black/50 p-2 bg-white/40 shadow-sm">
                            <div class="flex justify-between border-b border-black/30 pb-1 border-dashed">
                                <span class="font-bold text-gray-700">PENGUNDI:</span>
                                <span class="font-bold uppercase truncate max-w-[100px] text-right text-black">${player.name}</span>
                            </div>
                            <div class="flex justify-between border-b border-black/30 pb-1 border-dashed">
                                <span class="font-bold text-gray-700">KUASA:</span>
                                <span class="text-right text-black">${voteWeightText}</span>
                            </div>
                        </div>
                    </div>

                    <p class="text-[9px] italic text-red-800 mb-1 mt-2 font-bold relative z-10">*Tandakan (X) pada satu petak.</p>

                    <div class="relative z-10 space-y-1">
                        <button onclick="window.selectActionTarget('ABSTAIN'); window.highlightFormRow(this)" class="w-full p-2 text-left border-b border-black/20 hover:bg-black/10 transition flex gap-3 items-center group form-row bg-transparent">
                            <div class="w-5 h-5 border-2 border-black flex items-center justify-center bg-[#f4e4bc] shadow-sm checkbox-box shrink-0"></div>
                            <span class="font-serif font-bold text-gray-700 italic text-xs">BERKECUALI</span>
                        </button>
                        
                        ${targets.map(t => `
                            <button onclick="window.selectActionTarget('${t.id}'); window.highlightFormRow(this)" class="w-full p-2 text-left border-b border-black/20 hover:bg-black/10 transition flex gap-3 items-center group form-row bg-transparent">
                                <div class="w-5 h-5 border-2 border-black flex items-center justify-center bg-[#f4e4bc] shadow-sm checkbox-box shrink-0"></div>
                                <span class="font-serif font-bold text-black uppercase text-xs truncate">${t.name}</span>
                            </button>
                        `).join('')}
                    </div>

                    <div class="absolute top-2 right-2 opacity-20 pointer-events-none transform -rotate-12 border-2 border-red-900 rounded-full w-16 h-16 flex items-center justify-center z-0">
                        <span class="font-bold text-red-900 text-[8px] text-center leading-tight">DOKUMEN<br>SULIT</span>
                    </div>
                </div>
            </div>
        `;
        
        const voteFooter = `<button id="btn-confirm-action" onclick="submitStandardAction()" disabled class="w-full py-3 bg-yellow-700 text-white font-bold rounded-lg opacity-50 cursor-not-allowed border border-yellow-500 shadow-lg text-sm uppercase tracking-widest" style="font-family: 'Courier New', monospace;">[ COP PENGESAHAN ]</button>`;
        
        container.innerHTML = wrapInCard(voteContent, voteFooter);
    }
}

// --- UI Helpers ---
function generateStandardActionUI(role, targets, label, color, confirmText) {
    return `
        <div class="mb-2 text-xl">${role.emoji} <span class="font-bold">${role.name}</span></div>
        <h2 class="font-title text-2xl text-white mb-6">Tindakan Malam</h2>
        <div class="max-h-80 overflow-y-auto mb-4 custom-scrollbar">
            ${generateTargetList(targets, label, color, (id) => selectActionTarget(id))}
        </div>
        <button id="btn-confirm-action" onclick="submitStandardAction()" disabled class="px-8 py-3 bg-gray-700 text-white font-bold w-full opacity-50 cursor-not-allowed border border-gray-500">${confirmText}</button>
    `;
}

function generateTargetList(targets, label, cls, cb) {
    if(targets.length === 0) return '<p>Tiada sasaran.</p>';
    window.tempActionCallback = cb;
    return targets.map(t => `<button onclick="window.tempActionCallback('${t.id}'); highlightBtn(this)" class="w-full mb-2 p-3 text-left border border-gray-700 hover:border-white transition flex justify-between items-center group target-btn"><span>${t.name}</span><span class="text-xs px-2 py-1 rounded ${cls} opacity-0 group-hover:opacity-100 transition">${label}</span></button>`).join('');
}

function generateWitchList(type, targets, label, cls) {
    return targets.map(t => `<button onclick="window.selectWitchTarget('${type}', '${t.id}'); highlightBtn(this)" class="w-full mb-2 p-3 text-left border border-gray-700 hover:border-white transition flex justify-between items-center group target-btn"><span>${t.name}</span><span class="text-xs px-2 py-1 rounded ${cls} opacity-0 group-hover:opacity-100 transition">${label}</span></button>`).join('');
}

function generateMultiSelectList(targets, cb) {
    window.tempCupidCallback = cb;
    return targets.map(t => `<button id="cupid-btn-${t.id}" onclick="window.tempCupidCallback('${t.id}')" class="w-full mb-2 p-3 text-left border border-gray-700 hover:border-pink-500 transition flex justify-between items-center group cupid-target-btn"><span>${t.name}</span><span class="text-xs px-2 py-1 rounded bg-pink-900 opacity-0 group-hover:opacity-100 transition">PILIH</span></button>`).join('');
}

window.highlightBtn = function(btn) { 
    document.querySelectorAll('.target-btn').forEach(b => b.classList.remove('bg-gray-800', 'border-white', 'scale-105')); 
    if(btn) btn.classList.add('bg-gray-800', 'border-white', 'scale-105'); 
}

window.selectActionTarget = function(id) {
    window.tempActionTarget = id;
    const btn = document.getElementById('btn-confirm-action');
    if(btn) { btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); btn.classList.add('animate-pulse-glow'); }
    validateTurnCompletion();
}

// --- FUNGSI GENERATOR KAD BARU ---

// Fungsi ini menggantikan 'generateTargetList' yang lama
function generateActionGrid(targets, colorTheme, callbackName, idPrefix = 'card') {
    if (targets.length === 0) return '<div class="text-gray-500 italic text-center col-span-2 text-xs py-4">Tiada sasaran tersedia.</div>';
    
    return `
    <div class="action-grid animate-fade-in">
        ${targets.map(t => {
            const initial = t.name.charAt(0).toUpperCase();
            // ID UNIK: Guna idPrefix (contoh: 'poison-card-123')
            return `
            <div id="${idPrefix}-${t.id}" onclick="${callbackName}('${t.id}', '${colorTheme}')" class="target-card group">
                <div class="card-avatar-box">
                    <span class="group-hover:scale-110 transition-transform">${initial}</span>
                </div>
                <h4 class="truncate w-full">${t.name}</h4>
                
                <div class="status-badge absolute top-2 right-2 opacity-0 transition-opacity">
                    <span class="w-3 h-3 rounded-full bg-${colorTheme === 'red' ? 'red-500' : (colorTheme === 'blue' ? 'blue-500' : 'white')} block shadow-lg"></span>
                </div>
            </div>
            `;
        }).join('')}
    </div>
    `;
}


// --- HELPER UNTUK BUTANG UNIK (SKIP/SIMPAN) ---

// 1. Fungsi untuk Nenek Kebayan (Simpan Ramuan)
window.selectWitchSkip = function(btn) {
    window.tempWitchAction = { type: 'skip' };
    
    // Reset visual semua KAD pemain
    document.querySelectorAll('.target-card').forEach(c => c.className = 'target-card group');
    
    // Reset visual butang skip yang lain (jika ada)
    document.querySelectorAll('.skip-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-gray-400', 'bg-gray-700', 'text-white', 'animate-pulse-glow');
        b.classList.add('text-gray-400');
    });

    // Highlight butang yang ditekan
    if(btn) {
        btn.classList.remove('text-gray-400');
        btn.classList.add('ring-2', 'ring-gray-400', 'bg-gray-700', 'text-white', 'animate-pulse-glow');
    }
    
    validateTurnCompletion();
}

// 2. Fungsi untuk Pontianak (Tiada Pembunuhan)
window.selectPontianakSkip = function(btn) {
    window.selectActionTarget('SKIP');
    
    // Reset visual semua KAD pemain
    document.querySelectorAll('.target-card').forEach(c => c.classList.remove('selected-red', 'animate-pulse-glow'));
    
    // Highlight butang ini
    if(btn) {
        btn.classList.remove('text-gray-400', 'border-gray-600');
        btn.classList.add('ring-2', 'ring-red-500', 'bg-gray-800', 'text-white', 'animate-pulse-glow');
    }
    
    validateTurnCompletion();
}


// --- WRAPPER FUNCTIONS (Untuk Card Grid) ---

window.wrapperSelectAction = function(id, theme) {
    window.selectCardVisual(id, theme);
    window.selectActionTarget(id);
}

window.wrapperSelectPelesit = function(id, theme) {
    window.selectCardVisual(id, theme);
    window.selectPelesitTarget(id);
}

// --- PELESIT LOGIC ---

// 1. Pilih Sasaran
window.selectPelesitTarget = function(id) {
    window.tempActionTarget = id;
    highlightBtn(event.currentTarget);
    
    // Enable butang
    const btn = document.getElementById('btn-pelesit-scan');
    if(btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('animate-pulse-glow');
    }
    validateTurnCompletion();
}

// 2. Lakukan Imbasan (Check Power)
window.performPelesitScan = function() {
    const targetId = window.tempActionTarget;
    if (!targetId) return;

    const target = players.find(p => p.id === targetId);
    
    // Tentukan Status Kuasa
    let hasPower = false;
    
    // Senarai watak yang dikira "TIADA KUASA" (Rakyat Biasa)
    // Orang Kampung (Villager) dan Bajang dikira tiada kuasa aktif
    if (target.role === 'villager' || target.role === 'bajang') {
        hasPower = false;
    } else {
        // Semua watak lain (Bomoh, Ustaz, Pendekar, Pontianak, dll) dikira "ADA KUASA"
        hasPower = true;
    }

    const container = document.getElementById('turn-content');
    
    container.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="font-title text-2xl text-green-500 mb-6 tracking-widest uppercase">Hasil Intipan</h2>
            
            <div class="p-8 border-4 mb-8 bg-black relative overflow-hidden ${hasPower ? 'border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'border-gray-600'}">
                <p class="text-sm text-gray-400 uppercase mb-2">Status Sasaran</p>
                <h1 class="text-4xl font-bold text-white mb-6">${target.name}</h1>
                
                <div class="text-6xl mb-6 animate-bounce">
                    ${hasPower ? '⚡' : 'zzz'}
                </div>
                
                <h3 class="font-title text-3xl font-bold uppercase mb-2 ${hasPower ? 'text-red-400' : 'text-gray-400'}">
                    ${hasPower ? 'BERKUASA' : 'TIADA KUASA'}
                </h3>
                
                <p class="text-sm italic mt-4 text-gray-300">
                    ${hasPower ? '"Hati-hati... Dia bukan orang biasa."' : '"Hanya rakyat marhaen yang lemah."'}
                </p>
            </div>

            <button onclick="completeTurn()" class="px-8 py-4 bg-gray-800 border border-gray-600 text-white font-bold w-full hover:bg-gray-700 transition">
                Selesai & Hilangkan Diri
            </button>
        </div>
    `;
}

// --- MAK ANDAM LOGIC ---
// --- MAK ANDAM LOGIC (FIXED) ---
window.toggleCupidTarget = function(id) {
    const index = window.tempCupidTargets.indexOf(id);
    
    // 1. Logic Data (Array)
    if (index > -1) { 
        // Jika dah ada, buang (unselect)
        window.tempCupidTargets.splice(index, 1); 
    } else { 
        // Jika belum ada, tambah (tapi limit 2 orang)
        if (window.tempCupidTargets.length < 2) { 
            window.tempCupidTargets.push(id); 
        } 
    }

    // 2. Logic Validasi Butang Sahkan
    const confirmBtn = document.getElementById('btn-confirm-cupid');
    if (confirmBtn) {
        if (window.tempCupidTargets.length === 2) { 
            confirmBtn.disabled = false; 
            confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed'); 
            confirmBtn.classList.add('animate-pulse-glow');
        } else { 
            confirmBtn.disabled = true; 
            confirmBtn.classList.add('opacity-50', 'cursor-not-allowed'); 
            confirmBtn.classList.remove('animate-pulse-glow');
        }
    }
    
    // 3. Semak validasi global (termasuk Syak)
    validateTurnCompletion();
}
window.submitCupidAction = function() {
    if (window.tempCupidTargets.length === 2) { nightActions.cupid = window.tempCupidTargets; lovers = [...window.tempCupidTargets]; }
    completeTurn();
}

// --- NENEK KEBAYAN (WITCH) LOGIC ---
window.selectWitchTarget = function(type, id) {
    window.tempWitchAction = { type: type, target: id };
    const btn = event.currentTarget; 
    highlightBtn(btn);
    const confirmBtn = document.getElementById('btn-confirm-witch');
    if(confirmBtn) { confirmBtn.disabled = false; confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
    validateTurnCompletion();
}

window.submitWitchAction = function() {
    const action = window.tempWitchAction;
    if (action) {
        if (action.type === 'heal') {
            if (!nightActions.protected.includes(action.target)) nightActions.protected.push(action.target);
            witchPotions.heal = false; 
        } else if (action.type === 'poison') {
            nightActions.witchKill = action.target;
            witchPotions.poison = false; 
        }
    }
    completeTurn();
}

// --- STANDARD ACTIONS (Dikemaskini dengan Commit Syak) ---
window.submitStandardAction = function() {
    const targetId = window.tempActionTarget;
    // Untuk Villager, targetId mungkin null, tapi jika validateTurnCompletion dah lepaskan, maknanya syak dah ada.
    // Tapi untuk 'Standard Action', biasanya ada targetId KECUALI Villager Sleep.
    
    // Check mode
    if (turnMode === 'vote') {
        const player = players[turnIndex];
        if (targetId && targetId !== 'ABSTAIN') {
            const target = players.find(p => p.id === targetId);
            let voteWeight = 1;
            if (player.role === 'mayor') voteWeight = 2; 
            if (target) target.voteCount += voteWeight;
        }
        completeTurn(); // Voting tak perlu commit syak
        return;
    } 

    // ACTION MODE
    const player = players[turnIndex];
    
    // COMMIT SYAK (PENTING)
    commitSuspectChoice();

    // Jalankan Tindakan Utama
    // 1. Pontianak / Hantu Raya Killer
    if (player.role === 'Pontianak' || (player.role === 'hantu_raya' && targetId)) {
        if (targetId && targetId !== 'SKIP') {
            let canKill = true;
            if (player.role === 'hantu_raya') {
                const pontianakHidup = players.filter(p => p.role === 'Pontianak' && p.isAlive).length;
                if (pontianakHidup > 0) canKill = false; 
            }
            if (canKill) {
                if (!nightActions.kills[targetId]) nightActions.kills[targetId] = 0;
                nightActions.kills[targetId]++;
            }
        }
    }
    // 2. Ustaz
    else if (player.role === 'Ustaz' && targetId) {
        if (!nightActions.protected.includes(targetId)) nightActions.protected.push(targetId);
    }
    // 3. Pendekar
    else if (player.role === 'Pendekar' && targetId) {
        nightActions.PendekarTarget = targetId; 
    }
    
    // 4. Villager / Others (Just sleep) -> Syak dah commit di atas.
    
    completeTurn();
}

// Update Witch
window.submitWitchAction = function() {
    if (window.tempSuspectChoice === null) return; // Safety
    
    commitSuspectChoice(); // Commit Syak

    const action = window.tempWitchAction;
    if (action && action.type !== 'skip') {
        if (action.type === 'heal') {
            if (!nightActions.protected.includes(action.target)) nightActions.protected.push(action.target);
            witchPotions.heal = false; 
        } else if (action.type === 'poison') {
            nightActions.witchKill = action.target;
            witchPotions.poison = false; 
        }
    }
    completeTurn();
}

// Update Cupid
window.submitCupidAction = function() {
    if (window.tempSuspectChoice === null) return; 

    commitSuspectChoice(); // Commit Syak

    if (window.tempCupidTargets.length === 2) { 
        nightActions.cupid = window.tempCupidTargets; 
        lovers = [...window.tempCupidTargets]; 
    }
    completeTurn();
}

// Update Bomoh
window.performBomohScan = function() {
    // Bomoh punya UI ada button khas 'Tutup Mata', tapi kita guna button standard untuk submit selepas scan
    // Logic asal anda: Klik button -> Keluar Scan Result -> Klik Button 'Tutup Mata' -> completeTurn
    // Kita kena commit syak bila klik 'Tutup Mata'
    
    // Dalam renderTurnActive (Bomoh), butang pertama ialah "IMBAS SEKARANG"
    // Butang kedua (dalam result screen) ialah "Tutup Mata & Selesai"
    // Kita perlu ubah sedikit flow Bomoh di bawah.
    
    const targetId = window.tempActionTarget;
    // ... (logic scan asal) ...
    // Di sini kita tak commit syak lagi, kita commit bila dia tutup mata.
    
    // ... dalam container.innerHTML result ...
    // Ubah butang 'Tutup Mata' supaya panggil helper function baru
    
    // Sila copy function performBomohScan di bawah:
    const target = players.find(p => p.id === targetId);
    let roleData = ROLES[target.role];
    let isEvil = roleData.team === 'evil';
    let scanImg = ROLE_IMAGES[target.role]; 
    if (target.role === 'bajang') { roleData = ROLES['villager']; isEvil = false; scanImg = ROLE_IMAGES['villager']; }

    const container = document.getElementById('turn-content');
    container.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="font-title text-2xl text-yellow-400 mb-6 tracking-widest uppercase">Penglihatan Batin</h2>
            <div class="relative w-48 h-64 mx-auto mb-6 rounded-xl overflow-hidden border-4 ${isEvil ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]'} bg-black">
                <img src="${scanImg}" class="w-full h-full object-cover">
                <div class="absolute bottom-0 w-full bg-black/80 py-2 text-center"><h3 class="font-title font-bold uppercase ${isEvil ? 'text-red-500' : 'text-emerald-400'}">${roleData.name}</h3></div>
            </div>
            <p class="font-bold text-lg border-t border-gray-700 pt-2 mt-2 mb-6 ${isEvil ? 'text-red-400' : 'text-emerald-300'}">${isEvil ? 'NIAT JAHAT (HANTU)' : 'NIAT BAIK (MANUSIA)'}</p>
            
            <button onclick="commitSuspectChoice(); completeTurn();" class="px-8 py-4 bg-gray-800 border border-gray-600 text-white font-bold w-full hover:bg-gray-700 transition rounded">Tutup Mata & Selesai</button>
        </div>
    `;
}

// Update Pelesit
window.performPelesitScan = function() {
    const targetId = window.tempActionTarget;
    const target = players.find(p => p.id === targetId);
    let hasPower = !(target.role === 'villager' || target.role === 'bajang');

    const container = document.getElementById('turn-content');
    container.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="font-title text-2xl text-green-500 mb-6 tracking-widest uppercase">Hasil Intipan</h2>
            <div class="p-8 border-4 mb-8 bg-black relative overflow-hidden ${hasPower ? 'border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.3)]' : 'border-gray-600'}">
                <p class="text-sm text-gray-400 uppercase mb-2">Status Sasaran</p>
                <h1 class="text-4xl font-bold text-white mb-6">${target.name}</h1>
                <div class="text-6xl mb-6 animate-bounce">${hasPower ? '⚡' : 'zzz'}</div>
                <h3 class="font-title text-3xl font-bold uppercase mb-2 ${hasPower ? 'text-red-400' : 'text-gray-400'}">${hasPower ? 'BERKUASA' : 'TIADA KUASA'}</h3>
            </div>
            
            <button onclick="commitSuspectChoice(); completeTurn();" class="px-8 py-4 bg-gray-800 border border-gray-600 text-white font-bold w-full hover:bg-gray-700 transition">Selesai & Hilangkan Diri</button>
        </div>
    `;
}
// --- FORM UI HELPER ---
// Fungsi untuk menanda 'X' dalam kotak borang undian
window.highlightFormRow = function(btn) {
    // 1. Reset semua baris dalam borang
    document.querySelectorAll('.form-row').forEach(row => {
        row.classList.remove('bg-yellow-100/50', 'border-black'); // Buang highlight
        row.classList.add('border-gray-300'); // Kembalikan border kelabu
        
        // Kosongkan kotak
        const box = row.querySelector('.checkbox-box');
        if(box) box.innerHTML = ''; 
    });

    // 2. Highlight baris yang dipilih
    if(btn) {
        btn.classList.remove('border-gray-300');
        btn.classList.add('bg-yellow-100/50', 'border-black'); // Tambah border hitam tebal
        
        // Masukkan tanda 'X' merah (Gaya tulisan tangan)
        const box = btn.querySelector('.checkbox-box');
        if(box) {
            box.innerHTML = '<span class="text-red-700 font-bold text-xl leading-none block transform -translate-y-0.5 -rotate-3" style="font-family: cursive;">X</span>';
        }
    }
}
// --- LOGIK BOMOH (SCAN) ---
window.performBomohScan = function() {
    const targetId = window.tempActionTarget;
    const target = players.find(p => p.id === targetId);
    let roleData = ROLES[target.role];
    let isEvil = roleData.team === 'evil';
    let scanImg = ROLE_IMAGES[target.role]; // Imej sebenar

    // LOGIK BAJANG (Tipu Bomoh)
    if (target.role === 'bajang') {
        roleData = ROLES['villager']; 
        isEvil = false; 
        scanImg = ROLE_IMAGES['villager']; // Tunjuk imej orang kampung
    }

    const container = document.getElementById('turn-content');
    
    container.innerHTML = `
        <div class="animate-fade-in">
            <h2 class="font-title text-2xl text-yellow-400 mb-6 tracking-widest uppercase">Penglihatan Batin</h2>
            
            <div class="relative w-48 h-64 mx-auto mb-6 rounded-xl overflow-hidden border-4 ${isEvil ? 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]' : 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]'} bg-black">
                <img src="${scanImg}" class="w-full h-full object-cover">
                <div class="absolute bottom-0 w-full bg-black/80 py-2 text-center">
                    <h3 class="font-title font-bold uppercase ${isEvil ? 'text-red-500' : 'text-emerald-400'}">
                        ${roleData.name}
                    </h3>
                </div>
            </div>

            <p class="font-bold text-lg border-t border-gray-700 pt-2 mt-2 mb-6 ${isEvil ? 'text-red-400' : 'text-emerald-300'}">
                ${isEvil ? 'NIAT JAHAT (HANTU)' : 'NIAT BAIK (MANUSIA)'}
            </p>

            <button onclick="completeTurn()" class="px-8 py-4 bg-gray-800 border border-gray-600 text-white font-bold w-full hover:bg-gray-700 transition rounded">
                Tutup Mata & Selesai
            </button>
        </div>
    `;
}
// --- SUSPECT SYSTEM HELPER ---
function getSuspectLeaderboardHTML() {
    // 1. Dapatkan pemain yang disyaki (point > 0), susun dari tinggi ke rendah
    const suspects = players
        .filter(p => p.isAlive && p.suspectCount > 0)
        .sort((a, b) => b.suspectCount - a.suspectCount)
        .slice(0, 3); // Ambil Top 3 sahaja

    if (suspects.length === 0) {
        return `
            <div class="bg-black/40 border border-gray-700 p-3 rounded-lg mb-4 text-center">
                <h4 class="text-orange-400 font-bold uppercase text-xs tracking-widest mb-1">🔥 Carta Syak Wasangka</h4>
                <p class="text-gray-500 text-xs italic">Belum ada sesiapa disyaki...</p>
            </div>
        `;
    }

    return `
        <div class="bg-gradient-to-b from-orange-900/40 to-black/60 border border-orange-600/50 p-3 rounded-lg mb-4 shadow-[0_0_15px_rgba(234,88,12,0.2)] animate-fade-in">
            <h4 class="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2 flex items-center justify-center gap-2 border-b border-orange-800 pb-1">
                🔥 Paling Disyaki 🔥
            </h4>
            <ul class="space-y-1">
                ${suspects.map((p, i) => `
                    <li class="flex justify-between items-center text-xs p-2 rounded ${i===0 ? 'bg-orange-600/20 border border-orange-500/30' : 'bg-black/20'}">
                        <span class="text-gray-200 font-bold flex gap-2 items-center">
                            <span class="${i===0 ? 'text-orange-400 text-sm' : 'text-gray-500'}">#${i+1}</span> ${p.name}
                        </span>
                        <span class="text-white font-mono bg-orange-800 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">${p.suspectCount} Syak</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
}
// --- Turn Completion ---
function completeTurn() {
    turnIndex++;
    saveGameProgress();
    if (turnIndex >= players.length) {
        // FIX: Do NOT hide 'turn-overlay' here immediately. 
        // We leave it visible so it covers the board until the Phase Transition screen takes over.
        
        if (turnMode === 'reveal') {
            startNightPhase();
        } 
        else if (turnMode === 'action') {
            resolveNight();
        } 
        else if (turnMode === 'vote') {
            // For voting, we can hide it because the result popup (Death Overlay) handles the visuals
            document.getElementById('turn-overlay').classList.add('hidden');
            finalizeVotingResults();
        }
    } else { 
        renderTurnPass(); 
    }
}

// --- Phase Logistics ---
function startNightPhase() {
    triggerPhaseTransition('night', () => {
        gamePhase = 'night';
        roundNumber++;
        addToLog(`🌑 Malam pusingan ${roundNumber} bermula.`);
        nightActions = { kills: {}, protected: [], inspections: [], suspicions: {}, cupid: [], witchKill: null, PendekarTarget: null };
        document.getElementById('voting-section').classList.add('hidden');
        document.getElementById('discussion-section').classList.add('hidden');
        document.getElementById('night-summary').classList.add('hidden');
        updateBoardUI();
        turnMode = 'action';
        turnIndex = 0;
        startTurnOverlay();
        saveGameProgress();
    });
}


function resolveNight() {
    let deaths = [];
    
    if (nightActions.cupid && nightActions.cupid.length === 2) {
        addToLog(`💘 Mak Andam telah menyatukan dua jiwa.`);
    }

    // 1. Process Pontianak Kills
    let maxVotes = 0;
    let victimId = null;
    let tie = false;

    for (const [targetId, count] of Object.entries(nightActions.kills)) {
        if (count > maxVotes) { maxVotes = count; victimId = targetId; tie = false; } 
        else if (count === maxVotes) { tie = true; }
    }

    if (victimId && !tie && maxVotes > 0) {
        if (nightActions.protected.includes(victimId)) {
            addToLog(`Seseorang diserang Pontianak tetapi diselamatkan.`);
        } else {
            const victim = players.find(p => p.id === victimId);
            if (victim && victim.isAlive) {
                victim.isAlive = false;
                addToLog(`☠️ ${victim.name} dibunuh oleh Pontianak.`);
                deaths.push(victim);
            }
        }
    } else if (maxVotes === 0) {
        addToLog("Malam berlalu dengan tenang. Tiada serangan Pontianak.");
    }

    // 2. Process Witch Kill (Poison) - LOGIC FIXED
    if (nightActions.witchKill) {
        const witchVictim = players.find(p => p.id === nightActions.witchKill);
        if (witchVictim) {
            // Kes A: Mangsa SUDAH mati (dibunuh Pontianak tadi)
            if (!witchVictim.isAlive) {
                addToLog(`☠️ ${witchVictim.name} turut ditemui dengan kesan racun Nenek Kebayan.`);
                // Kita tak perlu push ke 'deaths' lagi sebab dia dah ada dalam senarai (elak kad kematian muncul dua kali)
            } 
            // Kes B: Mangsa MASIH hidup (belum dibunuh sesiapa)
            else {
                witchVictim.isAlive = false;
                addToLog(`☠️ ${witchVictim.name} ditemui mati berbusa mulut (Racun).`);
                deaths.push(witchVictim);
            }
        }
    }

    // 3. Pendekar AUTO-FIRE LOGIC
    // Check if any dead person is a Pendekar (Check from 'deaths' array which implies currently dead this round)
    const deadPendekar = deaths.find(d => ROLES[d.role].name === 'Pendekar' || d.role === 'Pendekar');
    
    if (deadPendekar && nightActions.PendekarTarget) {
        const PendekarVictim = players.find(p => p.id === nightActions.PendekarTarget);
        // Pendekar boleh tembak walaupun mangsa dah mati (tembak mayat), atau tembak orang hidup
        if (PendekarVictim) {
            if (PendekarVictim.isAlive) {
                PendekarVictim.isAlive = false;
                addToLog(`🔫 Pendekar sempat melepaskan tembakan ke arah ${PendekarVictim.name} sebelum mati.`);
                deaths.push(PendekarVictim);
            } else {
                addToLog(`🔫 Pendekar melepaskan tembakan ke arah mayat ${PendekarVictim.name}.`);
            }
        }
    }

    // 4. Process Chain Deaths (Lovers)
    let allDeaths = [...deaths];
    // Guna loop biasa untuk elak infinite loop jika logic pelik, tapi processDeathChain handle recursive asas
    // Clone array asal supaya pusingan loop tak terganggu oleh penambahan baru
    let currentVictims = [...deaths];
    
    for (let victim of currentVictims) {
        const chain = processDeathChain(victim);
        chain.forEach(d => {
            if (!allDeaths.find(existing => existing.id === d.id)) {
                allDeaths.push(d);
            }
        });
    }

    // 5. Trigger Day
    triggerPhaseTransition('day', () => { 
        if (allDeaths.length > 0) showDeathSequence(allDeaths, 0); 
        else finalizeDaySetup(allDeaths); 
    });
}
function processDeathChain(victim) {
    let deaths = [victim];
    if (lovers.includes(victim.id)) {
        const partnerId = lovers.find(id => id !== victim.id);
        const partner = players.find(p => p.id === partnerId);
        if (partner && partner.isAlive) {
            partner.isAlive = false;
            deaths.push(partner);
            addToLog(`💔 ${partner.name} mati kerana patah hati (Pasangan kepada ${victim.name}).`);
        }
    }
    return deaths;
}

function showDeathSequence(deaths, index) {
    if (index >= deaths.length) { 
        document.getElementById('death-overlay').classList.add('hidden'); 
        finalizeDaySetup(deaths); 
        return; 
    }
    const victim = deaths[index];
    
    // LOGIK ANONYMOUS MODE
    let displayImg = ROLE_IMAGES[victim.role];
    let displayName = ROLES[victim.role].name;
    let titleText = "Jenazah Ditemui";
    let subText = "Identiti Terbongkar:";
    let imgClass = "grayscale opacity-80";
    let iconOverlay = "☠️";

    if (gameSettings.anonymousMode) {
        displayImg = ""; // Tiada gambar
        displayName = "???";
        titleText = "Kematian Misteri";
        subText = "Identiti Dirahsiakan";
        imgClass = "opacity-0"; // Sorok gambar
        iconOverlay = "❓"; // Ikon Tanda Soal
    }

    const overlay = document.getElementById('death-overlay');
    const content = document.getElementById('death-content');
    overlay.classList.remove('hidden');
    
    content.innerHTML = `
        <h2 class="font-title text-4xl text-red-600 mb-2 font-bold tracking-widest uppercase">${titleText}</h2>
        <p class="text-gray-400 mb-6 italic">Mangsa malam tadi...</p>
        
        <div class="relative w-56 h-72 mx-auto mb-6 rounded-xl overflow-hidden border-4 border-red-900/50 shadow-2xl bg-black">
             ${gameSettings.anonymousMode ? '' : `<img src="${displayImg}" class="w-full h-full object-cover ${imgClass}">`}
             <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-8xl drop-shadow-md">${iconOverlay}</span>
             </div>
        </div>

        <h1 class="font-title text-5xl font-bold text-white mb-2">${victim.name}</h1>
        <p class="text-red-400 text-sm mb-1">${subText}</p>
        <p class="text-2xl font-bold text-white tracking-widest border-b border-red-800 pb-4 mb-6">${displayName}</p>

        <button onclick="showDeathSequence(window.pendingDeaths, ${index + 1})" class="px-10 py-4 bg-red-800 text-white font-bold border border-red-500 hover:bg-red-700 w-full md:w-auto rounded shadow-lg">Seterusnya</button>
    `;
    window.pendingDeaths = deaths;
}

function finalizeDaySetup(deaths) {
    gamePhase = 'day';
    updateBoardUI();
    const summaryBox = document.getElementById('night-summary');
    const summaryText = document.getElementById('night-summary-text');
    summaryBox.classList.remove('hidden');
    if (deaths.length > 0) {
        summaryText.textContent = `Tragedi! ${deaths.map(d => d.name).join(', ')} telah mati.`;
        summaryText.className = 'text-red-300 font-bold';
    } else {
        summaryText.textContent = "Tiada sesiapa yang mati malam tadi.";
        summaryText.className = 'text-emerald-300 font-bold';
    }
    checkWinCondition();
    if (gamePhase !== 'ended') startDiscussionPhase();
    saveGameProgress();
}

function startDiscussionPhase() {
    document.getElementById('voting-section').classList.add('hidden');
    document.getElementById('discussion-section').classList.remove('hidden');
    // --- UPDATE LEADERBOARD DI SCREEN UTAMA ---
    const leaderboardContainer = document.getElementById('discussion-leaderboard');
    if (leaderboardContainer) {
        leaderboardContainer.innerHTML = getSuspectLeaderboardHTML();
    }
    // ------------------------------------------
    let timeLeft = gameSettings.discussionTime; 
    const timerDisplay = document.getElementById('discussion-timer');
    const timerBar = document.getElementById('timer-bar');
    timerBar.style.transition = 'none'; timerBar.style.width = '100%';
    const updateDisplay = (t) => {
        const m = Math.floor(t / 60).toString().padStart(2, '0');
        const s = (t % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
        const percent = (t / 120) * 100;
        timerBar.style.width = `${percent}%`;
        timerBar.style.transition = 'width 1s linear';
        if (t <= 10) { timerDisplay.classList.add('text-red-500', 'animate-pulse'); timerBar.className = 'absolute top-0 left-0 h-1 bg-red-600 transition-all duration-1000 ease-linear'; } 
        else { timerDisplay.classList.remove('text-red-500', 'animate-pulse'); timerBar.className = 'absolute top-0 left-0 h-1 bg-orange-600 transition-all duration-1000 ease-linear'; }
    };
    updateDisplay(timeLeft);
    addToLog('🗣️ Sesi perbincangan bermula.');
    if (discussionInterval) clearInterval(discussionInterval);
    discussionInterval = setInterval(() => { timeLeft--; updateDisplay(timeLeft); if (timeLeft <= 0) skipDiscussion(); }, 1000);
}

window.skipDiscussion = function() {
    if (discussionInterval) clearInterval(discussionInterval);
    addToLog('🛑 Perbincangan tamat. Masa untuk mengundi.');
    showToast('Masa perbincangan tamat!', 'warning');
    document.getElementById('discussion-section').classList.add('hidden');
    setupDayVoting();
}

function setupDayVoting() {
    document.getElementById('voting-section').classList.remove('hidden');
    players.forEach(p => p.voteCount = 0);
    turnMode = 'vote';
    turnIndex = 0;
    startTurnOverlay();
    saveGameProgress();
}

function finalizeVotingResults() {
    // 1. Dapatkan senarai pemain hidup
    const alivePlayers = players.filter(p => p.isAlive);
    
    // 2. Cari Calon dengan Undi Tertinggi
    let maxVotes = 0;
    let candidates = [];

    alivePlayers.forEach(p => {
        if (p.voteCount > maxVotes) { 
            maxVotes = p.voteCount; 
            candidates = [p]; 
        } else if (p.voteCount === maxVotes && p.voteCount > 0) { 
            candidates.push(p); 
        }
    });

    document.getElementById('voting-section').classList.add('hidden');

    // --- LOGIK BARU (AMONG US STYLE) ---

    // A. Kira Jumlah Keseluruhan Kuasa Undi yang ada dalam permainan
    // (Ketua Kampung nilai 2, yang lain nilai 1)
    const totalVotePower = alivePlayers.reduce((sum, p) => {
        const weight = (p.role === 'mayor') ? 2 : 1;
        return sum + weight;
    }, 0);

    // B. Kira Jumlah Undi yang diterima oleh SEMUA calon
    const totalVotesReceived = alivePlayers.reduce((sum, p) => sum + p.voteCount, 0);

    // C. Bakinya adalah undi "SKIP" (Berkecuali)
    const skipVotes = totalVotePower - totalVotesReceived;

    // D. Bandingkan Skip vs Calon Tertinggi
    // Jika Skip LEBIH BANYAK atau SAMA dengan undi calon tertinggi -> Tiada Kematian
    if (skipVotes >= maxVotes) {
        let reason = "";
        if (skipVotes > maxVotes) {
            reason = `Majoriti penduduk memilih untuk <strong>BERKECUALI</strong> (${skipVotes} undi).`;
        } else {
            reason = `Undian seri antara <strong>BERKECUALI</strong> dan calon tertinggi (${maxVotes} undi).`;
        }

        showVotingOutcome(
            "TIADA HUKUMAN", 
            `${reason}<br><span class="text-sm italic text-gray-400">Tiada siapa dibuang kampung hari ini.</span>`, 
            "🕊️"
        );
        return;
    }

    // --- TAMAT LOGIK BARU ---

    // 3. Jika ada undian seri antara DUA CALON MANUSIA (bukan skip)
    if (candidates.length > 1) {
        const names = candidates.map(c => c.name).join(', ');
        showVotingOutcome("UNDIAN SERI", `Undian terikat antara: <br><span class="font-bold text-yellow-300">${names}</span>.<br>Tiada majoriti dicapai.`, "⚖️");
        return;
    }

    // 4. Jika ada pemenang mutlak, singkirkan dia
    const victim = candidates[0];
    victim.isAlive = false;
    addToLog(`🗳️ ${victim.name} dijatuhkan hukuman mati.`);
    
    // Proses kematian siang (Pendekar tak boleh tembak waktu siang)
    const totalDeaths = processDeathChain(victim);
    
    // Reset syak wasangka untuk pusingan seterusnya
    players.forEach(p => p.suspectCount = 0);
    
    startExecutionSequence(totalDeaths, 0);
}

function showVotingOutcome(title, message, icon) {
    const overlay = document.getElementById('death-overlay');
    const content = document.getElementById('death-content');
    overlay.classList.remove('hidden');
    content.innerHTML = `
        <div class="text-7xl mb-4 animate-bounce">${icon}</div>
        <h2 class="font-title text-3xl text-yellow-500 mb-4 font-bold tracking-widest uppercase">${title}</h2>
        <div class="border-4 border-gray-600 bg-gray-900/90 p-6 mb-8 rounded-lg">
            <p class="text-lg text-gray-300 leading-relaxed">${message}</p>
        </div>
        <button onclick="finishExecution()" class="px-10 py-4 bg-emerald-800 text-white font-bold border border-emerald-500 hover:bg-emerald-700 w-full md:w-auto shadow-lg transition">Malam Menjelma...</button>
    `;
}

function startExecutionSequence(deaths, index) {
    if (index >= deaths.length) { finishExecution(); return; }
    const victim = deaths[index];
    
    // LOGIK ANONYMOUS MODE
    let displayImg = ROLE_IMAGES[victim.role];
    let displayName = ROLES[victim.role].name;
    let imgClass = "grayscale sepia-0";
    let iconOverlay = "X";
    let subText = "Identiti Terbongkar:";

    if (gameSettings.anonymousMode) {
        displayImg = ""; 
        displayName = "???";
        imgClass = "opacity-0"; 
        iconOverlay = "🔒";
        subText = "Identiti Dirahsiakan";
    }
    
    const overlay = document.getElementById('death-overlay');
    const content = document.getElementById('death-content');
    overlay.classList.remove('hidden');
    
    content.innerHTML = `
        <h2 class="font-title text-3xl text-red-600 mb-2 font-bold tracking-widest uppercase">Hukuman Dijatuhkan</h2>
        
        <div class="relative w-56 h-72 mx-auto mb-6 rounded-xl overflow-hidden border-4 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] bg-black">
             <div class="absolute inset-0 bg-red-900/30 z-10"></div>
             ${gameSettings.anonymousMode ? '' : `<img src="${displayImg}" class="w-full h-full object-cover ${imgClass}">`}
             <div class="absolute inset-0 flex items-center justify-center z-20">
                <span class="text-9xl text-red-600 font-bold border-4 border-red-600 rounded-full w-24 h-24 flex items-center justify-center bg-black/50">${iconOverlay}</span>
             </div>
        </div>

        <h1 class="font-title text-5xl font-bold text-white mb-2 uppercase">${victim.name}</h1>
        <p class="text-red-300 text-sm mb-4">${subText}</p>
        <p class="text-2xl font-bold text-white tracking-widest border-b border-red-800 pb-4 mb-6">${displayName}</p>

        <button onclick="startExecutionSequence(window.execDeaths, ${index + 1})" class="px-10 py-4 bg-red-800 text-white font-bold border border-red-500 hover:bg-red-700 w-full md:w-auto shadow-[0_0_15px_rgba(220,38,38,0.5)] transition rounded">
            ${index + 1 < deaths.length ? 'Lihat Mangsa Seterusnya' : 'Teruskan ke Malam'}
        </button>
    `;
    window.execDeaths = deaths;
}

window.finishExecution = function() {
    // 1. Check if the game has ended (e.g. All wolves dead)
    checkWinCondition(); 

    // 2. Decide what to do with the UI
    if (gamePhase !== 'ended') {
        // Game continues -> Start Night Phase
        // CRITICAL FIX: We DO NOT hide 'death-overlay' here.
        // We leave it open so it covers the board until the transition screen appears.
        startNightPhase();
    } else {
        // Game Over -> Hide the overlay so we can see the Winner Screen
        document.getElementById('death-overlay').classList.add('hidden');
    }
}

function updateBoardUI() {
    const icon = document.getElementById('phase-icon');
    const title = document.getElementById('phase-title');
    const desc = document.getElementById('phase-description');
    if (gamePhase === 'night') { icon.textContent = '🌑'; title.textContent = 'Malam (Night)'; desc.textContent = 'Giliran hantu dan penyiasat...'; } 
    else { icon.textContent = '☀️'; title.textContent = 'Siang (Day)'; desc.textContent = 'Bincang dan undi hantu!'; }
    document.getElementById('round-counter').textContent = `Pusingan ${roundNumber}`;
    
    const container = document.getElementById('game-players-container');
    document.getElementById('alive-count').textContent = players.filter(p => p.isAlive).length;
    document.getElementById('dead-count').textContent = players.filter(p => !p.isAlive).length;
    
    container.innerHTML = players.map(player => {
        // Jika hidup: Tunjuk Avatar Default / Emoji
        // Jika mati: Tunjuk Gambar Kad (Grayscale)
        let visual;
        let borderClass;
        let bgClass;

        if (player.isAlive) {
            visual = `<span class="text-2xl">🙂</span>`;
            borderClass = 'border-emerald-900/50';
            bgClass = 'bg-black/40';
        } else {
            if (gameSettings.anonymousMode) {
                // Tunjuk Kubur Generic
                visual = `<div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600 text-2xl">🪦</div>`;
            } else {
                // Tunjuk Gambar Watak (Asal)
                const roleImg = ROLE_IMAGES[player.role];
                visual = `<div class="w-10 h-10 rounded-full overflow-hidden border border-red-500 grayscale"><img src="${roleImg}" class="w-full h-full object-cover"></div>`;
            }
            borderClass = 'border-red-900/50';
            bgClass = 'bg-red-950/30';
        }

        let roleLabel = '';
        if (!player.isAlive) {
            roleLabel = gameSettings.anonymousMode 
                ? `<p class="text-[10px] text-gray-500 uppercase tracking-widest">DIKEBUMIKAN</p>` 
                : `<p class="text-[10px] text-red-500 uppercase">${ROLES[player.role].name}</p>`;
        }

        return `
        <div class="p-3 border rounded-lg transition-all flex items-center gap-3 ${borderClass} ${bgClass}">
            ${visual}
            <div class="min-w-0">
              <p class="font-bold text-sm truncate ${player.isAlive ? 'text-emerald-100' : 'text-red-300 line-through'}">${player.name}</p>
              ${roleLabel}
            </div>
        </div>
    `}).join('');
}

// --- KEMASKINI DALAM game.js ---

// 1. Tambah fungsi ini di bahagian bawah file (atau mana-mana)
function saveGameToHistory(winner) {
    const historyData = {
        id: Date.now(),
        date: new Date().toLocaleString('ms-MY'), // Format masa Malaysia
        winner: winner,
        roundCount: roundNumber,
        playerCount: players.length,
        // Simpan senarai pemain dan role mereka untuk rujukan
        roster: players.map(p => `${p.name} (${ROLES[p.role].name})`)
    };

    // Ambil data lama, tambah data baru
    const existingHistory = JSON.parse(localStorage.getItem('kb_game_history') || '[]');
    existingHistory.push(historyData);
    
    // Simpan semula ke browser
    localStorage.setItem('kb_game_history', JSON.stringify(existingHistory));
    console.log("Sejarah permainan disimpan!");
}

// 2. Ubah checkWinCondition untuk panggil saveGameToHistory
function checkWinCondition() {
    const alivePlayers = players.filter(p => p.isAlive);
    const aliveEvil = alivePlayers.filter(p => ROLES[p.role].team === 'evil').length;
    const aliveGood = alivePlayers.filter(p => ROLES[p.role].team === 'good').length;
    
    let winner = null;
    
    if (alivePlayers.length === 2 && lovers.includes(alivePlayers[0].id) && lovers.includes(alivePlayers[1].id)) {
        winner = 'Pasangan Kekasih';
    } 
    else if (aliveEvil === 0) winner = 'Orang Kampung';
    else if (aliveEvil >= aliveGood) winner = 'Hantu';

    if (winner) {
        
        // --- AUTOSAVE HERE ---
        if (gamePhase !== 'ended') {
            saveGameToHistory(winner);
        }
        clearGameProgress();
        // ---------------------

        gamePhase = 'ended';
        document.getElementById('game-board').classList.add('hidden');
        document.getElementById('death-overlay').classList.add('hidden');
        document.getElementById('discussion-section').classList.add('hidden');
        document.getElementById('turn-overlay').classList.add('hidden');
        document.getElementById('voting-section').classList.add('hidden');
        generateEndGameReport();
        const winScreen = document.getElementById('winner-announcement');
        winScreen.classList.remove('hidden');
        document.getElementById('winner-title').textContent = `${winner} Menang!`;
        document.getElementById('winner-message').textContent = winner === 'Hantu' ? "Kampung telah musnah..." : "Kampung kini aman!";
    }
}

function restartKeepPlayers() {
    // 1. Reset Semua Variable Permainan
    gamePhase = 'setup';
    roundNumber = 0;
    gameLog = [];
    lovers = [];
    nightActions = { targets: {}, protected: [], inspections: [], suspicions: {}, cupid: [], kills: {}, witchKill: null, PendekarTarget: null };
    witchPotions = { heal: true, poison: true };
    
    // Reset Jumlah Watak kepada 0
    roleCounts = { 
        Pontianak: 0, villager: 0, Bomoh: 0, Ustaz: 0, Pendekar: 0, 
        cupid: 0, witch: 0, mayor: 0, bajang: 0, hantu_raya: 0, pelesit: 0 
    };

    // 2. Reset Status Setiap Pemain
    players.forEach(p => { 
        p.role = null; 
        p.isAlive = true; 
        p.voteCount = 0; 
        p.suspectCount = 0; 
    });

    // 3. Kemaskini UI (Tanpa Reload Page)
    document.getElementById('winner-announcement').classList.add('hidden');
    document.getElementById('game-board').classList.add('hidden');
    document.getElementById('game-setup').classList.remove('hidden');
    
    // --- PERUBAHAN UTAMA DI SINI ---
    // Masuk ke Step 1 (Pendaftaran), BUKAN Step 2
    document.getElementById('setup-step-1').classList.remove('hidden'); // Tunjuk Step 1
    document.getElementById('setup-step-2').classList.add('hidden');    // Sorok Step 2
    
    // Render semula senarai pemain di Step 1
    renderPlayers();
    updateNextButton(); 
    
    showToast("Pemain dikekalkan. Sila uruskan pendaftaran pemain.", "success");

    // 4. Simpan status baru
    saveGameProgress(); 
}

function fullResetGame() {
    if (confirm("Adakah anda pasti mahu memadam semua pemain?")) { 
        // 1. Kosongkan semua pembolehubah global secara manual
        players = [];
        gameLog = [];
        lovers = [];
        nightActions = {};
        gamePhase = 'setup';
        roleCounts = { 
            Pontianak: 0, villager: 0, Bomoh: 0, Ustaz: 0, Pendekar: 0, 
            cupid: 0, witch: 0, mayor: 0, bajang: 0, hantu_raya: 0, pelesit: 0 
        };

        // 2. "Hard Overwrite": Simpan data kosong ini ke dalam memori
        // Ini akan menimpa data pemain lama dengan data kosong serta-merta.
        saveGameProgress();

        // 3. Kemudian barulah padam kunci (Key) dari memori
        clearGameProgress();

        // 4. Muat semula halaman
        location.reload(); 
    }
}
function resetGame() { fullResetGame(); }
function addToLog(msg) {
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    gameLog.push({time, msg});
    const el = document.getElementById('game-log');
    if(el) { el.innerHTML = gameLog.map(e => `<div class="mb-1 border-b border-gray-800 pb-1"><span class="text-emerald-700 font-mono">[${e.time}]</span> <span class="text-gray-300">${e.msg}</span></div>`).join(''); el.scrollTop = el.scrollHeight; }
}

function generateEndGameReport() {
    // 1. Unhide (handled by checkWinCondition logic mostly, but good to ensure)
    // Dalam HTML baru, content sentiasa visible dalam modal, cuma modal yang hidden.
    
    // 2. Jana Senarai Identiti
    const rolesList = document.getElementById('report-roles-list');
    if (rolesList) {
        rolesList.innerHTML = players.map(p => {
            const roleName = ROLES[p.role].name;
            const isEvil = ROLES[p.role].team === 'evil';
            const statusIcon = p.isAlive ? "✅" : "💀";
            const textColor = p.isAlive ? "text-emerald-300" : "text-red-400 decoration-line-through";
            
            return `
            <li class="flex justify-between items-center bg-black/40 p-2 rounded mb-1 border border-white/5">
                <span class="font-bold ${textColor}">${p.name}</span>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] uppercase tracking-wider ${isEvil ? 'text-red-500' : 'text-emerald-500'} font-bold bg-black/50 px-2 py-0.5 rounded">${roleName}</span>
                    <span class="text-xs">${statusIcon}</span>
                </div>
            </li>`;
        }).join('');
    }

    // 3. Jana Kronologi
    const timeline = document.getElementById('report-timeline');
    if (timeline) {
        // Filter log penting
        const importantEvents = gameLog.filter(log => 
            log.msg.includes('☠️') || 
            log.msg.includes('🗳️') || 
            log.msg.includes('🔫') || 
            log.msg.includes('💔') || 
            log.msg.includes('Pusingan')
        );

        if (importantEvents.length === 0) {
            timeline.innerHTML = `<div class="text-center text-gray-500 italic p-2">Tiada kejadian penting direkodkan.</div>`;
        } else {
            timeline.innerHTML = importantEvents.map(log => {
                const isRound = log.msg.includes('Pusingan');
                return `
                <div class="flex gap-2 text-[10px] border-b border-gray-800 pb-1 mb-1 last:border-0">
                    <span class="text-gray-500 font-mono w-12 shrink-0">${log.time}</span>
                    <span class="${isRound ? 'text-yellow-500 font-bold uppercase mt-1' : 'text-gray-300'}">
                        ${log.msg}
                    </span>
                </div>
                `;
            }).join('');
        }
    }
}

function printGameLog() { window.print(); }
function printGameSummary() { window.print(); }
function handlePhaseAction() { if (gamePhase === 'day') startNightPhase(); }
function triggerPhaseTransition(phase, callback) {
    const screen = document.getElementById('phase-transition-screen');
    const title = document.getElementById('transition-title');
    const sub = document.getElementById('transition-subtitle');
    const icon = document.getElementById('transition-icon');
    
    // 1. Show the transition overlay immediately
    screen.classList.remove('hidden');
    // Allow browser paint, then fade in
    setTimeout(() => { screen.style.opacity = '1'; }, 10);

    // 2. Set Text & Colors
    if (phase === 'night') {
        screen.style.backgroundColor = '#020617'; 
        title.innerHTML = 'Malam Menjelma...'; 
        title.className = 'font-title text-4xl md:text-6xl font-bold tracking-widest uppercase mb-4 text-emerald-500'; 
        sub.innerHTML = 'Hantu mula berkeliaran...'; 
        icon.innerHTML = '🌑';
    } else {
        screen.style.backgroundColor = '#451a03'; 
        title.innerHTML = 'Siang Tiba...'; 
        title.className = 'font-title text-4xl md:text-6xl font-bold tracking-widest uppercase mb-4 text-yellow-400'; 
        sub.innerHTML = 'Matahari terbit, adakah semua selamat?'; 
        icon.innerHTML = '☀️';
    }

    // 3. EXECUTE GAME UPDATE (Hidden Phase)
    setTimeout(() => {
        // A. Clean up ALL overlays that might be open
        document.getElementById('turn-overlay').classList.add('hidden');
        document.getElementById('death-overlay').classList.add('hidden'); // <--- ADDED THIS LINE
        
        // B. Run the actual game update logic
        if (callback) callback();
        
    }, 1500); 

    // 4. Fade Out
    setTimeout(() => { 
        screen.style.opacity = '0'; 
        setTimeout(() => { 
            screen.classList.add('hidden'); 
        }, 1000); 
    }, 3000); 
}
// --- SYAK SYSTEM HELPERS (DIKEMASKINI) ---

// Variable sementara untuk menyimpan pilihan syak sebelum dihantar
window.tempSuspectChoice = null; 

// Fungsi untuk memilih syak (Visual & Logic)
window.selectSuspectTarget = function(id) {
    window.tempSuspectChoice = id;
    
    // Visual Highlight
    document.querySelectorAll('.suspect-btn').forEach(btn => {
        btn.classList.remove('border-orange-500', 'bg-orange-900/40');
        btn.classList.add('border-gray-700', 'bg-gray-900/80');
        const badge = btn.querySelector('.badge-indicator');
        if(badge) {
            badge.classList.remove('bg-orange-600', 'text-white');
            badge.classList.add('bg-gray-800', 'text-gray-500');
            badge.innerText = "PILIH";
        }
    });

    const selectedBtn = document.getElementById(`suspect-btn-${id}`);
    if(selectedBtn) {
        selectedBtn.classList.remove('border-gray-700', 'bg-gray-900/80');
        selectedBtn.classList.add('border-orange-500', 'bg-orange-900/40');
        const badge = selectedBtn.querySelector('.badge-indicator');
        if(badge) {
            badge.classList.remove('bg-gray-800', 'text-gray-500');
            badge.classList.add('bg-orange-600', 'text-white');
            badge.innerText = "DIPILIH";
        }
    }

    // Semak sama ada boleh enable butang utama
    validateTurnCompletion();
}

// Fungsi untuk menjana HTML Zon Syak (Dikemaskini untuk Hantu vs Manusia)
function generateSuspectSection(targets, currentRole) {
    // Tentukan Team (Jahat atau Baik)
    const isEvil = ROLES[currentRole].team === 'evil';
    
    // Teks Custom Mengikut Team
    const sectionTitle = isEvil ? "Agenda Hasutan" : "Zon Syak Wasangka";
    const subTitle = isEvil ? "*Pilih mangsa fitnah untuk kelirukan kampung" : "*Siapa dalang sebenar? Wajib pilih.";
    const buttonLabel = isEvil ? "FITNAH" : "SYAK";
    const icon = isEvil ? "😈" : "🔥";
    const badgeColorDefault = isEvil ? "bg-red-900 text-red-200" : "bg-gray-800 text-gray-500";
    const badgeColorActive = isEvil ? "bg-red-600 text-white" : "bg-orange-600 text-white";

    return `
        <div class="mt-6 pt-4 border-t border-white/10 w-full animate-fade-in bg-black/20 p-2 rounded-lg">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <span class="text-lg">${icon}</span>
                    <h3 class="font-title text-xs ${isEvil ? 'text-red-400' : 'text-orange-400'} uppercase tracking-widest font-bold">${sectionTitle}</h3>
                </div>
                <span class="text-[9px] text-gray-500 italic">${subTitle}</span>
            </div>
            
            <div class="max-h-40 overflow-y-auto custom-scrollbar border border-gray-800 rounded bg-black/40 p-1 mt-2">
                <button id="suspect-btn-NO_SUSPECT" onclick="window.selectSuspectTarget('NO_SUSPECT')" class="suspect-btn w-full mb-1 p-2 text-left bg-gray-900/80 border border-gray-700 hover:border-gray-500 transition flex justify-between items-center group rounded">
                    <span class="text-xs text-gray-400 font-bold group-hover:text-white italic">⛔ ${isEvil ? 'Tiada Hasutan' : 'Tiada Syak'}</span>
                    <span class="badge-indicator text-[9px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-white/10 transition">PILIH</span>
                </button>

                ${targets.map(t => `
                    <button id="suspect-btn-${t.id}" onclick="window.selectSuspectTarget('${t.id}')" class="suspect-btn w-full mb-1 p-2 text-left bg-gray-900/80 border border-gray-700 ${isEvil ? 'hover:border-red-600' : 'hover:border-orange-600'} transition flex justify-between items-center group rounded">
                        <span class="text-xs text-gray-300 font-bold group-hover:text-white">${t.name}</span>
                        <span class="badge-indicator text-[9px] ${badgeColorDefault} px-2 py-0.5 rounded border border-white/10 ${isEvil ? 'group-hover:bg-red-900/50 group-hover:text-red-200' : 'group-hover:bg-orange-900/50 group-hover:text-orange-200'} transition">${buttonLabel}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

window.validateTurnCompletion = function() {
    
    // ---------------------------------------------------
    // 1. LOGIK KHAS UNTUK FASA UNDIAN (VOTE)
    // ---------------------------------------------------
    if (turnMode === 'vote') {
        const btn = document.getElementById('btn-confirm-action');
        if (btn) {
            // Semasa undi, tak perlu 'Syak Wasangka'. Cukup sekadar ada target (Calon atau Abstain).
            if (window.tempActionTarget) { 
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
                btn.classList.add('animate-pulse-glow');
            } else {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
                btn.classList.remove('animate-pulse-glow');
            }
        }
        return; // Keluar terus, jangan jalankan logik malam di bawah
    }

    // ---------------------------------------------------
    // 2. LOGIK UNTUK FASA TINDAKAN MALAM (ACTION)
    // ---------------------------------------------------
    const player = players[turnIndex];
    let isActionReady = false;
    
    // Syarat Wajib: MESTI pilih 'Syak Wasangka' (kecuali undian)
    const isSuspectReady = window.tempSuspectChoice !== null; 

    // --- PENENTUAN STATUS ACTION MENGIKUT ROLE ---

    // A. KUMPULAN PASIF (Tiada kuasa aktif malam, cuma tidur/syak)
    // 'villager' = Orang Kampung
    // 'mayor'    = Ketua Kampung (Kuasa siang sahaja)
    // 'bajang'   = Saka (Minion, tiada kuasa aktif, cuma kelirukan Bomoh)
    if (['villager', 'mayor', 'bajang'].includes(player.role)) {
         isActionReady = true; 
    } 

    // B. KUMPULAN BERSYARAT (Hantu Raya & Cupid)
    else if (player.role === 'hantu_raya') {
         const pontianakHidup = players.filter(p => p.role === 'Pontianak' && p.isAlive).length;
         if (pontianakHidup > 0) {
             isActionReady = true; // Tuan hidup = Pasif (Support)
         } else {
             isActionReady = window.tempActionTarget !== null; // Tuan mati = Killer (Perlu target)
         }
    }
    else if (player.role === 'cupid') {
        // Round 1: Mesti pilih 2 orang. Round 2+: Pasif (Tugas selesai)
        if (roundNumber === 1) {
            isActionReady = window.tempCupidTargets.length === 2;
        } else {
            isActionReady = true; 
        }
    }

    // C. KUMPULAN SPECIAL ACTION (Witch)
    else if (player.role === 'witch') {
        // Mesti pilih action (Heal/Poison/Skip)
        isActionReady = window.tempWitchAction !== null; 
    }

    // D. KUMPULAN STANDARD TARGET (Pontianak, Ustaz, Bomoh, Pendekar, Pelesit)
    // Mesti ada satu target dipilih (atau SKIP bagi Pontianak)
    else {
        isActionReady = window.tempActionTarget !== null;
    }

    // ---------------------------------------------------
    // 3. KEMASKINI STATUS BUTANG
    // ---------------------------------------------------
    const mainBtns = [
        'btn-confirm-action', // Standard (Pontianak, Ustaz, Pendekar, Bomoh, Hantu Raya Killer)
        'btn-confirm-cupid',  // Cupid
        'btn-confirm-witch',  // Witch
        'btn-pelesit-scan',   // Pelesit
        'btn-villager-sleep'  // Villager, Mayor, Bajang, Hantu Raya Support, Cupid (Rnd 2+)
    ];

    mainBtns.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            // Butang aktif JIKA: Action Selesai DAN Syak Wasangka Dipilih
            if (isActionReady && isSuspectReady) {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
                btn.classList.add('animate-pulse-glow');
            } else {
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
                btn.classList.remove('animate-pulse-glow');
            }
        }
    });
}

// Fungsi Commit Syak (Dipanggil bila butang utama ditekan)
function commitSuspectChoice() {
    if (window.tempSuspectChoice && window.tempSuspectChoice !== 'NO_SUSPECT') {
        const target = players.find(p => p.id === window.tempSuspectChoice);
        if (target) {
            target.suspectCount = (target.suspectCount || 0) + 1;
        }
    }
}

// Fungsi untuk 'Ulang & Edit Pemain' (Butang Biru)
window.restartToPlayerEntry = function() {
    if (!confirm("Adakah anda pasti mahu menghentikan permainan dan kembali ke menu tambah pemain?")) return;

    // 1. Reset Variable Permainan
    gamePhase = 'setup';
    roundNumber = 0;
    gameLog = [];
    lovers = [];
    nightActions = { targets: {}, protected: [], inspections: [], suspicions: {}, cupid: [], kills: {}, witchKill: null, PendekarTarget: null };
    witchPotions = { heal: true, poison: true };
    
    // Reset Jumlah Watak
    roleCounts = { 
        Pontianak: 0, villager: 0, Bomoh: 0, Ustaz: 0, Pendekar: 0, 
        cupid: 0, witch: 0, mayor: 0, bajang: 0, hantu_raya: 0, pelesit: 0 
    };

    // 2. Reset Status Setiap Pemain
    players.forEach(p => { 
        p.role = null; 
        p.isAlive = true; 
        p.voteCount = 0; 
        p.suspectCount = 0; 
    });

    // 3. Kemaskini UI (Manual Redirect ke Step 1)
    document.getElementById('game-board').classList.add('hidden');
    document.getElementById('game-setup').classList.remove('hidden');
    
    // PAKSA KE STEP 1
    document.getElementById('setup-step-1').classList.remove('hidden');
    document.getElementById('setup-step-2').classList.add('hidden');
    
    // Render semula senarai
    renderPlayers();
    updateNextButton();

    // 4. Simpan status
    saveGameProgress(); 

}
