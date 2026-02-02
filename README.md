# Unlimited Wordle 🟩🟨⬜

An enhanced, unlimited version of the classic Wordle game. Play as many times as you want, track your stats, and enjoy a polished, mobile-first experience.

![Wordle Preview](https://raw.githubusercontent.com/kinkelin/WordleCompetition/main/data/official/wordle_logo_192x192.png) 
*(Replace with your own screenshot after deployment)*

## ✨ Features

- **Unlimited Gameplay**: No daily limits. Click "New Word" to play forever.
- **Authentic Rules**: Uses the original Wordle dictionary (2,300+ solutions, 12,000+ allowed guesses).
- **Persistent Stats**: Tracks your Win %, Streak, and Guess Distribution (saved locally).
- **Smooth Animations**: Satisfying tile flips, shake effects, and winning confetti.
- **PWA Ready**: Installable on mobile/desktop for offline play.
- **Themes**: System-aware Light/Dark mode and High Contrast support.

## 🛠️ Tech Stack

- **Backend**: Python (Flask) - serve statics & HTML.
- **Frontend**: Vanilla JavaScript (ES6+), optimized for performance.
- **Styling**: Tailwind CSS (via CDN) + Custom CSS3 Animations.
- **Data**: Embedded authentic word lists (no external API calls required).

## 🚀 How to Run Locally

1.  **Clone the repository** (or download files):
    ```bash
    git clone https://github.com/YOUR_USER/Unlimited-Wordle.git
    cd Unlimited-Wordle
    ```

2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the App**:
    ```bash
    python app.py
    ```

4.  **Play**:
    Open your browser to `http://localhost:5000` (or `http://YOUR_IP:5000` on mobile).

## ☁️ Deployment

This app is ready for deployment on **Render**, **Heroku**, or **PythonAnywhere**.

**Render (Recommended):**
1.  Push code to GitHub.
2.  Create a "Web Service" on [Render](https://render.com).
3.  Connect your repo.
4.  Render will auto-detect the `procfile` (Command: `gunicorn app:app`).

## 📜 Credits

- Inspired by the original Wordle by Josh Wardle.
- Word lists sourced from the original game archives.
- Built with ❤️ by [Your Name].

*Not affiliated with The New York Times.*
