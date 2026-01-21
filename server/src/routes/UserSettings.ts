import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { 
  getUserSettings, 
  updateMeasurementSettings, 
  updateDailyGoalSettings, 
  updateAllSettings 
} from '../controllers/UserSettings.js';

export default async function UserSettingsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  // GET /api/settings - Get user settings
  fastify.get('/', getUserSettings);
  
  fastify.put('/measurements', updateMeasurementSettings);
  
  fastify.put('/daily-goals', updateDailyGoalSettings);
  
  fastify.put('/', updateAllSettings);
}