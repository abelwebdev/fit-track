import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from "mongoose";
import WorkoutSessionModel from "../models/WorkoutSession.js";
import admin from "firebase-admin";

type CreateWorkoutBody = {
  routineId?: string;
  duration?: number;
  calories?: number;
  exercises: {
    exerciseId: string;
    order?: number;
    exercise_type: number;
    sets: {
      reps?: number;
      weight?: number;
      time?: number;
      distance?: number;
      rest?: number;
      type?: "warmup" | "normal" | "failure" | "dropset";
      done?: boolean;
    }[];
  }[];
};

type UpdateWorkoutParams = { id: string };

const extractUserId = async (request: FastifyRequest): Promise<string | null> => {
  if (request.user?.uid) {
    return request.user.uid;
  }

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const [, token] = authHeader.split(' ');
  if (!token) {
    return null;
  }

  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken.uid || (decodedToken as any).user_id || null;
};

export const createWorkout = async (
  request: FastifyRequest<{ Body: CreateWorkoutBody }>,
  reply: FastifyReply
) => {
  try {
    const userId = await extractUserId(request);
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { routineId, duration, calories, exercises } = request.body;

    if (!Array.isArray(exercises) || exercises.length === 0) {
      return reply.code(400).send({ message: "Workout must include at least one exercise" });
    }

    const workoutPayload = {
      userId,
      routineId: routineId && mongoose.Types.ObjectId.isValid(routineId)
        ? new mongoose.Types.ObjectId(routineId)
        : undefined,
      exercises: exercises.map((exercise, index) => {
        if (!mongoose.Types.ObjectId.isValid(exercise.exerciseId)) {
          throw new Error(`Invalid exerciseId: ${exercise.exerciseId}`);
        }
        return {
          exerciseId: new mongoose.Types.ObjectId(exercise.exerciseId),
          order: exercise.order ?? index,
          exercise_type: exercise.exercise_type,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            time: set.time,
            distance: set.distance,
            rest: set.rest,
            type: set.type,
            done: set.done ?? false,
          })),
        };
      }),
      calories,
      total_duration: duration,
    };

    const workout = await WorkoutSessionModel.create(workoutPayload);
    const workoutObj = workout.toObject();
    delete workoutObj.userId;
    return reply.code(201).send({
      status: "success",
      data: workoutObj,
    });
  } catch (err: any) {
    console.error("Failed to create workout:", err);
    return reply.code(500).send({ message: err.message || "Failed to create workout" });
  }
};

export const updateWorkout = async (
  request: FastifyRequest<{ Params: UpdateWorkoutParams; Body: CreateWorkoutBody }>,
  reply: FastifyReply
) => {
  try {
    const userId = await extractUserId(request);
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.code(400).send({ message: "Invalid workout id" });
    }

    const { routineId, duration, calories, exercises } = request.body;
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return reply.code(400).send({ message: "Workout must include at least one exercise" });
    }

    const updatePayload = {
      routineId: routineId && mongoose.Types.ObjectId.isValid(routineId)
        ? new mongoose.Types.ObjectId(routineId)
        : undefined,
      exercises: exercises.map((exercise, index) => {
        if (!mongoose.Types.ObjectId.isValid(exercise.exerciseId)) {
          throw new Error(`Invalid exerciseId: ${exercise.exerciseId}`);
        }
        return {
          exerciseId: new mongoose.Types.ObjectId(exercise.exerciseId),
          order: exercise.order ?? index,
          exercise_type: exercise.exercise_type,
          sets: exercise.sets.map((set) => ({
            reps: set.reps,
            weight: set.weight,
            time: set.time,
            distance: set.distance,
            rest: set.rest,
            type: set.type,
            done: set.done ?? false,
          })),
        };
      }),
      calories,
      total_duration: duration,
    };

    const updatedWorkout = await WorkoutSessionModel.findOneAndUpdate(
      { _id: id, userId },
      updatePayload,
      { new: true, runValidators: true }
    ).populate('exercises.exerciseId', 'name target secondary img type');

    if (!updatedWorkout) {
      return reply.code(404).send({ message: "Workout not found" });
    }

    return reply.code(200).send({ status: "success", data: updatedWorkout });
  } catch (err: any) {
    console.error("Failed to update workout:", err);
    return reply.code(500).send({ message: err.message || "Failed to update workout" });
  }
};

export const deleteWorkout = async (
  request: FastifyRequest<{ Params: UpdateWorkoutParams }>,
  reply: FastifyReply
) => {
  try {
    const userId = await extractUserId(request);
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.code(400).send({ message: "Invalid workout id" });
    }

    const deleted = await WorkoutSessionModel.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return reply.code(404).send({ message: "Workout not found" });
    }

    return reply.code(200).send({ status: "success", message: "Workout deleted" });
  } catch (err: any) {
    console.error("Failed to delete workout:", err);
    return reply.code(500).send({ message: err.message || "Failed to delete workout" });
  }
};

export const getWorkouts = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = await extractUserId(request);
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    const workouts = await WorkoutSessionModel.find({ userId })
      .select("-userId")
      .sort({ createdAt: -1 })
      .populate('exercises.exerciseId', 'name target secondary img type')
      .populate('routineId', 'name exercises')
      .lean();

    const workoutsWithRoutine = workouts.map(({ routineId, ...workout }) => ({
      ...workout,
      routine: typeof routineId === 'object' ? routineId : undefined,
    }));

    return reply.code(200).send({ status: "success", data: workoutsWithRoutine });
  } catch (err: any) {
    console.error("Failed to fetch workouts:", err);
    return reply.code(500).send({ message: err.message || "Failed to fetch workouts" });
  }
};