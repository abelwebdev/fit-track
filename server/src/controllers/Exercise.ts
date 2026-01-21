import { FastifyRequest, FastifyReply } from 'fastify';
import ExerciseModel from '../models/Exercise.js';

// Paginated exercises with optional search by name
type Querystring = {
  page?: string;
  limit?: string;
  name?: string; // search by name
};
// Paginated filtered exercises (muscle, equipment, search by name)
type FilterQuery = {
  muscle?: string;
  equipment?: string;
  name?: string;
  page?: string;
  limit?: string;
};

export const getExercises = async (
  request: FastifyRequest<{ Querystring: Querystring }>,
  reply: FastifyReply
) => {
  try {
    const page = Math.max(Number(request.query.page) || 1, 1);
    const limit = Math.min(Number(request.query.limit) || 12, 50);
    const skip = (page - 1) * limit;
    const { name } = request.query;
    const filter: Record<string, any> = {};
    // Case-insensitive search by name
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    const [exercises, totalItems] = await Promise.all([
      ExerciseModel.find(filter).skip(skip).limit(limit),
      ExerciseModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return reply.send({ data: exercises, page, totalPages, totalItems });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ message: 'Failed to fetch exercises' });
  }
};
export const getFilteredExercises = async (
  request: FastifyRequest<{ Querystring: FilterQuery }>,
  reply: FastifyReply
) => {
  try {
    const { muscle, equipment, name } = request.query;
    const page = Math.max(Number(request.query.page) || 1, 1);
    const limit = Math.min(Number(request.query.limit) || 12, 50);
    const skip = (page - 1) * limit;
    const filter: Record<string, any> = {};
    // Muscle filter matches target
    if (muscle) {
      filter.$or = [
        { target: muscle },
      ];
    }
    // Equipment filter
    if (equipment) {
      filter.equipment = equipment;
    }
    // Search by name
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    const [exercises, totalItems] = await Promise.all([
      ExerciseModel.find(filter).skip(skip).limit(limit),
      ExerciseModel.countDocuments(filter),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    return reply.send({ data: exercises, page, totalPages, totalItems });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ message: 'Failed to fetch filtered exercises' });
  }
};