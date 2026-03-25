# OOTD - AI Outfit Recommendation

OOTD is an AI-powered outfit recommendation app that helps you decide what to wear. Upload photos of your wardrobe, and OOTD will suggest outfits based on your clothing, the weather, and the occasion.

## Features

### Core

- Upload and categorize wardrobe items from photos
- AI-powered outfit recommendations using Claude
- Weather-aware suggestions based on your location
- Occasion-based outfit filtering (casual, work, formal, etc.)

### Nice-to-Have

- Outfit history and favorites
- Virtual try-on powered by Replicate
- Calendar integration for planning ahead
- Style analytics and wardrobe insights

## Tech Stack

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | React + TypeScript + Vite         |
| Backend  | FastAPI (Python)                  |
| Database | PostgreSQL 16                     |
| AI       | Anthropic Claude, Replicate      |
| Weather  | OpenWeatherMap API                |
| Infra    | Docker Compose                    |

## Quick Start

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/ootd.git
   cd ootd
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and fill in your API keys
   ```

3. **Start PostgreSQL**

   ```bash
   docker-compose up db
   ```

4. **Run the backend**

   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

5. **Run the frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:8000`.

## API Keys

You will need the following API keys to run OOTD:

| Service        | Purpose                  | Get a key                                                        |
| -------------- | ------------------------ | ---------------------------------------------------------------- |
| Anthropic      | Outfit recommendations   | [console.anthropic.com](https://console.anthropic.com/)          |
| Replicate      | Virtual try-on           | [replicate.com/account](https://replicate.com/account/api-tokens)|
| OpenWeatherMap | Weather data             | [openweathermap.org/api](https://openweathermap.org/api)         |

## Architecture

```
frontend/ (React + Vite)
  |
  |--- REST / WebSocket --->  backend/ (FastAPI)
                                 |
                                 |---> PostgreSQL (wardrobe data)
                                 |---> Anthropic API (outfit logic)
                                 |---> Replicate API (image generation)
                                 |---> OpenWeatherMap API (weather)
```

## Screenshots

*Coming soon.*
