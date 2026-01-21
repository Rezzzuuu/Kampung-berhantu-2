document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const evilRoster = document.getElementById('evil-roster');
    const goodRoster = document.getElementById('good-roster');
    const infoDefault = document.getElementById('info-default');
    const infoActive = document.getElementById('info-active');
    const elBadge = document.getElementById('info-badge');
    const elVisualContainer = document.getElementById('info-visual-container');
    const centerContainer = document.getElementById('center-container'); // Added for scroll reference
    const elName = document.getElementById('info-name');
    const elDesc = document.getElementById('info-desc');
    const elAbility = document.getElementById('info-ability');
    
    const elSkinThumbs = document.getElementById('skin-thumbnails');
    const elSkinLabel = document.getElementById('skin-name-label');
    const btnPrev = document.getElementById('btn-stack-prev');
    const btnNext = document.getElementById('btn-stack-next');

    // --- CONFIGURATION ---
    const ROLE_IMAGES = {
        Pontianak: 'images/pontianak1.png',
        villager: 'images/orang_kampung_mytic.png',
        Bomoh: 'images/bomoh.png',
        Ustaz: 'images/ustaz.png',
        Pendekar: 'images/pendekar.png',
        cupid: 'images/MakANDAM.png',
        witch: 'images/nenek2.png',
        mayor: 'images/ketuaBiasa.png',
        hantu_raya: 'images/HantuRaya.png',
        pelesit: 'images/pelesitNormal.png',
        bajang: 'images/sakaBiasa.png'
    };

    const ROLE_SKINS = {
        villager: [
            { name: "Mythic", img: "images/orang_kampung_mytic.png" },
            { name: "Mythic Color", img: "images/orang_kampung_mytic(color_version).png" }, 
            { name: "Legend", img: "images/orang_kampung_legend.png" }, 
            { name: "Legend Color", img: "images/Soldier.png" },
            { name: "Collab", img: "images/Pelajar.png" },
            { name: "Collab Terminator", img: "images/TerminatorPremium.png" },
            { name: "Collab Terminator(Color)", img: "images/TerminatorBerdiri.png" }
        ],
        Pontianak: [
            { name: "Asal", img: "images/pontianak1.png" },
            { name: "Common", img: "images/pontianak_biasa.png" }
        ],
        Pendekar: [
            { name: "Asal", img: "images/Pendekar.png" },
            { name: "Collector", img: "images/PendekarPremium.png" }
        ],
        pelesit: [
            { name: "Asal", img: "images/PelesitNormal.png" },
            { name: "Collector", img: "images/PelesitBotak.png" }
        ],
        mayor: [
        { name: "Asal", img: "images/KetuaBiasa.png" },
        { name: "Collector", img: "images/KetuaTua.png" },
        { name: "Collector", img: "images/KetuaPremium.png" }
        ],
        bajang: [
        { name: "Asal", img: "images/SakaBiasa.png" },
        { name: "Collector", img: "images/SakaTua.png" }
        ],
        Bomoh: [
        { name: "Asal", img: "images/Bomoh.png" }
        ],
        witch: [
        { name: "Asal", img: "images/Nenek2.png" },
        { name: "Epik", img: "images/Nenek1.png" }
        ],
        cupid: [
        { name: "Asal", img: "images/MakANDAM.png" },
        { name: "Warna", img: "images/MakAndam2.png" }
        ],
        
        hantu_raya: [
        { name: "Asal", img: "images/HantuRaya.png" },
        { name: "Elit", img: "images/HantuRaya2.png"},
        ],
        Ustaz: [
            { name: "Asal", img: "images/Ustaz.png"},
            { name: "Elit", img: "images/Ustaz1.png"}
        ]
    };

    let currentSkinIndex = 0; 

    // --- INITIALIZATION ---
    if (typeof ROLES === 'undefined') {
        console.error("ROLES object is missing! Make sure common.js is loaded.");
        return;
    }

    const roleKeys = Object.keys(ROLES);

    // Build Roster Lists
    roleKeys.forEach(key => {
        const role = ROLES[key];
        const isEvil = role.team === 'evil';
        const card = document.createElement('div');
        
        // Dynamic Border Colors
        const borderClass = isEvil 
            ? 'border-red-900/30 hover:bg-red-900/10' 
            : 'border-emerald-900/30 hover:bg-emerald-900/10';
        
        // Layout: Left align always for cleaner list on both mobile/desktop, or switch based on logic
        card.className = `char-card cursor-pointer flex items-center gap-3 p-2 rounded-lg border border-transparent ${borderClass} text-left`;
        
        const customImage = ROLE_IMAGES[key];
        
        card.innerHTML = `
            <div class="w-10 h-14 md:w-12 md:h-16 rounded overflow-hidden shadow-md border border-white/20 shrink-0 bg-black">
                ${customImage 
                    ? `<img src="${customImage}" class="avatar-img">` 
                    : `<div class="w-full h-full flex items-center justify-center text-xl md:text-2xl">${role.emoji}</div>`}
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-title font-bold text-xs md:text-sm ${isEvil ? 'text-red-400' : 'text-emerald-400'} uppercase truncate">${role.name}</h3>
            </div>
        `;

        // --- CLICK EVENT: OPEN CHARACTER DETAILS ---
        card.addEventListener('click', () => {
            // 1. Switch UI State
            infoDefault.classList.add('hidden');
            infoActive.classList.remove('hidden');
            elVisualContainer.innerHTML = ''; // Clear old stack

            // MOBILE FIX: Scroll to the details section smoothly
            // Check if we are on mobile (stack layout)
            if (window.innerWidth < 768) {
                centerContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // 2. Populate Text Data
            elName.innerText = role.name;
            elDesc.innerText = role.description;
            elAbility.innerHTML = getRoleAbilityDesc(key);
            
            // 3. Theme Styling (Red vs Emerald)
            const themeColor = isEvil ? 'red' : 'emerald';
            
            // Update Badge
            elBadge.innerText = isEvil ? "PASUKAN HANTU" : "PASUKAN KAMPUNG";
            // Removed specific color classes string manipulation to be safer
            elBadge.className = `inline-block px-6 md:px-8 py-1 md:py-2 mb-4 md:mb-8 rounded text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] border border-${themeColor}-800 text-${themeColor}-300 bg-${themeColor}-950/50 shadow-lg transition-all duration-300`;
            
            // Update Name Color
            elName.className = `font-title text-3xl md:text-5xl font-bold text-${themeColor}-500 mb-2 md:mb-4 uppercase drop-shadow-lg leading-none`;

            // Update Skin Label Color
            elSkinLabel.className = `font-title text-[10px] md:text-[12px] uppercase tracking-[0.3em] font-bold text-${themeColor}-400`;

            // 4. Setup Skin Stack System
            const skins = ROLE_SKINS[key] || [{ name: "Default", img: ROLE_IMAGES[key] }];
            currentSkinIndex = 0;

            const renderStack = () => {
                let existingItems = elVisualContainer.querySelectorAll('.card-stack-item');
                
                // Init items if first run
                if (existingItems.length === 0) {
                    skins.forEach((skin) => {
                        const item = document.createElement('div');
                        item.className = 'card-stack-item';
                        item.innerHTML = skin.img 
                            ? `<img src="${skin.img}" class="w-full h-full object-cover">` 
                            : `<div class="w-full h-full flex items-center justify-center text-6xl md:text-9xl">${role.emoji}</div>`;
                        elVisualContainer.appendChild(item);
                    });
                    existingItems = elVisualContainer.querySelectorAll('.card-stack-item');
                }

                // Apply Classes for 3D Effect
                existingItems.forEach((item, i) => {
                    item.classList.remove('card-active', 'card-prev', 'card-next', 'card-hidden');
                    
                    if (i === currentSkinIndex) {
                        item.classList.add('card-active');
                    } else if (i === (currentSkinIndex - 1 + skins.length) % skins.length) {
                        item.classList.add('card-prev');
                    } else if (i === (currentSkinIndex + 1) % skins.length) {
                        item.classList.add('card-next');
                    } else {
                        item.classList.add('card-hidden');
                    }
                });

                elSkinLabel.innerText = skins[currentSkinIndex].name;
                
                // Update Thumbnail Active State
                document.querySelectorAll('.skin-thumb').forEach((t, i) => {
                    t.classList.toggle('active', i === currentSkinIndex);
                    // Reset specific colors then apply correct one
                    t.classList.remove('skin-thumb-evil', 'skin-thumb-good');
                    t.classList.add(isEvil ? 'skin-thumb-evil' : 'skin-thumb-good');
                });
            };

            // 5. Generate Thumbnails
            elSkinThumbs.innerHTML = '';
            skins.forEach((skin, i) => {
                const thumb = document.createElement('div');
                thumb.className = `skin-thumb w-8 h-12 md:w-10 md:h-14 border rounded overflow-hidden cursor-pointer shrink-0`;
                thumb.innerHTML = `<img src="${skin.img}" class="w-full h-full object-cover">`;
                thumb.onclick = () => { currentSkinIndex = i; renderStack(); };
                elSkinThumbs.appendChild(thumb);
            });

            // 6. Bind Buttons
            btnPrev.onclick = () => { 
                currentSkinIndex = (currentSkinIndex - 1 + skins.length) % skins.length; 
                renderStack(); 
            };
            btnNext.onclick = () => { 
                currentSkinIndex = (currentSkinIndex + 1) % skins.length; 
                renderStack(); 
            };

            // Run initial render
            renderStack();
        });

        // Append to appropriate list
        if(isEvil) evilRoster.appendChild(card);
        else goodRoster.appendChild(card);
    });
});

// Helper Function
function getRoleAbilityDesc(key) {
    const details = {
        Pontianak: "Setiap malam, Pontianak akan memilih satu mangsa untuk dibaham.",
        hantu_raya: "Penyokong hantu. Melindungi identiti Pontianak.",
        pelesit: "Boleh mengimbas pemain untuk status kuasa.",
        bajang: "Akan kelihatan sebagai 'Baik' jika diimbas.",
        Bomoh: "Melihat identiti sebenar satu pemain.",
        Ustaz: "Menyelamatkan satu pemain daripada serangan.",
        villager: "Bincang dan undi hantu keluar.",
        Pendekar: "Membunuh satu pemain lain jika dia mati.",
        cupid: "Menjadikan dua pemain Pasangan Kekasih.",
        witch: "Mempunyai Ramuan Penawar dan Racun.",
        mayor: "Undian dikira sebagai 2 mata."
    };
    return details[key] || "Tiada info lanjut.";
}