/**
 * Wordle Solver & Inference Logic
 */
class WordleSolver {
    constructor(answers, allowedGuesses) {
        this.allAnswers = answers; // The ~2.3k solution list
        this.allGuesses = allowedGuesses; // The ~10k extra guesses
        // Combine for full dictionary
        this.fullDictionary = [...this.allAnswers, ...this.allGuesses];
        this.reset();
    }

    reset() {
        // We only track *possible solutions* for the game state, 
        // because Wordle answers always come from the solution list.
        this.candidates = [...this.allAnswers];
        this.history = [];
        this.initialEntropy = Math.log2(this.allAnswers.length);
    }

    /**
     * Updates the solver state with a new guess and feedback.
     * @param {string} guess - The word guessed (uppercase or lowercase)
     * @param {Array<string>} feedback - Array of 5 statuses: 'correct', 'present', 'absent'
     */
    update(guess, feedback) {
        guess = guess.toLowerCase();

        // 1. Filter candidates
        const previousCount = this.candidates.length;
        this.candidates = this.filterCandidates(this.candidates, guess, feedback);
        const newCount = this.candidates.length;

        // 2. Calculate stats
        // Reduction: How much did we narrow it down?
        const reduction = previousCount > 0 ? ((previousCount - newCount) / previousCount) * 100 : 0;

        // Bits of information gained (Entropy reduction)
        // Check if newCount is 0 to avoid -Infinity
        const currentEntropy = newCount > 0 ? Math.log2(newCount) : 0;
        const previousEntropy = previousCount > 0 ? Math.log2(previousCount) : 0;
        const bitsGained = Math.max(0, previousEntropy - currentEntropy);

        this.history.push({
            guess,
            feedback,
            candidatesAfter: newCount,
            bitsGained,
            reduction
        });

        return {
            candidatesCount: newCount,
            reduction,
            bitsGained
        };
    }

    /**
     * Filters a list of words based on guess and feedback.
     */
    filterCandidates(list, guess, feedback) {
        return list.filter(word => {
            // Check if 'word' is consistent with 'feedback' for 'guess'
            // We simulate what feedback 'word' would give if it were the solution.
            // If it matches the actual feedback, it's a candidate.
            const simulatedFeedback = this.evaluateGuess(guess, word);
            return this.feedbackMatches(feedback, simulatedFeedback);
        });
    }

    /**
     * Generates feedback for a guess against a specific solution.
     * Returns array of 'correct', 'present', 'absent'.
     */
    evaluateGuess(guess, solution) {
        const feedback = Array(5).fill('absent');
        const solutionChars = solution.split('');
        const guessChars = guess.split('');

        // Track used letters in solution to handle duplicates correctly
        const solutionCounts = {};
        for (const char of solutionChars) {
            solutionCounts[char] = (solutionCounts[char] || 0) + 1;
        }

        // 1. Correct (Green)
        for (let i = 0; i < 5; i++) {
            if (guessChars[i] === solutionChars[i]) {
                feedback[i] = 'correct';
                solutionCounts[guessChars[i]]--;
            }
        }

        // 2. Present (Yellow)
        for (let i = 0; i < 5; i++) {
            if (feedback[i] === 'absent') { // Only check if not already green
                if (solutionCounts[guessChars[i]] > 0) {
                    feedback[i] = 'present';
                    solutionCounts[guessChars[i]]--;
                }
            }
        }

        return feedback;
    }

    feedbackMatches(actual, simulated) {
        for (let i = 0; i < 5; i++) {
            if (actual[i] !== simulated[i]) return false;
        }
        return true;
    }

    /**
     * Calculates the "Risk" of a guess.
     * Risk is defined by how much information (entropy) this specific guess typically reveals
     * compared to the *optimal* guess at this stage.
     * 
     * Since calculating E[Info] for ALL words is slow, we use a heuristic:
     * - We calculate the Expected Information of the USER'S guess.
     * - We compare it to a baseline "Good" entropy (~4-5 bits for good openers).
     * 
     * @param {string} guess 
     * @returns {object} { expectedBits, riskLevel }
     */
    calculateRisk(guess) {
        // If we have very few candidates, risk is irrelevant (just solve it)
        if (this.candidates.length <= 2) return { riskLevel: 'Safe', expectedBits: 0 };

        // 1. Calculate Expected Information (Entropy) of THIS guess
        // Sum(p(pattern) * bits(pattern)) over all possible patterns
        // Optimization: limit solution sample if > 100 candidates to stay fast
        const sampleSize = Math.min(this.candidates.length, 200);
        let sample = this.candidates;

        // Random sample if too large
        if (this.candidates.length > sampleSize) {
            sample = [];
            const step = Math.floor(this.candidates.length / sampleSize);
            for (let i = 0; i < this.candidates.length; i += step) {
                sample.push(this.candidates[i]);
                if (sample.length >= sampleSize) break;
            }
        }

        const patternCounts = {};

        for (const sol of sample) {
            const feedback = this.evaluateGuess(guess, sol);
            const patternKey = feedback.join(',');
            patternCounts[patternKey] = (patternCounts[patternKey] || 0) + 1;
        }

        let expectedBits = 0;
        for (const key in patternCounts) {
            const p = patternCounts[key] / sample.length;
            const bits = -Math.log2(p);
            expectedBits += p * bits;
        }

        // 2. Determine Risk Level
        // A "safe" guess usually splits the space well (high entropy).
        // A "risky" guess might be right but often gives 0 info (low entropy).
        // Max possible entropy is log2(candidates).
        // Good guesses usually have > 50% of max entropy.

        const maxPossibleBits = Math.log2(this.candidates.length);
        const ratio = expectedBits / maxPossibleBits;

        let riskLevel = "Normal";
        if (ratio > 0.7) riskLevel = "Optimal";
        else if (ratio > 0.4) riskLevel = "Conservative";
        else riskLevel = "Aggressive"; // Low info, hoping for a lucky hit

        // Special case: If guess is in candidates, it's "Aggressive" but potentially "Lucky"
        if (this.candidates.includes(guess) && ratio < 0.4) {
            riskLevel = "To The Point"; // Trying to solve directly
        }

        return { riskLevel, expectedBits: expectedBits.toFixed(2) };
    }

    /**
     * Simulates an optimal bot playing from the current state (or scratch).
     * Used for "End Game" comparison.
     * WARNING: Heavy computation. Use sparingly (e.g., end of game).
     */
    runBotSimulation(targetWord) {
        const botHistory = [];
        let botCandidates = [...this.allAnswers]; // Bot knows the answer list
        let guesses = 0;
        const maxGuesses = 6;

        // Bot Strategy:
        // 1. First guess: "TRACE" (Standard high-entropy opener)
        // 2. Subsequent: Pick candidate that maximizes entropy (greedy).
        //    Optimization: Check entropy of top 50 candidates only.

        let currentGuess = "trace";

        while (guesses < maxGuesses) {
            guesses++;

            // Generate feedback for current guess
            const feedback = this.evaluateGuess(currentGuess, targetWord);
            botHistory.push({ guess: currentGuess, feedback, candidatesMatches: botCandidates.length });

            if (currentGuess === targetWord) {
                break; // Won
            }

            // Filter
            botCandidates = this.filterCandidates(botCandidates, currentGuess, feedback);

            if (botCandidates.length === 0) break; // Should not happen if target is valid
            if (botCandidates.length === 1) {
                currentGuess = botCandidates[0];
                continue;
            }

            // Pick next best guess
            // For speed in JS, we just pick the first candidate or a simple heuristic
            // Calculating full entropy for all 2.3k words is too slow here (nested loops).
            // We'll use a simplified heuristic:
            // "Pick a word from candidates that eliminates common letters"
            // Actually, for < 500 candidates, we can do full entropy on the candidates themselves.
            // If > 500, just pick one at random or heuristic.

            if (botCandidates.length <= 100) {
                currentGuess = this.getBestEntropyGuess(botCandidates, botCandidates);
            } else {
                // Fast fallback: pick a word with common remaining letters
                // For now, just pick the middle one to simulate "searching"
                currentGuess = botCandidates[Math.floor(botCandidates.length / 2)];
            }
        }

        return { guesses, history: botHistory };
    }

    getBestEntropyGuess(searchSpace, candidateUniverse) {
        let bestWord = searchSpace[0];
        let maxE = -1;

        for (const word of searchSpace) {
            let entropy = 0;
            const counts = {};
            for (const cand of candidateUniverse) {
                const pat = this.evaluateGuess(word, cand).join(',');
                counts[pat] = (counts[pat] || 0) + 1;
            }
            for (const k in counts) {
                const p = counts[k] / candidateUniverse.length;
                entropy += -p * Math.log2(p);
            }

            if (entropy > maxE) {
                maxE = entropy;
                bestWord = word;
            }
        }
        return bestWord;
    }
}
