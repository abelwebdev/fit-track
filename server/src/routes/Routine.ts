import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getRoutine, createRoutine, updateRoutine, deleteRoutine } from '../controllers/Routine.js';

export default async function RoutineRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/', createRoutine);
  fastify.get('/', getRoutine);
  fastify.put('/:id', updateRoutine);
  fastify.delete('/:id', deleteRoutine);
}