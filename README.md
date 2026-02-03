# Unlimited Wordle

A production-ready, unlimited version of the Wordle word guessing game. This application is built as a Progressive Web App (PWA) using Python (Flask) for the backend and Vanilla JavaScript for a high-performance frontend.

## Features

- **Unlimited Gameplay**: Support for continuous play without daily restrictions.
- **Offline Capability**: PWA manifest and Service Worker support for installation on mobile and desktop.
- **Data Persistence**: LocalStorage implementation for tracking win percentages, streaks, and guess distribution.
- **Responsive Design**: Mobile-first architecture with optimized touch targets and adaptive layouts.
- **Accessibility**: High Contrast mode and full keyboard navigation support.
- **Theming**: System-aware Dark and Light modes.

## Technical Stack

- **Backend**: Python 3.12+ (Flask)
- **Frontend**: Vanilla JavaScript (ES6+), HTML5
- **Styling**: Tailwind CSS (Utility-first), CSS3 Animations
- **Server**: Gunicorn (Production WSGI)

## Installation and Setup

### Prerequisites

- Python 3.x installed
- Git (optional)

### Local Development

1.  Clone the repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/Unlimited-Wordle.git
    cd Unlimited-Wordle
    ```

2.  Install required Python packages:
    ```bash
    pip install -r requirements.txt
    ```

3.  Start the development server:
    ```bash
    python app.py
    ```

4.  Access the application at `http://localhost:5000`.

## Deployment

The application is configured for deployment on Vercel (Serverless) or Render (Container/WSGI).

### Vercel Deployment

1.  Push the repository to GitHub.
2.  Import the project into Vercel.
3.  The included `vercel.json` will automatically configure the Python runtime.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This project is inspired by the original Wordle game created by Josh Wardle and currently owned by The New York Times Company. It is an independent implementation created for educational purposes.
