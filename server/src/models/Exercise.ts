import mongoose, { Document, Schema } from 'mongoose';

export interface ExerciseDocument extends Document {
  name: String;
  equipment: String;
  bodypart: String;
  target: String;
  secondary: String[];
  gifurl: String;
  img: String;
  type: number;
  exercise_id: String;
}

const exerciseSchema = new Schema<ExerciseDocument>({
  name: { type: String, required: true },
  equipment: { type: String, required: true },
  bodypart: { type: String, required: true },
  target: { type: String, required: true },
  secondary: [{ type: String, required: true }],
  gifurl: { type: String, required: true },
  img: { type: String, required: true },
  type: { type: Number, required: true },
  exercise_id: { type: String, required: true, unique: true }
});

const ExerciseModel = mongoose.model<ExerciseDocument>('Exercise', exerciseSchema);

export default ExerciseModel;