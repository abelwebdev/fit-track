import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MeasurementSettings {
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'miles';
}

export interface DailyGoalSettings {
  dailySetsGoal: number;
  dailyCaloriesGoal: number;
}

export interface SettingsState {
  measurements: MeasurementSettings;
  dailyGoals: DailyGoalSettings;
}

const initialState: SettingsState = {
  measurements: {
    weightUnit: 'kg',
    distanceUnit: 'km',
  },
  dailyGoals: {
    dailySetsGoal: 20,
    dailyCaloriesGoal: 500,
  },
};

// Load settings from localStorage if available (fallback)
const loadSettingsFromStorage = (): SettingsState => {
  try {
    const savedMeasurements = localStorage.getItem('measurementSettings');
    const savedDailyGoals = localStorage.getItem('dailyGoalSettings');
    
    const measurements = savedMeasurements ? JSON.parse(savedMeasurements) : initialState.measurements;
    const dailyGoals = savedDailyGoals ? JSON.parse(savedDailyGoals) : initialState.dailyGoals;
    
    return {
      measurements: {
        weightUnit: measurements.weightUnit || 'kg',
        distanceUnit: measurements.distanceUnit || 'km',
      },
      dailyGoals: {
        dailySetsGoal: dailyGoals.dailySetsGoal || 20,
        dailyCaloriesGoal: dailyGoals.dailyCaloriesGoal || 500,
      },
    };
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
  return initialState;
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: loadSettingsFromStorage(),
  reducers: {
    // Local actions for immediate UI updates (synced from API responses)
    updateMeasurementSetting: (
      state,
      action: PayloadAction<{ setting: keyof MeasurementSettings; value: string }>
    ) => {
      const { setting, value } = action.payload;
      if (setting === 'weightUnit') {
        state.measurements.weightUnit = value as 'kg' | 'lbs';
      } else if (setting === 'distanceUnit') {
        state.measurements.distanceUnit = value as 'km' | 'miles';
      }
      
      // Save to localStorage as backup
      try {
        localStorage.setItem('measurementSettings', JSON.stringify(state.measurements));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    },
    updateDailyGoalSetting: (
      state,
      action: PayloadAction<{ setting: keyof DailyGoalSettings; value: number }>
    ) => {
      const { setting, value } = action.payload;
      state.dailyGoals[setting] = value;
      
      // Save to localStorage as backup
      try {
        localStorage.setItem('dailyGoalSettings', JSON.stringify(state.dailyGoals));
      } catch (error) {
        console.error('Error saving daily goal settings to localStorage:', error);
      }
    },
    // Batch update for server responses
    updateAllMeasurementSettings: (
      state,
      action: PayloadAction<MeasurementSettings>
    ) => {
      state.measurements = action.payload;
      
      // Save to localStorage
      try {
        localStorage.setItem('measurementSettings', JSON.stringify(state.measurements));
      } catch (error) {
        console.error('Error saving settings to localStorage:', error);
      }
    },
    updateAllDailyGoalSettings: (
      state,
      action: PayloadAction<DailyGoalSettings>
    ) => {
      state.dailyGoals = action.payload;
      
      // Save to localStorage
      try {
        localStorage.setItem('dailyGoalSettings', JSON.stringify(state.dailyGoals));
      } catch (error) {
        console.error('Error saving daily goal settings to localStorage:', error);
      }
    },
    resetSettings: (state) => {
      state.measurements = initialState.measurements;
      state.dailyGoals = initialState.dailyGoals;
      
      // Clear localStorage
      try {
        localStorage.removeItem('measurementSettings');
        localStorage.removeItem('dailyGoalSettings');
      } catch (error) {
        console.error('Error clearing settings from localStorage:', error);
      }
    },
  },
});

export const {
  updateMeasurementSetting,
  updateDailyGoalSetting,
  updateAllMeasurementSettings,
  updateAllDailyGoalSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectMeasurementSettings = (state: { settings: SettingsState }) =>
  state.settings.measurements;

export const selectDailyGoalSettings = (state: { settings: SettingsState }) =>
  state.settings.dailyGoals;

export const selectWeightUnit = (state: { settings: SettingsState }) =>
  state.settings.measurements.weightUnit;

export const selectDistanceUnit = (state: { settings: SettingsState }) =>
  state.settings.measurements.distanceUnit;

export const selectDailySetsGoal = (state: { settings: SettingsState }) =>
  state.settings.dailyGoals.dailySetsGoal;

export const selectDailyCaloriesGoal = (state: { settings: SettingsState }) =>
  state.settings.dailyGoals.dailyCaloriesGoal;