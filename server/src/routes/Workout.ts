import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createWorkout, getWorkouts, updateWorkout, deleteWorkout } from '../controllers/Workout.js';

export default async function WorkoutRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.post('/', createWorkout);
  fastify.get('/', getWorkouts);
  fastify.put('/:id', updateWorkout);
  fastify.delete('/:id', deleteWorkout);
}