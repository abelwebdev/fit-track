import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { auth } from '@/auth/firebase';
import { MuscleGroup, EquipmentType, SetType, Routine, WorkoutSession } from '@/types/fitness';

export type CreateWorkoutSessionPayload = {
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
      distance?: number;
      time?: number;
      rest?: number;
      type?: SetType;
      done?: boolean;
    }[];
  }[];
};

export type MeasurementSettings = {
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'miles';
};

export type DailyGoalSettings = {
  dailySetsGoal: number;
  dailyCaloriesGoal: number;
};

export type UserSettings = {
  measurements: MeasurementSettings;
  dailyGoals: DailyGoalSettings;
};

export type UserSettingsResponse = {
  success: boolean;
  data: UserSettings;
};
type CreateUserPayload = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};
type UserResponse = {
  id: string;
  name: string;
  duration: number;
  userId: string;
};
type Exercise = {
  _id: string;
  name: string;
  target: MuscleGroup;
  bodyPart: string;
  equipment: EquipmentType;
  gifUrl?: string;
  type: number
};
type DailyData = {
  day: string;
  value: number;
  workouts: number;
  volume: number;
};
type DashboardStats = {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalCardioMinutes: number;
  totalCardioDistance?: number; // Add optional distance tracking
  totalCaloriesBurned: number;
  todayCalories: number;
  todaySets: number;
  weeklyWorkouts: number;
  weeklyVolume: number;
  dailyData: DailyData[];
  recentWorkouts: WorkoutSession[];
};
const getValidToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      auth.currentUser.getIdToken().then(resolve);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      resolve(user ? await user.getIdToken() : null);
    });
  });
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: async (headers) => {
      const token = await getValidToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Workout', 'UserSettings', 'Routine'],
  endpoints: (builder) => ({
    createUser: builder.mutation<UserResponse, CreateUserPayload>({
      query: (body) => ({
        url: '/user',
        method: 'POST',
        body,
      }),
    }),
    getExercises: builder.query<
      {
        data: Exercise[];
        page: number;
        totalPages: number;
        totalItems: number;
      },
      { page: number; limit: number; name?: string }>({
        query: ({ page, limit, name }) => {
          const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
          if (name) params.append('name', name);
          return `/exercises?${params.toString()}`;
        },
      }),
    getFilteredExercises: builder.query<{
      data: Exercise[];
      page: number;
      totalPages: number;
      totalItems: number;
    }, { muscle?: string; equipment?: string; page?: number; limit?: number; name?: string }>({
      query: ({ muscle, equipment, page = 1, limit = 12, name }) => {
        const params = new URLSearchParams();
        if (muscle) params.append('muscle', muscle);
        if (equipment) params.append('equipment', equipment);
        if (name) params.append('name', name);
        params.append('page', page.toString());
        params.append('limit', limit.toString());
        return `/exercises/search?${params.toString()}`;
      },
    }),
    createRoutine: builder.mutation<Routine, Routine>({
      query: (routine) => ({
        url: "/routines",
        method: "POST",
        body: routine,
      }),
      invalidatesTags: ['Routine'],
    }),
    updateRoutine: builder.mutation<Routine, { id: string; data: Routine }>({
      query: ({ id, data }) => ({
        url: `/routines/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ['Routine'],
    }),
    getRoutine: builder.query<Routine, void>({
      query: () => `/routines`,
      providesTags: ['Routine'],
    }),
    deleteRoutine: builder.mutation<{ message: string; routineId: string }, string>({
      query: (id) => ({
        url: `/routines/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ['Routine'],
    }),
    createWorkoutSession: builder.mutation<{ status: string; data: unknown }, CreateWorkoutSessionPayload>({
      query: (payload) => ({
        url: '/workout',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Workout'],
    }),
    getWorkoutSessions: builder.query<{ status: string; data: WorkoutSession[] }, void>({
      query: () => ({
        url: '/workout',
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),
    updateWorkout: builder.mutation<{ status: string; data: WorkoutSession }, { id: string; body: CreateWorkoutSessionPayload }>({
      query: ({ id, body }) => ({
        url: `/workout/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Workout'],
    }),
    deleteWorkout: builder.mutation<{ status: string; message: string }, string>({
      query: (id) => ({
        url: `/workout/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Workout'],
    }),
    getDashboardStats: builder.query<{ status: string; data: DashboardStats }, void>({
      query: () => ({
        url: '/dashboard/dashboard-stats',
        method: 'GET',
      }),
      providesTags: ['Workout'],
    }),
    // User Settings endpoints
    getUserSettings: builder.query<UserSettingsResponse, void>({
      query: () => ({
        url: '/settings',
        method: 'GET',
      }),
      providesTags: ['UserSettings'],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Update settings slice with server data
          const { updateMeasurementSetting, updateDailyGoalSetting } = await import('@/features/settings/settingsSlice');
          
          dispatch(updateMeasurementSetting({ 
            setting: 'weightUnit', 
            value: data.data.measurements.weightUnit 
          }));
          dispatch(updateMeasurementSetting({ 
            setting: 'distanceUnit', 
            value: data.data.measurements.distanceUnit 
          }));
          dispatch(updateDailyGoalSetting({ 
            setting: 'dailySetsGoal', 
            value: data.data.dailyGoals.dailySetsGoal 
          }));
          dispatch(updateDailyGoalSetting({ 
            setting: 'dailyCaloriesGoal', 
            value: data.data.dailyGoals.dailyCaloriesGoal 
          }));
        } catch (error) {
          console.error('Failed to update settings from server:', error);
        }
      },
    }),
    updateMeasurementSettings: builder.mutation<UserSettingsResponse, Partial<MeasurementSettings>>({
      query: (settings) => ({
        url: '/settings/measurements',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['UserSettings'],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Update settings slice with server response
          const { updateMeasurementSetting } = await import('@/features/settings/settingsSlice');
          
          if (data.data.measurements.weightUnit) {
            dispatch(updateMeasurementSetting({ 
              setting: 'weightUnit', 
              value: data.data.measurements.weightUnit 
            }));
          }
          if (data.data.measurements.distanceUnit) {
            dispatch(updateMeasurementSetting({ 
              setting: 'distanceUnit', 
              value: data.data.measurements.distanceUnit 
            }));
          }
        } catch (error) {
          console.error('Failed to update measurement settings:', error);
        }
      },
    }),
    updateDailyGoalSettings: builder.mutation<UserSettingsResponse, Partial<DailyGoalSettings>>({
      query: (settings) => ({
        url: '/settings/daily-goals',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['UserSettings'],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Update settings slice with server response
          const { updateDailyGoalSetting } = await import('@/features/settings/settingsSlice');
          
          if (data.data.dailyGoals.dailySetsGoal !== undefined) {
            dispatch(updateDailyGoalSetting({ 
              setting: 'dailySetsGoal', 
              value: data.data.dailyGoals.dailySetsGoal 
            }));
          }
          if (data.data.dailyGoals.dailyCaloriesGoal !== undefined) {
            dispatch(updateDailyGoalSetting({ 
              setting: 'dailyCaloriesGoal', 
              value: data.data.dailyGoals.dailyCaloriesGoal 
            }));
          }
        } catch (error) {
          console.error('Failed to update daily goal settings:', error);
        }
      },
    }),
    updateAllSettings: builder.mutation<UserSettingsResponse, { measurements?: Partial<MeasurementSettings>; dailyGoals?: Partial<DailyGoalSettings> }>({
      query: (settings) => ({
        url: '/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['UserSettings'],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          // Update settings slice with server response
          const { updateMeasurementSetting, updateDailyGoalSetting } = await import('@/features/settings/settingsSlice');
          
          // Update measurement settings
          dispatch(updateMeasurementSetting({ 
            setting: 'weightUnit', 
            value: data.data.measurements.weightUnit 
          }));
          dispatch(updateMeasurementSetting({ 
            setting: 'distanceUnit', 
            value: data.data.measurements.distanceUnit 
          }));
          
          // Update daily goal settings
          dispatch(updateDailyGoalSetting({ 
            setting: 'dailySetsGoal', 
            value: data.data.dailyGoals.dailySetsGoal 
          }));
          dispatch(updateDailyGoalSetting({ 
            setting: 'dailyCaloriesGoal', 
            value: data.data.dailyGoals.dailyCaloriesGoal 
          }));
        } catch (error) {
          console.error('Failed to update all settings:', error);
        }
      },
    }),
  }),
});

export const {
  useCreateUserMutation,
  useGetExercisesQuery,
  useGetFilteredExercisesQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useGetRoutineQuery,
  useDeleteRoutineMutation,
  useCreateWorkoutSessionMutation,
  useGetWorkoutSessionsQuery,
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
  useGetDashboardStatsQuery,
  useGetUserSettingsQuery,
  useUpdateMeasurementSettingsMutation,
  useUpdateDailyGoalSettingsMutation,
  useUpdateAllSettingsMutation,
} = api;