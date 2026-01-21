// common.js - Shared utilities and configurations

// --- Configuration & Constants ---
const defaultConfig = {
    font_family: 'Crimson Text', // Changed default to look more "old storybook"
    font_size: 16
};

// Roles Definition (Malaysian Horror Theme)
const ROLES = {
    Pontianak: { 
        name: 'Pontianak', 
        emoji: '🧛‍♀️', 
        team: 'evil', 
        description: 'Menghantui desa tatkala bulan mengambang, mencari korban untuk disiat nyawanya sebelum fajar menyinsing.' 
    },
    hantu_raya: {
        name: 'Hantu Raya',
        emoji: '👹',
        team: 'evil',
        description: 'Abdi setia kegelapan. Tatkala pontianak gugur, dialah yang bakal mewarisi taring pembunuhan,menggandakan korban.'
    },
    pelesit: {
        name: 'Pelesit',
        emoji: '🦗',
        team: 'evil',
        description: 'Mata-mata iblis yang merayap senyap, menghidu kebenaran di sebalik topeng manusia.'
    },
    villager: { 
        name: 'Orang Kampung', 
        emoji: '👥', 
        team: 'good', 
        description: 'Insan kerdil yang hanya mendambakan sinar mentari, bertahan hidup daripada cengkaman malam yang kejam.' 
    },
    bajang: {
        name: 'Saka',
        emoji: '🦎',
        team: 'evil',
        description: 'Musuh dalam selimut, berwajah suci namun berhati raksasa. Pandangan batin pun mampu dikaburkannya.'
    },
    Bomoh: { 
        name: 'Bomoh', 
        emoji: '🥥', 
        team: 'good', 
        description: 'Mempunyai mata batin yang menembus hijab, mampu melihat wajah sebenar makhluk yang berselindung.' 
    },
    Ustaz: { 
        name: 'Ustaz', 
        emoji: '📿', 
        team: 'good', 
        description: 'Benteng keimanan yang teguh, melafazkan ayat suci demi memayungi nyawa daripada malapetaka.' 
    },
    Pendekar: { 
        name: 'Pendekar', 
        emoji: '🗡️', 
        team: 'good', 
        description: 'Pahlawan berdarah panas. Jika nyawanya melayang, pasti ada musuh yang turut diheret ke liang lahat.' 
    },
    cupid: { 
        name: 'Mak Andam', 
        emoji: '💐', 
        team: 'good', 
        description: 'Pengikat kasih dua jiwa, menjalinkan takdir yang mungkin berakhir dengan tragedi berdarah.' 
    },
    witch: { 
        name: 'Nenek Kebayan', 
        emoji: '👵', 
        team: 'good', 
        description: 'Penjaga rahsia hutan, di tangannya ada penawar penyembuh luka atau racun peragut nyawa.' 
    },
    mayor: { 
        name: 'Ketua Kampung', 
        emoji: '👴', 
        team: 'good', 
        description: 'Suara keramat yang disegani, titahnya pemberat neraca keadilan ketika sidang berlangsung.' 
    }
};

// --- UI Utilities ---

// Show Toast Notification
function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    if(!container) return; 
    
    const div = document.createElement('div');
    // Updated colors for the theme
    div.className = `px-4 py-2 rounded shadow-lg text-white mb-2 font-bold tracking-wide border transition-all duration-300 ${type==='error'?'bg-red-900 border-red-700':'bg-emerald-900 border-emerald-700'}`;
    div.innerText = msg;
    container.appendChild(div);
    
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

// Toggle Settings Panel
function toggleSettings() {
    const p = document.getElementById('settings-panel');
    if(p) p.classList.toggle('hidden');
}

// Change Display Mode
function changeDisplayMode(mode) {
    const app = document.getElementById('app');
    if (!app) return;

    app.classList.remove('high-contrast', 'kids-mode');
    
    if (mode === 'high-contrast') {
        app.classList.add('high-contrast');
    } else if (mode === 'kids') {
        app.classList.add('kids-mode');
    }
}

// Change Text Size
function changeTextSize(size) {
    document.body.style.fontSize = `${size}px`;
}

// Close settings
document.addEventListener('click', (e) => {
    const panel = document.getElementById('settings-panel');
    const settingsBtn = e.target.closest('button[aria-label="Settings"]');
    
    if (panel && !panel.contains(e.target) && !settingsBtn && !panel.classList.contains('hidden')) {
        panel.classList.add('hidden');
    }
});