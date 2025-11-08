# No Gamble Pokemon

A turn-based monster battle system inspired by Pokemon, built with Node.js backend and Vue.js frontend.

## Features

- Turn-based battles with monster selection
- Balanced stats and moves system
- Type effectiveness and STAB bonuses
- AI opponent for single-player battles
- Modern UI with Vue.js and Tailwind CSS

## Setup

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
Make sure MongoDB is running, then:
```bash
cd backend
npm run seed
```

## Project Structure

- `backend/` - Node.js/Express server with MongoDB
- `frontend/` - Nuxt.js application
- `shared/` - Shared data files (monster data, etc.)

## Battle System

- Monsters have balanced stats totaling 600 points
- Moves are categorized as physical or magical
- Type effectiveness and STAB (Same Type Attack Bonus) implemented
- Proper turn order based on priority and speed