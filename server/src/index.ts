import Fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import fp from './plugins/db.js';
import cors from '@fastify/cors'
import { firebaseAuth } from './hooks/firebaseAuth.js';
import DashboardRoutes from './routes/Dashboard.js';
import ExerciseRoutes from './routes/Exercise.js';
import UserRoutes from './routes/User.js';
import UserSettingsRoutes from './routes/UserSettings.js';
import RoutineRoutes from './routes/Routine.js'
import WorkoutRoutes from './routes/Workout.js';

const schema = {
  type: 'object',
  required: ['MONGO_URL'],
  properties: {
    MONGO_URL: { type: 'string' },
  },
} as const;
// Extend Fastify Instance type to include your config for TypeScript
declare module 'fastify' {
  interface FastifyInstance {
    config: {
      MONGO_URL: string;
    };
  }
}
const fastify = Fastify({
  logger: true // Enables built-in logging
});
fastify.register(cors, {
  origin: ['http://localhost:5173', 'https://fit-trackweb.netlify.app'], // frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // needed if sending cookies or credentials
})
// Register plugins
await fastify.register(fastifyEnv, {
  schema: schema,
  dotenv: true, // Load variables from .env file
  confKey: 'config', // Configuration will be available on fastify.config
});
// Routes
fastify.register(fp);

// Main API wrapper
fastify.register(async function (api) {
  // Protected Scope
  api.register(async function (protectedScope) {
    protectedScope.addHook('preHandler', firebaseAuth);
    protectedScope.register(ExerciseRoutes, { prefix: '/exercises' });
    protectedScope.register(RoutineRoutes, { prefix: '/routines' });
    protectedScope.register(WorkoutRoutes, { prefix: '/workout' });
    protectedScope.register(DashboardRoutes, { prefix: '/dashboard' });
    protectedScope.register(UserSettingsRoutes, { prefix: '/settings' });
  });
    api.register(UserRoutes, { prefix: '/user' });
}, { prefix: '/api' });


// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();