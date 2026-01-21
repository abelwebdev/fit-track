import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { createUser } from '../controllers/User.js';

export default async function UserRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post('/', createUser);
}