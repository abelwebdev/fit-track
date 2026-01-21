# Fit Track

Fit Track is a Full-Stack fitness companion web app that pairs a React dashboard with a Fastify API so users can visualize progress, manage workouts, and keep their data in sync across devices.

## Tech Stack

### Frontend

- Vite + React 18 + TypeScript for ultra-fast DX and modern routing
- Tailwind CSS, shadcn/ui primitives, and Radix UI underpinnings for accessible design tokens and components
- Redux Toolkit, React Query, and React Hook Form for state, data fetching, and form orchestration
- Firebase SDK for auth and realtime data needs

### Backend

- Fastify 5 + TypeScript with its plugin ecosystem for the HTTP layer
- Mongoose + MongoDB for DB
- Firebase Admin for secure server-side access to Firebase services

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance and Firebase credentials configured via environment variables

### Installation

1. Clone the repository and install dependencies for both workspaces:
   ```bash
   git clone https://github.com/abelwebdev/fit-track
   cd fit-track
   cd client
   npm install
   cd server
   npm install
   ```
2. Duplicate any sample environment files (e.g., `.env.example`) to `.env` in each workspace, then populate your keys.

### Running the app locally

Run the API and web app in separate terminals:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - client
cd Client
npm run dev
```

The client Vite dev server runs on `http://localhost:5173` by default. The Fastify server watches and reloads via `tsx watch`

### Production builds

```bash
# Build client static assets
cd client
npm run build

# Build server to dist/
cd server
npm run build

# Start the compiled server
cd server
npm run start
```
