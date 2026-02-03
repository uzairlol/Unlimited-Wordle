import urllib.request
import os

SOLUTIONS_URL = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/shuffled_real_wordles.txt"
GUESSES_URL = "https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/official_allowed_guesses.txt"
OUTPUT_FILE = "d:/wordle/static/js/data.js"

def get_words(url):
    print(f"Downloading from {url}...")
    with urllib.request.urlopen(url) as response:
        data = response.read().decode('utf-8')
        # Filter empty lines and strip whitespace
        words = [w.strip() for w in data.splitlines() if w.strip()]
    return words

def main():
    try:
        solutions = get_words(SOLUTIONS_URL)
        guesses = get_words(GUESSES_URL)
        
        print(f"Downloaded {len(solutions)} solutions and {len(guesses)} allowed guesses.")
        
        # Format as JS file
        js_content = f"""// Authentic Wordle word lists sourced from Kinkelin/WordleCompetition
// Generated automatically

// {len(solutions)} Solution Words
const ANSWERS = "{' '.join(solutions)}".split(" ");

// {len(guesses)} Allowed Guesses
// (Combined, this allows for ~14k valid words)
const ALLOWED_GUESSES = "{' '.join(guesses)}".split(" ");
"""
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(js_content)
            
        print(f"Successfully wrote to {OUTPUT_FILE}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
