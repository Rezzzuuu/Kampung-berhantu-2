// --- CONFIGURATION ---
const teamData = [
    { 
        name: "ISMA ZAHIN BIN AMIRUDDIN", 
        id: "2025180017", 
        role: "Team Leader", 
        image: 'images/isma.png',
        stats: [5, 4, 2, 3, 3] 
    },
    { 
        name: "DANIAL FARHAN BIN MUHAMMAD FAISAL", 
        id: "2025140177", 
        role: "Front-end Developer", 
        image: 'images/farhan.png',
        stats: [3, 2, 4, 5, 2] 
    },
    { 
        name: "MUHAMMAD EIDLAN MUQRI BIN MUNIR", 
        id: "2025138129", 
        role: "Tester", 
        image: 'images/eidlan.jpeg',
        stats: [5, 5, 1, 5, 5] 
    },
    { 
        name: "MOHAMMAD AMARULHARIZ BIN MOHD FAIRUZ", 
        id: "2025301079", 
        role: "Tester", 
        image: 'images/amarul.png',
        stats: [2, 3, 5, 4, 5] 
    },
    { 
        name: "Nor Irfan Bin Nor Hisham", 
        id: "2025121363", 
        role: "Front-end Developer", 
        image: 'images/irfan.jpeg',
        stats: [4, 5, 2, 3, 4] 
    }
];

const statLabels = ["Skill", "Mentality", "Physicality", "Resilience", "Endurance"];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('team-container');
    if (!container) return;

    // Generate Team Grid
    container.innerHTML = teamData.map((member, index) => `
        <div onclick="openMember(${index})" class="team-member cursor-pointer w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-transparent transition-all duration-300 bg-black/50 relative group">
            <img src="${member.image}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="${member.name}">
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 font-bold text-emerald-400 bg-black/60 transition-all">
                LIHAT
            </div>
        </div>
    `).join('');
});

// --- ACTIONS ---

function openMember(index) {
    const person = teamData[index];
    const modal = document.getElementById('dev-modal');
    const cardInner = document.getElementById('card-inner');
    const statsContainer = document.getElementById('stats-container');

    // Reset Card Position
    cardInner.style.transform = "rotateY(0deg)";

    // Populate Data
    document.getElementById('modal-img').src = person.image;
    document.getElementById('modal-name').innerText = person.name;
    document.getElementById('modal-id').innerText = person.id;
    document.getElementById('modal-class').innerText = person.role;

    // Generate Stars
    statsContainer.innerHTML = person.stats.map((val, i) => {
        const stars = '⭐'.repeat(val) + '<span class="opacity-20">' + '⭐'.repeat(5 - val) + '</span>';
        return `
            <div class="flex justify-between items-center">
                <span class="text-emerald-500 uppercase text-xs tracking-wider">${statLabels[i]}</span>
                <div class="text-gold text-xs">${stars}</div>
            </div>
        `;
    }).join('');

    // Show Modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    const modal = document.getElementById('dev-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function flipCard() {
    const card = document.getElementById('card-inner');
    if (card.style.transform === "rotateY(180deg)") {
        card.style.transform = "rotateY(0deg)";
    } else {
        card.style.transform = "rotateY(180deg)";
    }
}

// Close modal when clicking outside the card
window.onclick = function(event) {
    const modal = document.getElementById('dev-modal');
    if (event.target === modal) {
        closeModal();
    }

}
