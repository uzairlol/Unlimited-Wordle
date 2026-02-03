
    // ... inside WordleGame class ...

    // Add this method to fetch definition
    async fetchDefinition(word) {
    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const firstMeaning = data[0].meanings[0];
            const partOfSpeech = firstMeaning.partOfSpeech;
            const definition = firstMeaning.definitions[0].definition;

            this.showDefinition(`${word} (${partOfSpeech}): ${definition}`);
        } else {
            this.showDefinition(`${word}: Definition not found.`);
        }
    } catch (error) {
        console.error("Dict Error:", error);
        // Fail silently or clear
    }
}

showDefinition(text) {
    const container = document.getElementById('definition-container');
    const textEl = document.getElementById('definition-text');

    textEl.textContent = text;
    container.classList.remove('opacity-0');

    // Hide after 6 seconds (or just leave it until next guess?)
    // User asked "for all attempts", implies it might stay visible or update. 
    // Let's leave it visible until next guess updates it.
}
