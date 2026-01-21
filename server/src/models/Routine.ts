import mongoose, { Document, Schema, Types } from "mongoose";

export interface RoutineSet {
  reps?: number;
  weight?: number;
  time?: number;
  distance?: number;
  type?: "warmup" | "failure" | "dropset" | "normal";
  rest?: number;
}

export interface RoutineExercise {
  exerciseId: Types.ObjectId;
  name: string;
  order: number;
  target: string;
  secondary: string[];
  equipment: string;
  img: string;
  gif: string;
  sets: RoutineSet[];
  exercise_type: number;
}

export interface RoutineDocument extends Document {
  userId: String;
  name: string;
  exercises: RoutineExercise[];
}

const routineSetSchema = new Schema<RoutineSet>(
  {
    reps: { type: Number },
    weight: { type: Number },
    time: { type: Number },
    distance: { type: Number },
    type: {
      type: String,
      enum: ["warmup", "failure", "dropset", "normal"],
      default: "normal",
    },
    rest: {
      type: Number,
      default: 60,
    },
  },
  { _id: false }
);

const routineExerciseSchema = new Schema<RoutineExercise>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    name: String,
    target: String,
    secondary: {
      type: [String],
      default: [],
    },
    equipment: { type: String, required: true },
    img: { type: String, required: true },
    gif: { type: String, required: true },
    exercise_type: { type: Number, required: true },
    order: { type: Number, required: true },
    sets: {
      type: [routineSetSchema],
      default: [],
    },
  },
  { _id: false }
);

const routineSchema = new Schema<RoutineDocument>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    exercises: {
      type: [routineExerciseSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const RoutineModel = mongoose.model<RoutineDocument>(
  "Routine",
  routineSchema
);

export default RoutineModel;