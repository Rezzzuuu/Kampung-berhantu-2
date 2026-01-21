// history.js - Logic for history page (Kampung Theme)

document.addEventListener('DOMContentLoaded', () => {
    loadHistoryFromStorage();
});

function loadHistoryFromStorage() {
    const container = document.getElementById('history-container');
    if(!container) return;
    
    // Read from LocalStorage
    let history = JSON.parse(localStorage.getItem('mw_history') || '[]');
    
    if(history.length === 0) {
        container.innerHTML = '<p class="text-center py-8 text-gray-500 italic">Tiada rekod permainan ditemui. Sila mulakan permainan baru!</p>';
        return;
    }
    
    // Render list (Newest first)
    container.innerHTML = history.reverse().map((game, i) => {
        // Tentukan warna berdasarkan pemenang
        const isEvilWin = game.winner && (game.winner.toLowerCase().includes('hantu') || game.winner.toLowerCase().includes('Pontianak'));
        const borderColor = isEvilWin ? 'border-red-800' : 'border-emerald-800';
        const bgColor = isEvilWin ? 'bg-red-950/20' : 'bg-emerald-950/20';
        const badgeColor = isEvilWin ? 'bg-red-900 text-red-100' : 'bg-emerald-900 text-emerald-100';
        
        return `
        <div class="p-4 border ${borderColor} ${bgColor} mb-3 relative overflow-hidden group hover:bg-black/40 transition-colors">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-title font-bold text-gray-200 text-lg uppercase tracking-wide">Permainan #${history.length - i}</h4>
                    <p class="text-xs text-gray-500 mt-1 font-mono">📅 ${game.date}</p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${badgeColor} border border-white/10">
                        ${game.winner}
                    </span>
                    <p class="text-xs text-gray-400 mt-2">
                        ${game.playerCount} Pemain • ${game.rounds} Pusingan
                    </p>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function printAllHistory() {
    const content = document.getElementById('history-container').innerHTML;
    const printArea = document.getElementById('print-content');
    if(printArea) {
        printArea.innerHTML = content;
        window.print();
    }
}