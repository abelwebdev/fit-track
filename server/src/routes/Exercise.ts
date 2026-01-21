// src/routes/item.route.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getExercises, getFilteredExercises } from '../controllers/Exercise.js';

export default async function ExerciseRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.get('/', getExercises);
  fastify.get('/search', getFilteredExercises);
}