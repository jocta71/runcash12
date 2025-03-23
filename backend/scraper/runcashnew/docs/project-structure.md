# RunCash Project Structure

This document provides an overview of the RunCash project structure after reorganization.

## Directory Structure

```
runcash/
├── frontend/                  # React application with Vite
│   ├── src/                   # Frontend source code
│   ├── public/                # Static assets
│   ├── README.md              # Frontend-specific documentation
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tsconfig.node.json     # Node-specific TypeScript configuration
│   ├── tsconfig.app.json      # App-specific TypeScript configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── components.json        # UI components configuration
│   ├── index.html             # HTML entry point
│   └── vercel.json            # Vercel deployment configuration
│
├── backend/                   # Backend services
│   ├── api/                   # Express.js API server
│   │   ├── node_modules/      # API dependencies
│   │   ├── package.json       # API package configuration
│   │   ├── package-lock.json  # API dependency lock file
│   │   ├── index.js           # API entry point
│   │   ├── .env               # API environment variables
│   │   └── README.md          # API documentation
│   │
│   ├── scraper/               # Python scraper for roulette data
│   │   ├── src/               # Scraper source code
│   │   ├── __pycache__/       # Python cache
│   │   ├── app.py             # Main scraper application
│   │   ├── app-exemplo.py     # Example scraper application
│   │   ├── config.py          # Scraper configuration
│   │   ├── setup_supabase.py  # Supabase setup script
│   │   ├── strategy_analyzer.py # Strategy analysis script
│   │   ├── terminal_table.py  # Terminal table display script
│   │   ├── requirements.txt   # Python dependencies
│   │   ├── runtime.txt        # Python runtime specification
│   │   ├── Procfile           # Heroku process file
│   │   ├── .env               # Scraper environment variables
│   │   ├── README.md          # Scraper documentation
│   │   └── *.json             # Data files
│   │
│   ├── README.md              # Backend documentation
│   └── railway.toml           # Railway deployment configuration
│
├── node_modules/              # Root dependencies
├── package.json               # Root package configuration
├── package-lock.json          # Root dependency lock file
├── .gitignore                 # Git ignore file
├── README.md                  # Project documentation
└── project-structure.md       # This file
```

## Key Components

### Frontend

The frontend is a React application built with Vite, TypeScript, and Tailwind CSS. It provides a user interface for viewing and analyzing roulette data.

Key features:
- Real-time data visualization
- Historical data analysis
- Strategy testing
- Mobile-responsive design

### Backend API

The backend API is an Express.js server that provides endpoints for accessing roulette data.

Key endpoints:
- `GET /api/roletas` - Get all roulettes
- `GET /api/roletas/latest` - Get latest numbers
- `GET /api/roletas/:id` - Get specific roulette
- `GET /api/health` - Health check

### Backend Scraper

The scraper is a Python application that collects data from online roulettes and stores it in Supabase.

Key features:
- Data collection from multiple sources
- Data processing and analysis
- Strategy testing
- Automatic data storage

## Deployment Options

### Frontend
- Vercel (recommended)
- Netlify
- Firebase Hosting

### Backend API
- Railway (recommended)
- Render
- Heroku

### Scraper
- VPS (recommended)
- Railway
- GitHub Actions

## Environment Variables

Each component requires specific environment variables to function properly. See the README.md in each directory for details.

## Development Workflow

1. Run the scraper to collect data
2. Run the API to serve the data
3. Run the frontend to visualize the data

See the README.md files in each directory for specific commands and instructions. 