import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from "mongoose";
import RoutineModel from "../models/Routine.js";
import admin from "firebase-admin";

type RoutineSetPayload = {
  targetReps?: number;
  reps?: number;
  targetWeight?: number;
  weight?: number;
  targetDuration?: number;
  time?: number;
  targetDistance?: number;
  distance?: number;
  setType?: "warmup" | "failure" | "dropset" | "normal";
  type?: "warmup" | "failure" | "dropset" | "normal";
  restSeconds?: number;
  rest?: number;
};

type RoutineExercisePayload = {
  exerciseId: string;
  name: string;
  order?: number;
  target: string;
  secondary: string[];
  equipment: string;
  sets: RoutineSetPayload[];
  exercise_type: number;
  img: string;
  gif: string;
};

type CreateRoutineBody = {
  name: string;
  exercises: RoutineExercisePayload[];
};
type UpdateRoutineParams = {
  id: string;
};
type UpdateRoutineBody = CreateRoutineBody;
type DeleteRoutineParams = {
  id: string;
};

const normalizeRoutineSet = (set: RoutineSetPayload) => {
  const normalized: Partial<{
    reps: number;
    weight: number;
    time: number;
    distance: number;
    type: "warmup" | "failure" | "dropset" | "normal";
    rest: number;
  }> = {};

  const reps = set.targetReps ?? set.reps;
  const weight = set.targetWeight ?? set.weight;
  const time = set.targetDuration ?? set.time;
  const distance = set.targetDistance ?? set.distance;
  const rest = set.restSeconds ?? set.rest;
  const type = set.setType ?? set.type;

  if (reps !== undefined) normalized.reps = reps;
  if (weight !== undefined) normalized.weight = weight;
  if (time !== undefined) normalized.time = time;
  if (distance !== undefined) normalized.distance = distance;
  if (type !== undefined) normalized.type = type;
  if (rest !== undefined) normalized.rest = rest;

  return normalized;
};

export const createRoutine = async (
  request: FastifyRequest<{ Body: CreateRoutineBody }>,
  reply: FastifyReply
) => {
  try {
    const { name, exercises } = request.body;
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ message: "Unauthorized: No token provided" });
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return reply.code(401).send({ message: "Unauthorized: No token provided" });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const payload = {
      userId: decodedToken.uid || (decodedToken as any).user_id,
      name,
      exercises: exercises.map((ex, index) => ({
        exerciseId: new mongoose.Types.ObjectId(ex.exerciseId),
        name: ex.name,
        order: ex.order ?? index,
        target: ex.target,
        secondary: Array.isArray(ex.secondary)
          ? ex.secondary.map((muscle: string) => muscle)
          : [],
        sets: ex.sets.map(normalizeRoutineSet),
        equipment: ex.equipment,
        img: ex.img,
        gif: ex.gif,
        exercise_type: ex.exercise_type,
      })),
    };
    const routine = await RoutineModel.create(payload as any);
    return reply.code(201).send({ status: "success" });
  } catch (err: any) {
    console.error("Failed to create routine:", err);
    return reply.code(500).send({ message: err.message || "Failed to create routine" });
  }
};
export const updateRoutine = async (
  request: FastifyRequest<{ Params: UpdateRoutineParams; Body: UpdateRoutineBody }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { name, exercises } = request.body;
    
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ message: "Unauthorized: No token provided" });
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return reply.code(401).send({ message: "Unauthorized: No token provided" });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid || (decodedToken as any).user_id;

    // Verify the routine exists and belongs to the user
    const existingRoutine = await RoutineModel.findOne({ _id: id, userId });
    if (!existingRoutine) {
      return reply.code(404).send({ message: "Routine not found or access denied" });
    }

    // Transform frontend format to backend format
    const updatedPayload = {
      name,
      exercises: exercises.map((ex, index) => ({
        exerciseId: new mongoose.Types.ObjectId(ex.exerciseId),
        name: ex.name,
        order: ex.order ?? index,
        target: ex.target,
        secondary: Array.isArray(ex.secondary)
          ? ex.secondary.map((muscle: string) => muscle)
          : [],
        sets: ex.sets.map(normalizeRoutineSet),
        equipment: ex.equipment,
        img: ex.img,
        gif: ex.gif,
        exercise_type: ex.exercise_type,
      })),
    };

    // Update the routine (using $set to preserve userId and timestamps)
    const updatedRoutine = await RoutineModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: updatedPayload },
      { new: true, runValidators: true, select: "-userId" }
    );

    if (!updatedRoutine) {
      return reply.code(404).send({ message: "Routine not found" });
    }

    return reply.code(200).send({ status: "success", data: updatedRoutine });
  } catch (err: any) {
    console.error("Failed to update routine:", err);
    return reply.code(500).send({ message: err.message || "Failed to update routine" });
  }
};
export const getRoutine = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ message: 'Unauthorized: No token provided' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return reply.code(401).send({ message: 'Unauthorized: No token provided' });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const routines = await RoutineModel
      .find({ userId }, { userId: 0 })
      .sort({ createdAt: -1 });
    return reply.code(200).send(routines);
  } catch (err: any) {
    console.error('Failed to fetch routines:', err);
    return reply.code(500).send({
      message: err.message || 'Failed to fetch routines',
    });
  }
};
export const deleteRoutine = async (
  request: FastifyRequest<{ Params: DeleteRoutineParams }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ message: "Unauthorized: No token provided" });
    }
    const idToken = authHeader.split('Bearer ')[1];
    if (!idToken) {
      return reply.code(401).send({ message: "Unauthorized: No token provided" });
    }
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid || (decodedToken as any).user_id;
    // Verify the routine exists and belongs to the user
    const existingRoutine = await RoutineModel.findOne({ _id: id, userId });
    if (!existingRoutine) {
      return reply.code(404).send({ message: "Routine not found or access denied" });
    }
    // Delete the routine
    await RoutineModel.deleteOne({ _id: id });
    // Respond success
    return reply.code(200).send({
      message: "Routine deleted successfully",
      routineId: id,
    });
  } catch (err: any) {
    console.error('Failed to delete routine:', err);
    return reply.code(500).send({
      message: err.message || 'Failed to delete routine',
    });
  }
};