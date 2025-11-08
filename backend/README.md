# Backend

## Setup
1. Install dependencies:
```
npm install
```

2. Configure environment variables:
- Copy `.env` file and adjust MongoDB URI if needed

3. Start MongoDB (using Docker):
```
docker-compose up -d
```

4. Run the server:
```
npm run dev
```

## API Endpoints

### Monsters
- GET `/api/monster` - Get all monsters
- GET `/api/monster/:id` - Get monster by ID
- POST `/api/monster` - Create new monster

### Battle
- POST `/api/battle/start` - Start a new battle
- POST `/api/battle/:battleId/move` - Execute a move
- GET `/api/battle/:battleId/status` - Get battle status

## Project Structure
- `server.js` - Entry point
- `src/routes/` - API routes
- `src/controllers/` - Request handlers
- `src/services/` - Business logic
- `src/models/` - Database schemas
- `src/config/` - Configuration files
- `src/middleware/` - Express middleware
- `src/utils/` - Helper functions
