import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDashboardStats } from '../controllers/Dashboard.js';

export default async function DashbardRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  fastify.get('/dashboard-stats', getDashboardStats);
}