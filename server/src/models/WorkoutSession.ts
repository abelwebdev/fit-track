import mongoose, { Document, Schema, Types } from "mongoose";

export interface WorkoutSet {
  reps?: number;
  weight?: number;
  time?: number;
  distance?: number;
  rest?: number;
  type?: "warmup" | "normal" | "failure" | "dropset";
  done?: boolean;
}

export interface WorkoutExercise {
  exerciseId: Types.ObjectId;
  order: number;
  exercise_type: number;
  sets: WorkoutSet[];
}

export interface WorkoutSessionDocument extends Document {
  userId: string;
  routineId?: Types.ObjectId;
  exercises: WorkoutExercise[];
  calories?: number;
  total_duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

const workoutSetSchema = new Schema<WorkoutSet>(
  {
    reps: { type: Number },
    weight: { type: Number },
    time: { type: Number },
    distance: { type: Number },
    type: {
      type: String,
      enum: ["warmup", "normal", "failure", "dropset"],
    },
    rest: { type: Number },
    done: { type: Boolean, default: false },
  },
  { _id: false }
)

const workoutExerciseSchema = new Schema<WorkoutExercise>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    order: { type: Number, required: true },
    exercise_type: { type: Number, required: true },
    sets: { type: [workoutSetSchema], required: true, default: [] },
  },
  { _id: false }
);

const workoutSessionSchema = new Schema<WorkoutSessionDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    routineId: {
      type: Schema.Types.ObjectId,
      ref: "Routine",
    },
    exercises: { type: [workoutExerciseSchema], required: true, default: [] },
    calories: { type: Number },
    total_duration: { type: Number },
  },
  { timestamps: true }
);

const WorkoutSessionModel = mongoose.model<WorkoutSessionDocument>(
  "WorkoutSession",
  workoutSessionSchema
);

export default WorkoutSessionModel;