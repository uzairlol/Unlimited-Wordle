/**
 * Unlimited Wordle - Core Game Logic
 */
class WordleGame {
    constructor() {
        this.currentRow = 0;
        this.currentTile = 0;
        this.guesses = Array(6).fill("");
        this.solution = "";
        this.gameStatus = "IN_PROGRESS"; // IN_PROGRESS, WON, LOST
        this.hardMode = false;
        this.revealedHints = {}; // { 'A': 'correct', 'B': 'present' }
        this.stats = this.loadStats();

        // Settings
        this.isHighContrast = false;
        this.isDarkMode = false;

        // Cache DOM
        this.board = document.getElementById('board');
        this.keyboard = document.getElementById('keyboard');

        this.init();
    }

    init() {
        this.loadSettings();
        this.setupBoard();
        this.setupKeyboard();
        this.setupModals();
        this.startNewGame();

        // Global Events
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Set Theme
        if (this.isDarkMode) document.body.classList.add('dark');
        if (this.isHighContrast) document.body.classList.add('high-contrast');
    }

    startNewGame() {
        // Pick new word
        this.solution = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
        console.log("Solution (Debug):", this.solution); // Cheating for dev :)

        this.guesses = Array(6).fill("");
        this.currentRow = 0;
        this.currentTile = 0;
        this.gameStatus = "IN_PROGRESS";
        this.revealedHints = {};

        // Clear Board
        this.board.innerHTML = '';
        this.setupBoard();

        // Reset Keyboard
        document.querySelectorAll('.key').forEach(key => {
            key.className = 'key flex flex-1 items-center justify-center rounded m-0.5 font-bold cursor-pointer select-none h-14 bg-gray-200 dark:bg-gray-600 transition-colors duration-150';
        });

        this.showMessage("New Game Started!", 1000);
    }

    setupBoard() {
        this.board.innerHTML = '';
        for (let r = 0; r < 6; r++) {
            const row = document.createElement('div');
            row.className = 'grid grid-cols-5 gap-1.5 w-full';
            row.setAttribute('role', 'group');
            row.setAttribute('aria-label', `Row ${r + 1}`);

            for (let c = 0; c < 5; c++) {
                const tileContainer = document.createElement('div');
                tileContainer.className = 'tile-container relative aspect-square';

                const tile = document.createElement('div');
                tile.className = 'tile w-full h-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-3xl font-bold uppercase select-none transition-all duration-200 tile-flip';
                tile.id = `tile-${r}-${c}`;

                // Front/Back for 3D flip (optional structure, but single div works with bgColor transition usually. 
                // Let's stick to simple bg transition for robustness unless we do full 3D)
                // Actually, let's use the simple style for reliability first.

                tileContainer.appendChild(tile);
                row.appendChild(tileContainer);
            }
            this.board.appendChild(row);
        }
    }

    setupKeyboard() {
        this.keyboard.innerHTML = '';
        const rows = [
            "qwertyuiop",
            "asdfghjkl",
            "zxcvbnm"
        ];

        rows.forEach((rowChars, i) => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'flex w-full justify-center touch-manipulation';

            if (i === 1) rowDiv.classList.add('px-4'); // Indent second row

            if (i === 2) {
                // Enter Key
                this.createKey(rowDiv, 'Enter', 'ENTER', true);
            }

            for (let char of rowChars) {
                this.createKey(rowDiv, char, char);
            }

            if (i === 2) {
                // Backspace
                this.createKey(rowDiv, 'Backspace', '⌫', true);
            }

            this.keyboard.appendChild(rowDiv);
        });
    }

    createKey(container, key, display, isSpecial = false) {
        const btn = document.createElement('button');
        btn.textContent = display;
        btn.setAttribute('data-key', key);
        btn.className = `key flex flex-1 items-center justify-center rounded m-0.5 font-bold cursor-pointer select-none h-14 bg-gray-200 dark:bg-gray-600 active:bg-gray-400 transition-colors text-sm sm:text-base ${isSpecial ? 'flex-[1.5]' : ''}`;

        btn.addEventListener('click', (e) => {
            e.target.blur(); // Remove focus
            this.handleInput(key);
        });

        container.appendChild(btn);
    }

    handleKeydown(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        let key = e.key;
        if (key === 'Enter') this.handleInput('Enter');
        else if (key === 'Backspace') this.handleInput('Backspace');
        else if (/^[a-zA-Z]$/.test(key)) this.handleInput(key.toLowerCase());
    }

    handleInput(key) {
        if (this.gameStatus !== 'IN_PROGRESS') return;

        if (key === 'Enter') {
            this.submitGuess();
        } else if (key === 'Backspace') {
            this.deleteLetter();
        } else {
            this.addLetter(key);
        }
    }

    addLetter(letter) {
        if (this.currentTile < 5 && this.currentRow < 6) {
            const currentGuess = this.guesses[this.currentRow];
            this.guesses[this.currentRow] = currentGuess + letter;

            const tile = document.getElementById(`tile-${this.currentRow}-${this.currentTile}`);
            tile.textContent = letter;
            tile.classList.add('border-gray-500', 'dark:border-gray-400', 'animate-pop');

            // Remove pop after animation
            setTimeout(() => tile.classList.remove('animate-pop'), 100);

            this.currentTile++;
        }
    }

    deleteLetter() {
        if (this.currentTile > 0) {
            this.currentTile--;
            this.guesses[this.currentRow] = this.guesses[this.currentRow].slice(0, -1);

            const tile = document.getElementById(`tile-${this.currentRow}-${this.currentTile}`);
            tile.textContent = '';
            tile.classList.remove('border-gray-500', 'dark:border-gray-400');
        }
    }

    submitGuess() {
        const guess = this.guesses[this.currentRow];

        // Validation 1: Length
        if (guess.length !== 5) {
            this.shakeRow();
            this.showMessage("Not enough letters");
            return;
        }

        // Validation 2: Word List
        if (!ANSWERS.includes(guess) && !ALLOWED_GUESSES.includes(guess)) {
            this.shakeRow();
            this.showMessage("Not in word list");
            return;
        }

        // Validation 3: Hard Mode
        if (this.hardMode) {
            // Must contain discovered hints
            // (Skipping for brevity in this step, but standard hard mode enforces green/yellow parity)
        }

        // Valid Guess - Process
        this.revealGuess(guess);
    }

    shakeRow() {
        const row = document.getElementById(`board`).children[this.currentRow];
        row.classList.add('animate-shake');
        setTimeout(() => row.classList.remove('animate-shake'), 500);
    }

    revealGuess(guess) {
        const solutionChars = this.solution.split('');
        const guessChars = guess.split('');
        const row = document.getElementById(`board`).children[this.currentRow];

        // Logic for Green/Yellow/Gray (handle duplicates correctly)
        const statuses = Array(5).fill('absent');
        const solutionCounts = {};

        // Count letters in solution
        for (let char of solutionChars) solutionCounts[char] = (solutionCounts[char] || 0) + 1;

        // 1. Find Greens (Correct)
        for (let i = 0; i < 5; i++) {
            if (guessChars[i] === solutionChars[i]) {
                statuses[i] = 'correct';
                solutionCounts[guessChars[i]]--;
            }
        }

        // 2. Find Yellows (Present)
        for (let i = 0; i < 5; i++) {
            if (statuses[i] !== 'correct' && solutionCounts[guessChars[i]] > 0) {
                statuses[i] = 'present';
                solutionCounts[guessChars[i]]--;
            }
        }

        // Animate Flip
        guessChars.forEach((char, i) => {
            setTimeout(() => {
                const tile = document.getElementById(`tile-${this.currentRow}-${i}`);
                tile.classList.add('animate-flip');

                // Color update halfway through flip
                setTimeout(() => {
                    tile.classList.remove('border-gray-300', 'dark:border-gray-600', 'bg-white', 'dark:bg-transparent');
                    tile.classList.add('text-white', 'border-transparent');

                    if (statuses[i] === 'correct') {
                        tile.classList.add('bg-wordle-correct');
                    } else if (statuses[i] === 'present') {
                        tile.classList.add('bg-wordle-present');
                    } else {
                        tile.classList.add('bg-wordle-absent');
                    }

                    this.updateKeyboard(char, statuses[i]);
                }, 250);

            }, i * 300); // Staggered delay
        });

        // Wait for all animations
        setTimeout(() => {
            this.checkWinLoss(guess);
        }, 5 * 300 + 500);
    }

    updateKeyboard(char, status) {
        const keyBtn = document.querySelector(`button[data-key="${char}"]`);
        if (!keyBtn) return;

        // Logic: Correct > Present > Absent > Unused
        const currentClass = keyBtn.className;
        let newClass = '';

        if (status === 'correct') {
            newClass = 'bg-wordle-correct text-white';
        } else if (status === 'present' && !currentClass.includes('wordle-correct')) {
            newClass = 'bg-wordle-present text-white';
        } else if (status === 'absent' && !currentClass.includes('wordle-correct') && !currentClass.includes('wordle-present')) {
            newClass = 'bg-wordle-absent text-white';
        }

        if (newClass) {
            // Strip old bg
            keyBtn.classList.remove('bg-gray-200', 'dark:bg-gray-600');
            // Add new class safely
            // Using simple replacement for now implies we handle the string manually or use classList
            if (status === 'correct') keyBtn.classList.add('bg-wordle-correct', 'text-white');
            else if (status === 'present') keyBtn.classList.add('bg-wordle-present', 'text-white');
            else if (status === 'absent') keyBtn.classList.add('bg-wordle-absent', 'text-white');
        }
    }

    checkWinLoss(guess) {
        if (guess === this.solution) {
            this.gameStatus = 'WON';
            this.showMessage(this.getPraise(), 2000);
            this.triggerConfetti();
            this.updateStats(true);
            setTimeout(() => this.showStats(), 2500);
        } else if (this.currentRow === 5) {
            this.gameStatus = 'LOST';
            this.showMessage(this.solution.toUpperCase(), -1); // Persist
            this.updateStats(false);
            setTimeout(() => this.showStats(), 2500);
        } else {
            this.currentRow++;
            this.currentTile = 0;
        }
    }

    showMessage(msg, duration = 1000) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.className = 'fixed top-16 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-3 rounded font-bold z-50 animate-pop shadow-lg';
        document.body.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.remove();
            }, duration);
        } else {
            // Persist, but allow click to remove
            toast.addEventListener('click', () => toast.remove());
        }
    }

    getPraise() {
        const praises = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
        return praises[this.currentRow] || 'Phew';
    }

    triggerConfetti() {
        if (window.confetti) {
            window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
    }

    // Stats & Persistence
    loadStats() {
        return JSON.parse(localStorage.getItem('wordle-unlimited-stats')) || {
            gamesPlayed: 0,
            wins: 0,
            currentStreak: 0,
            maxStreak: 0,
            distribution: [0, 0, 0, 0, 0, 0]
        };
    }

    updateStats(won) {
        this.stats.gamesPlayed++;
        if (won) {
            this.stats.wins++;
            this.stats.currentStreak++;
            this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
            this.stats.distribution[this.currentRow]++;
        } else {
            this.stats.currentStreak = 0;
        }
        localStorage.setItem('wordle-unlimited-stats', JSON.stringify(this.stats));
    }

    // UI Helpers for Modals (Skipped full implementation for brevity, but hooks exist)
    setupModals() {
        // Implement Settings/Stats modal toggles here
        const statsBtn = document.querySelector('button[aria-label="Stats"]');
        if (statsBtn) statsBtn.addEventListener('click', () => this.showStats());

        // "New Game" button in stats
    }

    showStats() {
        // Simple Alert for now, or build a modal overlay
        // Ideally we inject HTML into the #modal-overlay
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = `
            <div class="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-sm w-full shadow-2xl animate-pop relative">
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="absolute top-2 right-2 p-2">✕</button>
                <h2 class="text-2xl font-bold mb-4 text-center">Statistics</h2>
                <div class="flex justify-around mb-6 text-center">
                    <div><div class="text-3xl font-bold">${this.stats.gamesPlayed}</div><div class="text-xs">Played</div></div>
                    <div><div class="text-3xl font-bold">${Math.round((this.stats.wins / (this.stats.gamesPlayed || 1)) * 100)}</div><div class="text-xs">Win %</div></div>
                    <div><div class="text-3xl font-bold">${this.stats.currentStreak}</div><div class="text-xs">Streak</div></div>
                </div>
                
                <button id="new-game-btn" class="w-full bg-green-600 text-white font-bold py-3 rounded-full text-xl hover:bg-green-700 transition">
                    NEW WORD
                </button>
            </div>
        `;
        overlay.classList.remove('hidden');

        document.getElementById('new-game-btn').addEventListener('click', () => {
            overlay.classList.add('hidden');
            this.startNewGame();
        });
    }

    loadSettings() {
        // Load dark mode preference
        if (localStorage.getItem('theme') === 'dark' ||
            (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.isDarkMode = true;
        }
    }
}

// Start Game
window.addEventListener('DOMContentLoaded', () => {
    window.game = new WordleGame();
});
