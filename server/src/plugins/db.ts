// src/plugins/db.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import mongoose, { Connection } from 'mongoose';

// Extend FastifyInstance with the structure added by @fastify/env.
interface AppConfig {
  MONGO_URL: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    // 1. Ensure fastify.config is typed for the plugin to access it
    config: AppConfig;
    // 2. The database connection object
    mongo: {
      db: Connection;
    };
  }
}

// Use FastifyPluginAsync type and ensure options are typed if used, 
// or simply omit the options argument if you don't need it.
const dbConnector: FastifyPluginAsync = async (fastify, opts) => {
  try {
    // Read the variable from fastify.config, which is loaded by @fastify/env
    const uri = fastify.config.MONGO_URL; 
    
    if (!uri) {
      // Throw an error instead of using process.exit(1)
      throw new Error('MONGO_URL not available on fastify.config. Check your @fastify/env setup.');
    }
    
    await mongoose.connect(uri);
    fastify.log.info('MongoDB connected successfully');
    
    // Decorate the fastify instance with the connection
    fastify.decorate('mongo', { db: mongoose.connection });
    
  } catch (error) {
    // FIX 3: Log and rethrow the error for Fastify's startup sequence to handle
    // fastify.log.error('MongoDB connection error:', error);
    throw error;
  }
};

// Use fp to make the plugin compatible with Fastify's decorator system
export default fp(dbConnector);