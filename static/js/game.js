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
        if (this.isDarkMode) document.documentElement.classList.add('dark');
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

        // Reset Keyboard Colors (Light and Dark)
        document.querySelectorAll('.key').forEach(key => {
            key.className = 'key flex flex-1 items-center justify-center rounded m-0.5 font-bold cursor-pointer select-none h-14 bg-gray-200 text-black dark:bg-gray-600 dark:text-gray-100 active:bg-gray-400 dark:active:bg-gray-500 transition-colors duration-150';
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
                tile.className = 'tile w-full h-full border-2 border-[rgb(211,214,218)] dark:border-[#3a3a3c] flex items-center justify-center text-3xl font-bold uppercase select-none transition-all duration-200 tile-flip dark:text-[#f8f8f8] text-black';
                tile.id = `tile-${r}-${c}`;

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
        // Initial Key State: Light Gray (L) / Darker Gray (D)
        btn.className = `key flex flex-1 items-center justify-center rounded m-0.5 font-bold cursor-pointer select-none h-14 bg-gray-200 text-black dark:bg-[#818384] dark:text-white active:bg-gray-400 dark:active:bg-gray-600 transition-colors text-sm sm:text-base ${isSpecial ? 'flex-[1.5]' : ''}`;

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
            // (Skipping implementation details for brevity, but functional rules go here)
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

        // Logic for Green/Yellow/Gray
        const statuses = Array(5).fill('absent');
        const solutionCounts = {};

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
                    tile.classList.remove('border-gray-300', 'dark:border-gray-600', 'bg-white', 'dark:bg-transparent', 'text-black', 'dark:text-gray-100');
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

        const currentClass = keyBtn.className;
        let newClass = '';

        // We ensure text is ALWAYS white on colored keys for readability
        if (status === 'correct') {
            newClass = 'bg-wordle-correct text-white border-none';
        } else if (status === 'present' && !currentClass.includes('wordle-correct')) {
            newClass = 'bg-wordle-present text-white border-none';
        } else if (status === 'absent' && !currentClass.includes('wordle-correct') && !currentClass.includes('wordle-present')) {
            newClass = 'bg-wordle-absent text-white border-none';
        }

        if (newClass) {
            // Strip old bg
            keyBtn.className = `key flex flex-1 items-center justify-center rounded m-0.5 font-bold cursor-pointer select-none h-14 transition-colors text-sm sm:text-base ${newClass}`;
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

    showModal(contentHTML) {
        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = contentHTML;
        overlay.classList.remove('hidden');

        // Add close listener for overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        };
    }

    setupModals() {
        // Stats Button
        const statsBtn = document.querySelector('button[aria-label="Stats"]');
        if (statsBtn) statsBtn.addEventListener('click', () => this.showStats());

        // Menu Button (Help)
        const menuBtn = document.querySelector('button[aria-label="Menu"]');
        if (menuBtn) menuBtn.addEventListener('click', () => this.showHelp());

        // Settings Button
        const settingsBtn = document.querySelector('button[aria-label="Settings"]');
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
    }

    showHelp() {
        this.showModal(`
            <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-lg max-w-sm w-full shadow-2xl animate-pop relative">
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="absolute top-2 right-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">✕</button>
                <h2 class="text-2xl font-bold mb-4">How To Play</h2>
                <p class="mb-2">Guess the word in 6 tries.</p>
                <ul class="list-disc list-inside mb-4 text-sm">
                    <li>Each guess must be a valid 5-letter word.</li>
                    <li>The color of the tiles will change to show how close your guess was to the word.</li>
                </ul>
                <div class="flex gap-2 mb-2">
                    <div class="w-8 h-8 flex items-center justify-center bg-wordle-correct text-white font-bold border-2 border-transparent">W</div>
                    <div class="flex items-center text-xs">W is in the word and in the correct spot.</div>
                </div>
                <div class="flex gap-2 mb-2">
                    <div class="w-8 h-8 flex items-center justify-center bg-wordle-present text-white font-bold border-2 border-transparent">I</div>
                    <div class="flex items-center text-xs">I is in the word but in the wrong spot.</div>
                </div>
                <div class="flex gap-2 mb-4">
                    <div class="w-8 h-8 flex items-center justify-center bg-wordle-absent text-white font-bold border-2 border-transparent">U</div>
                    <div class="flex items-center text-xs">U is not in the word in any spot.</div>
                </div>
            </div>
        `);
    }

    showSettings() {
        this.showModal(`
            <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-lg max-w-sm w-full shadow-2xl animate-pop relative">
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="absolute top-2 right-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">✕</button>
                <h2 class="text-2xl font-bold mb-6 text-center">Settings</h2>
                
                <div class="flex justify-between items-center mb-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <div class="font-bold">Dark Mode</div>
                    </div>
                    <div>
                        <button id="toggle-dark" class="w-12 h-6 rounded-full p-1 transition-colors ${this.isDarkMode ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'} flex items-center">
                            <div class="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${this.isDarkMode ? 'translate-x-6' : ''}"></div>
                        </button>
                    </div>
                </div>

                <div class="flex justify-between items-center mb-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <div class="font-bold">High Contrast Mode</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">For better color vision</div>
                    </div>
                    <div>
                        <button id="toggle-contrast" class="w-12 h-6 rounded-full p-1 transition-colors ${this.isHighContrast ? 'bg-orange-500 justify-end' : 'bg-gray-300 justify-start'} flex items-center">
                            <div class="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${this.isHighContrast ? 'translate-x-6' : ''}"></div>
                        </button>
                    </div>
                </div>
                
                <div class="text-xs text-center text-gray-400 mt-4">
                    Unlimited Wordle v1.0
                </div>
            </div>
        `);

        document.getElementById('toggle-dark').addEventListener('click', () => {
            this.isDarkMode = !this.isDarkMode;
            // Tailwind requires 'dark' class on the HTML element, not body
            document.documentElement.classList.toggle('dark', this.isDarkMode);
            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
            this.showSettings(); // Re-render to update toggle state
            this.updateKeyboardColorsImmediately();
        });

        document.getElementById('toggle-contrast').addEventListener('click', () => {
            this.isHighContrast = !this.isHighContrast;
            document.body.classList.toggle('high-contrast', this.isHighContrast);
            this.showSettings(); // Re-render
            this.updateKeyboardColorsImmediately();
        });
    }

    updateKeyboardColorsImmediately() {
        // Helper to refresh classes if they need to change based on dark mode toggle
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            // Check if it has a status color
            const isColored = key.classList.contains('bg-wordle-correct') || key.classList.contains('bg-wordle-present') || key.classList.contains('bg-wordle-absent');
            if (!isColored) {
                key.className = 'key flex flex-1 items-center justify-center rounded m-0.5 font-bold cursor-pointer select-none h-14 bg-gray-200 text-black dark:bg-gray-600 dark:text-gray-100 active:bg-gray-400 dark:active:bg-gray-500 transition-colors duration-150 text-sm sm:text-base';
            }
        });
    }

    showStats() {
        this.showModal(`
            <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-6 rounded-lg max-w-sm w-full shadow-2xl animate-pop relative">
                <button onclick="document.getElementById('modal-overlay').classList.add('hidden')" class="absolute top-2 right-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">✕</button>
                <h2 class="text-2xl font-bold mb-4 text-center">Statistics</h2>
                <div class="flex justify-around mb-6 text-center">
                    <div><div class="text-3xl font-bold">${this.stats.gamesPlayed}</div><div class="text-xs uppercase">Played</div></div>
                    <div><div class="text-3xl font-bold">${Math.round((this.stats.wins / (this.stats.gamesPlayed || 1)) * 100)}</div><div class="text-xs uppercase">Win %</div></div>
                    <div><div class="text-3xl font-bold">${this.stats.currentStreak}</div><div class="text-xs uppercase">Streak</div></div>
                </div>
                
                <div class="mb-6">
                    <h3 class="font-bold mb-2 uppercase text-sm">Guess Distribution</h3>
                    ${this.stats.distribution.map((count, i) => `
                        <div class="flex items-center mb-1 text-xs font-bold">
                            <div class="w-4">${i + 1}</div>
                            <div class="bg-gray-500 text-white px-2 py-0.5" style="width: ${Math.max(5, (count / Math.max(...this.stats.distribution, 1)) * 100)}%">${count}</div>
                        </div>
                    `).join('')}
                </div>

                <button id="new-game-btn" class="w-full bg-green-600 dark:bg-green-700 text-white font-bold py-3 rounded uppercase tracking-wide hover:bg-green-700 dark:hover:bg-green-600 transition shadow-md">
                    New Game
                </button>
            </div>
        `);

        document.getElementById('new-game-btn').addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            this.startNewGame();
        });
    }

    loadSettings() {
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
