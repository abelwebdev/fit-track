import { FastifyRequest, FastifyReply } from 'fastify';
import UserSettingsModel, { MeasurementSettings, DailyGoalSettings } from '../models/UserSettings.js';
import UserModel from '../models/User.js';

interface AuthenticatedRequest extends FastifyRequest {
  user: {
    uid: string;
    email?: string;
  };
}

// Get user settings
export const getUserSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const firebaseUserId = (request as AuthenticatedRequest).user?.uid;
    
    if (!firebaseUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    let userSettings = await UserSettingsModel.findOne({ firebase_user_id: firebaseUserId });
    
    // If no settings exist, create default settings
    if (!userSettings) {
      // Find the user to get the userId
      const user = await UserModel.findOne({ firebase_user_id: firebaseUserId });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      userSettings = await UserSettingsModel.create({
        userId: user._id,
        firebase_user_id: firebaseUserId,
        measurements: {
          weightUnit: 'kg',
          distanceUnit: 'km',
        },
        dailyGoals: {
          dailySetsGoal: 20,
          dailyCaloriesGoal: 500,
        },
      });
    }

    reply.status(200).send({
      success: true,
      data: {
        measurements: userSettings.measurements,
        dailyGoals: userSettings.dailyGoals,
      },
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

// Update measurement settings
export const updateMeasurementSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const firebaseUserId = (request as AuthenticatedRequest).user?.uid;
    
    if (!firebaseUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { weightUnit, distanceUnit } = request.body as Partial<MeasurementSettings>;

    // Validate input
    if (weightUnit && !['kg', 'lbs'].includes(weightUnit)) {
      return reply.status(400).send({ error: 'Invalid weight unit. Must be "kg" or "lbs"' });
    }
    
    if (distanceUnit && !['km', 'miles'].includes(distanceUnit)) {
      return reply.status(400).send({ error: 'Invalid distance unit. Must be "km" or "miles"' });
    }

    const updateData: Partial<{ 'measurements.weightUnit': string; 'measurements.distanceUnit': string }> = {};
    
    if (weightUnit) updateData['measurements.weightUnit'] = weightUnit;
    if (distanceUnit) updateData['measurements.distanceUnit'] = distanceUnit;

    const userSettings = await UserSettingsModel.findOneAndUpdate(
      { firebase_user_id: firebaseUserId },
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!userSettings) {
      return reply.status(404).send({ error: 'User settings not found' });
    }

    reply.status(200).send({
      success: true,
      data: {
        measurements: userSettings.measurements,
        dailyGoals: userSettings.dailyGoals,
      },
    });
  } catch (error) {
    console.error('Error updating measurement settings:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

// Update daily goal settings
export const updateDailyGoalSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const firebaseUserId = (request as AuthenticatedRequest).user?.uid;
    
    if (!firebaseUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { dailySetsGoal, dailyCaloriesGoal } = request.body as Partial<DailyGoalSettings>;

    // Validate input
    if (dailySetsGoal !== undefined && (dailySetsGoal < 1 || dailySetsGoal > 100)) {
      return reply.status(400).send({ error: 'Daily sets goal must be between 1 and 100' });
    }
    
    if (dailyCaloriesGoal !== undefined && (dailyCaloriesGoal < 50 || dailyCaloriesGoal > 2000)) {
      return reply.status(400).send({ error: 'Daily calories goal must be between 50 and 2000' });
    }

    const updateData: Partial<{ 'dailyGoals.dailySetsGoal': number; 'dailyGoals.dailyCaloriesGoal': number }> = {};
    
    if (dailySetsGoal !== undefined) updateData['dailyGoals.dailySetsGoal'] = dailySetsGoal;
    if (dailyCaloriesGoal !== undefined) updateData['dailyGoals.dailyCaloriesGoal'] = dailyCaloriesGoal;

    const userSettings = await UserSettingsModel.findOneAndUpdate(
      { firebase_user_id: firebaseUserId },
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!userSettings) {
      return reply.status(404).send({ error: 'User settings not found' });
    }

    reply.status(200).send({
      success: true,
      data: {
        measurements: userSettings.measurements,
        dailyGoals: userSettings.dailyGoals,
      },
    });
  } catch (error) {
    console.error('Error updating daily goal settings:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

// Update all settings at once
export const updateAllSettings = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const firebaseUserId = (request as AuthenticatedRequest).user?.uid;
    
    if (!firebaseUserId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const { measurements, dailyGoals } = request.body as {
      measurements?: Partial<MeasurementSettings>;
      dailyGoals?: Partial<DailyGoalSettings>;
    };

    const updateData: any = {};

    // Validate and prepare measurement updates
    if (measurements) {
      if (measurements.weightUnit && !['kg', 'lbs'].includes(measurements.weightUnit)) {
        return reply.status(400).send({ error: 'Invalid weight unit. Must be "kg" or "lbs"' });
      }
      
      if (measurements.distanceUnit && !['km', 'miles'].includes(measurements.distanceUnit)) {
        return reply.status(400).send({ error: 'Invalid distance unit. Must be "km" or "miles"' });
      }

      if (measurements.weightUnit) updateData['measurements.weightUnit'] = measurements.weightUnit;
      if (measurements.distanceUnit) updateData['measurements.distanceUnit'] = measurements.distanceUnit;
    }

    // Validate and prepare daily goal updates
    if (dailyGoals) {
      if (dailyGoals.dailySetsGoal !== undefined && (dailyGoals.dailySetsGoal < 1 || dailyGoals.dailySetsGoal > 100)) {
        return reply.status(400).send({ error: 'Daily sets goal must be between 1 and 100' });
      }
      
      if (dailyGoals.dailyCaloriesGoal !== undefined && (dailyGoals.dailyCaloriesGoal < 50 || dailyGoals.dailyCaloriesGoal > 2000)) {
        return reply.status(400).send({ error: 'Daily calories goal must be between 50 and 2000' });
      }

      if (dailyGoals.dailySetsGoal !== undefined) updateData['dailyGoals.dailySetsGoal'] = dailyGoals.dailySetsGoal;
      if (dailyGoals.dailyCaloriesGoal !== undefined) updateData['dailyGoals.dailyCaloriesGoal'] = dailyGoals.dailyCaloriesGoal;
    }

    if (Object.keys(updateData).length === 0) {
      return reply.status(400).send({ error: 'No valid settings provided to update' });
    }

    const userSettings = await UserSettingsModel.findOneAndUpdate(
      { firebase_user_id: firebaseUserId },
      { $set: updateData },
      { new: true, upsert: false }
    );

    if (!userSettings) {
      return reply.status(404).send({ error: 'User settings not found' });
    }

    reply.status(200).send({
      success: true,
      data: {
        measurements: userSettings.measurements,
        dailyGoals: userSettings.dailyGoals,
      },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    reply.status(500).send({ error: 'Internal server error' });
  }
};

// Initialize user settings (called when user is created)
export const initializeUserSettings = async (firebaseUserId: string, userId: string) => {
  try {
    const existingSettings = await UserSettingsModel.findOne({ firebase_user_id: firebaseUserId });
    
    if (!existingSettings) {
      await UserSettingsModel.create({
        userId,
        firebase_user_id: firebaseUserId,
        measurements: {
          weightUnit: 'kg',
          distanceUnit: 'km',
        },
        dailyGoals: {
          dailySetsGoal: 20,
          dailyCaloriesGoal: 500,
        },
      });
    }
  } catch (error) {
    console.error('Error initializing user settings:', error);
    // Don't throw error to avoid breaking user creation
  }
};