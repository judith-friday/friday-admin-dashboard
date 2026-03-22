# Friday Admin Dashboard

Team operations interface for Friday Retreats.

## Structure

- `/frontend` - Next.js frontend
- `/backend` - Express API with PostgreSQL

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

### Frontend

Create a `.env.local` file in the frontend directory:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend

Copy `.env.example` to `.env` in the backend directory and update the values:

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgres://user:password@localhost:5432/friday_admin
```