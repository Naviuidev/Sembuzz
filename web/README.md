# SemBuzz Web Admin Portal

React + TypeScript web application for the Super Admin portal.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (or copy from `.env.example`):
```
VITE_API_URL=http://localhost:3000
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

- **Login**: Super Admin authentication
- **Dashboard**: View all schools in a table
- **Create School**: Form to create new schools with features and admin
- **School Details**: View and update school information and features

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query (React Query)
- Axios
- Tailwind CSS

## Project Structure

```
src/
  ├── components/     # Reusable components
  ├── contexts/      # React contexts (Auth)
  ├── pages/         # Page components
  ├── services/      # API service functions
  ├── config/        # Configuration (API setup)
  └── App.tsx        # Main app with routing
```

## API Integration

The app connects to the NestJS backend running on `http://localhost:3000` by default.

Make sure the backend server is running before using the web app.
