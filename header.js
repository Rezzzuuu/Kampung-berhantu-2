document.addEventListener("DOMContentLoaded", function() {
    
    // -----------------------------------------------------------
    // 1. AUTOMATIK LOAD CSS 
    // -----------------------------------------------------------
    function loadHeaderCSS() {
        // Kita tambah CSS khas untuk mobile transition & layout
        const cssId = 'header-dynamic-css';
        if (!document.getElementById(cssId)) {
            const style = document.createElement('style');
            style.id = cssId;
            style.innerHTML = `
                /* Smooth height transition for mobile menu */
                #mobile-menu {
                    transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                }
                #mobile-menu.open {
                    max-height: 400px; /* Cukup untuk semua link */
                    opacity: 1;
                }
                /* Active link style adjustments */
                .nav-active {
                    background-color: rgba(6, 78, 59, 0.8); /* emerald-800 */
                    color: white !important;
                    font-weight: bold;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            `;
            document.head.appendChild(style);
        }

        // Panggil fail CSS luaran (jika ada)
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'header.css'; 
        document.head.appendChild(link);
    }
    loadHeaderCSS();

    // -----------------------------------------------------------
    // 2. APPLY SAVED MODE
    // -----------------------------------------------------------
    const savedDisplayMode = localStorage.getItem('kampungDisplayMode');
    if (savedDisplayMode && savedDisplayMode !== 'none') {
        document.documentElement.classList.add(savedDisplayMode);
    }

    // -----------------------------------------------------------
    // 3. INJECT RESPONSIVE NAVBAR HTML
    // -----------------------------------------------------------
    const placeholder = document.getElementById("navbar-placeholder");
    
    if (placeholder) {
        placeholder.innerHTML = `
    <audio id="bg-music" loop>
        <source src="" type="audio/mpeg">
    </audio>

    <nav class="no-print sticky top-0 z-50 surface-main border-b border-green-900 shadow-2xl transition-colors duration-300 bg-black/90 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          
          <div class="flex items-center gap-3">
            <span class="text-3xl animate-float">👻</span>
            <h1 class="font-title text-xl md:text-2xl font-bold text-emerald-400 tracking-wider">
                <span class="hidden md:inline">Kampung Berhantu</span>
                <span class="md:hidden">Kampung Berhantu</span> </h1>
          </div>

          <div class="flex items-center gap-2"> 
            
            <div class="hidden md:flex items-center gap-1">
                <a href="menu.html" class="nav-link text-sm text-emerald-300 hover:text-white transition px-3 py-1.5 rounded hover:bg-emerald-900/30">Home</a>
                <a href="game.html" class="nav-link text-sm text-emerald-300 hover:text-white transition px-3 py-1.5 rounded hover:bg-emerald-900/30">Main</a>
                
                <div class="relative group">
                    <button class="nav-link text-sm text-emerald-300 hover:text-white transition px-3 py-1.5 rounded hover:bg-emerald-900/30 flex items-center gap-1 cursor-default">
                      Cara Bermain
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <div class="absolute top-full left-0 mt-1 w-36 bg-black border border-emerald-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform z-50">
                      <a href="tutorial.html" class="block px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-900 hover:text-white transition border-b border-emerald-900/30">📜 Panduan</a>
                      <a href="watak.html" class="block px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-900 hover:text-white transition">👺 Watak</a>
                    </div>
                </div>
                
                <a href="history.html" class="nav-link text-sm text-emerald-300 hover:text-white transition px-3 py-1.5 rounded hover:bg-emerald-900/30">Sejarah</a>
                <a href="about.html" class="nav-link text-sm text-emerald-300 hover:text-white transition px-3 py-1.5 rounded hover:bg-emerald-900/30">Tentang</a>
            </div>

            <div class="hidden md:block h-6 w-px bg-emerald-800 mx-2"></div>

            <button id="btn-open-settings" class="text-emerald-400 hover:text-white transition p-2 rounded-full hover:bg-emerald-900/50 duration-500" title="Tetapan">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>

            <button id="btn-mobile-menu" class="md:hidden text-emerald-400 hover:text-white p-2 rounded-md hover:bg-emerald-900/50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

          </div>
        </div>
      </div>

      <div id="mobile-menu" class="md:hidden border-t border-emerald-900 bg-black/95">
        <div class="px-4 py-3 space-y-1 flex flex-col">
            <a href="menu.html" class="nav-link block px-3 py-2 rounded-md text-base font-medium text-emerald-300 hover:text-white hover:bg-emerald-900/50">🏠 Home</a>
            <a href="game.html" class="nav-link block px-3 py-2 rounded-md text-base font-medium text-emerald-300 hover:text-white hover:bg-emerald-900/50">🎮 Main Game</a>
            
            <div class="pl-4 border-l-2 border-emerald-800 my-2">
                <a href="tutorial.html" class="nav-link block px-3 py-2 text-sm text-emerald-400 hover:text-white">📜 Panduan</a>
                <a href="watak.html" class="nav-link block px-3 py-2 text-sm text-emerald-400 hover:text-white">👺 Watak</a>
            </div>

            <a href="history.html" class="nav-link block px-3 py-2 rounded-md text-base font-medium text-emerald-300 hover:text-white hover:bg-emerald-900/50">📜 Sejarah</a>
            <a href="about.html" class="nav-link block px-3 py-2 rounded-md text-base font-medium text-emerald-300 hover:text-white hover:bg-emerald-900/50">ℹ️ Tentang</a>
        </div>
      </div>
    </nav>

    <div id="settings-modal" class="hidden fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity opacity-0">
        <div class="bg-[#1a2e25] border-2 border-emerald-600 rounded-lg shadow-2xl w-[90%] max-w-lg overflow-hidden transform scale-95 transition-transform duration-300" id="settings-box">
            
            <div class="bg-emerald-900/80 px-6 py-4 flex justify-between items-center border-b border-emerald-700">
                <h2 class="text-xl font-title font-bold text-emerald-100 tracking-widest uppercase">Tetapan Sistem</h2>
                <button id="btn-close-settings" class="text-emerald-400 hover:text-white hover:bg-red-900/50 rounded-full p-1 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div class="p-6 space-y-8 text-emerald-100 max-h-[70vh] overflow-y-auto">
                <div>
                    <h3 class="flex items-center gap-2 text-lg font-bold text-emerald-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        Tetapan Audio
                    </h3>
                    <div class="mb-5">
                         <div class="flex justify-between mb-2">
                            <label for="music-select" class="text-sm font-medium">Pilih Lagu Latar</label>
                        </div>
                        <select id="music-select" class="w-full bg-emerald-900 border border-emerald-700 text-emerald-100 text-sm rounded focus:ring-emerald-500 focus:border-emerald-500 block p-2.5">
                            <option value="assets/Creepy.mp3">👻 Kampung Seram (Default)</option>
                            <option value="assets/halflife.mp3">💀 Degupan Jantung (Suspens)</option>
                            <option value="assets/Yume.mp3">🏃‍♂️ Lari Hantu (Laju)</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <div class="flex justify-between mb-1">
                            <label for="music-slider" class="text-sm font-medium">Kuat Bunyi (Volume)</label>
                            <span id="music-percent" class="text-sm text-emerald-400 font-mono">30%</span>
                        </div>
                        <input type="range" id="music-slider" min="0" max="1" step="0.05" value="0.3" 
                            class="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300">
                    </div>
                </div>

                <div class="pt-4 border-t border-emerald-800/50">
                    <h3 class="flex items-center gap-2 text-lg font-bold text-emerald-400 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Paparan & Aksesibiliti
                    </h3>
                    <div class="flex flex-col gap-2">
                        <label for="colorblind-mode" class="text-sm font-medium">Mod Paparan (Global)</label>
                        <select id="colorblind-mode" class="w-full bg-emerald-900 border border-emerald-700 text-emerald-100 text-sm rounded focus:ring-emerald-500 focus:border-emerald-500 block p-2">
                            <option value="none">Normal (Asal)</option>
                            <option value="mode-readable">Mod Teks Mudah Baca (Dyslexia)</option>
                            <option value="mode-deuteranopia">Deuteranopia (Tukar Semua Kuning ➡ Biru)</option>
                            <option value="mode-protanopia">Protanopia (Tukar Semua Merah ➡ Cyan)</option>
                            <option value="mode-tritanopia">Tritanopia (Tukar Semua Biru ➡ Pink)</option>
                            <option value="mode-high-contrast">High Contrast (Hitam Putih)</option>
                            <option value="mode-kids">Kids Mode (Cerah)</option>
                        </select>
                        <p class="text-xs text-gray-400 italic mt-1">Amaran: Mod ini akan mengubah warna KESELURUHAN website.</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-black/50 px-6 py-3 border-t border-emerald-800 flex justify-end">
                <button id="btn-reset-settings" class="text-xs text-gray-400 hover:text-white underline mr-4">
                    Reset Semula
                </button>
                <button id="btn-save-settings" class="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-1 px-6 rounded shadow-lg transition transform hover:scale-105">
                    Tutup
                </button>
            </div>
        </div>
    </div>
        `;

        // -----------------------------------------------------------
        // 4. LOGIC (Mobile Menu, Active Links, Settings)
        // -----------------------------------------------------------
        
        // --- MOBILE MENU LOGIC ---
        const btnMobile = document.getElementById('btn-mobile-menu');
        const mobileMenu = document.getElementById('mobile-menu');

        if(btnMobile && mobileMenu){
            btnMobile.addEventListener('click', () => {
                // Toggle Class 'open' untuk animasi
                mobileMenu.classList.toggle('open');
            });

            // Tutup menu bila klik mana-mana link dalam mobile menu
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.remove('open');
                });
            });
        }

        // --- ACTIVE LINK HIGHLIGHTER ---
        const currentPath = window.location.pathname.split("/").pop() || 'index.html';
        const allLinks = document.querySelectorAll('nav a.nav-link'); // Select desktop & mobile links

        allLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath) {
                // Tambah class 'nav-active' (defined dalam CSS di atas)
                link.classList.remove('text-emerald-300');
                link.classList.add('nav-active');
                
                // Jika dalam Dropdown Desktop, warnakan butang induknya
                const parentGroup = link.closest('.group');
                if (parentGroup) {
                    const parentBtn = parentGroup.querySelector('button');
                    if(parentBtn) {
                        parentBtn.classList.remove('text-emerald-300');
                        parentBtn.classList.add('nav-active');
                    }
                }
            }
        });

        // --- SETTINGS MODAL LOGIC (Sama seperti sebelum ini) ---
        const btnOpen = document.getElementById('btn-open-settings');
        const btnClose = document.getElementById('btn-close-settings');
        const btnSave = document.getElementById('btn-save-settings');
        const modal = document.getElementById('settings-modal');
        const modalBox = document.getElementById('settings-box');
        
        function openModal() {
            modal.classList.remove('hidden');
            setTimeout(() => { modal.classList.remove('opacity-0'); modalBox.classList.remove('scale-95'); modalBox.classList.add('scale-100'); }, 10);
        }
        function closeModal() {
            modal.classList.add('opacity-0'); modalBox.classList.remove('scale-100'); modalBox.classList.add('scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }

        if(btnOpen) btnOpen.addEventListener('click', openModal);
        if(btnClose) btnClose.addEventListener('click', closeModal);
        if(btnSave) btnSave.addEventListener('click', closeModal);
        if(modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

        // --- AUDIO & DISPLAY SETTINGS RESTORATION ---
        const musicAudio = document.getElementById('bg-music');
        const musicSlider = document.getElementById('music-slider');
        const musicSelect = document.getElementById('music-select');
        const musicPercent = document.getElementById('music-percent');
        const colorBlindSelect = document.getElementById('colorblind-mode');

        const savedVolume = localStorage.getItem('kampungMusicVolume');
        const savedTrack = localStorage.getItem('kampungMusicTrack'); 

        // Restore Track
        let trackExists = false;
        if (savedTrack) {
            for (let i = 0; i < musicSelect.options.length; i++) {
                if (musicSelect.options[i].value === savedTrack) { trackExists = true; break; }
            }
        }
        if (savedTrack && trackExists) {
            musicSelect.value = savedTrack;
            musicAudio.src = savedTrack;
        } else {
            musicAudio.src = musicSelect.value;
        }

        // Restore Volume
        if (savedVolume !== null) {
            musicAudio.volume = parseFloat(savedVolume);
            musicSlider.value = savedVolume;
        } else {
            musicAudio.volume = 0.3; musicSlider.value = 0.3;
        }
        musicPercent.innerText = Math.round(musicSlider.value * 100) + '%';

        // Autoplay Logic
        if (musicAudio.volume > 0) {
            musicAudio.load(); 
            const playPromise = musicAudio.play();
            if (playPromise !== undefined) playPromise.catch(e => console.log("Autoplay blocked"));
        }

        // Restore Display Mode in Dropdown
        const currentDisplayMode = localStorage.getItem('kampungDisplayMode');
        if (currentDisplayMode) colorBlindSelect.value = currentDisplayMode;

        // --- EVENT LISTENERS (Audio & Display) ---
        musicSelect.addEventListener('change', function() {
            const selectedTrack = this.value;
            const isPlaying = !musicAudio.paused; 
            musicAudio.src = selectedTrack;
            localStorage.setItem('kampungMusicTrack', selectedTrack);
            if (isPlaying) musicAudio.play();
        });

        musicSlider.addEventListener('input', function() {
            const vol = this.value;
            musicAudio.volume = vol;
            musicPercent.innerText = Math.round(vol * 100) + '%';
            localStorage.setItem('kampungMusicVolume', vol);
            if (vol > 0 && musicAudio.paused) musicAudio.play();
            else if (vol == 0) musicAudio.pause();
        });

        colorBlindSelect.addEventListener('change', function() {
            const mode = this.value;
            document.documentElement.classList.remove('mode-protanopia', 'mode-deuteranopia', 'mode-tritanopia', 'mode-high-contrast', 'mode-kids', 'mode-readable');
            if (mode !== 'none') {
                document.documentElement.classList.add(mode);
            }
            localStorage.setItem('kampungDisplayMode', mode);
        });

        // --- SFX LOGIC ---
        const sfxClick = new Audio('assets/click.mp3'); 
        sfxClick.volume = 0.4; 
        const interactables = document.querySelectorAll('button, a, select, input[type="range"]');
        interactables.forEach(el => {
            el.addEventListener('click', () => {
                sfxClick.currentTime = 0; 
                sfxClick.play().catch(() => {});
            });
        });

        // --- RESET BUTTON ---
        const btnReset = document.getElementById('btn-reset-settings');
        if(btnReset) {
            btnReset.addEventListener('click', function() {
                if(confirm("Kembalikan semua tetapan ke asal?")) {
                    localStorage.clear(); 
                    location.reload(); 
                }
            });
        }
    }
});