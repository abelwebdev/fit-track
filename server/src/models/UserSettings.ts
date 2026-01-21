import mongoose, { Schema, Types } from "mongoose";

export interface MeasurementSettings {
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'miles';
}

export interface DailyGoalSettings {
  dailySetsGoal: number;
  dailyCaloriesGoal: number;
}

export interface UserSettingsDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  firebase_user_id: string;
  measurements: MeasurementSettings;
  dailyGoals: DailyGoalSettings;
  createdAt: Date;
  updatedAt: Date;
}

const measurementSettingsSchema = new Schema<MeasurementSettings>({
  weightUnit: {
    type: String,
    enum: ['kg', 'lbs'],
    default: 'kg',
    required: true,
  },
  distanceUnit: {
    type: String,
    enum: ['km', 'miles'],
    default: 'km',
    required: true,
  },
}, { _id: false });

const dailyGoalSettingsSchema = new Schema<DailyGoalSettings>({
  dailySetsGoal: {
    type: Number,
    min: 1,
    max: 100,
    default: 20,
    required: true,
  },
  dailyCaloriesGoal: {
    type: Number,
    min: 50,
    max: 2000,
    default: 500,
    required: true,
  },
}, { _id: false });

const userSettingsSchema = new Schema<UserSettingsDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firebase_user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    measurements: {
      type: measurementSettingsSchema,
      default: () => ({
        weightUnit: 'kg',
        distanceUnit: 'km',
      }),
    },
    dailyGoals: {
      type: dailyGoalSettingsSchema,
      default: () => ({
        dailySetsGoal: 20,
        dailyCaloriesGoal: 500,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for efficient queries
userSettingsSchema.index({ firebase_user_id: 1, userId: 1 });

const UserSettingsModel = mongoose.model<UserSettingsDocument>("UserSettings", userSettingsSchema);

export default UserSettingsModel;