export type MuscleGroup = 
  'abductors' | 'abs' | 'adductors' | 'biceps' | 'calves' | 'cardiovascular system' | 'delts' | 'forearms' |
  'glutes' | 'hamstrings' | 'lats' | 'levator scapulae' | 'pectorals' | 'quads' | 'serratus anterior' | 'spine' |
  'traps' | 'triceps' | 'upper back'
export type EquipmentType = 
  'assisted' | 'band' | 'barbell' | 'body weight' | 'bosu ball' | 'cable' | 'dumbbell' | 'elliptical machine' |
  'ez barbell' | 'hammer' | 'kettlebell' | 'leverage machine' | 'medicine ball' | 'olympic barbell' | 'resistance band' | 
  'roller' | 'rope' | 'skierg machine' | 'sled machine' | 'smith machine' | 'stability ball' | 'stationary bike' |
  'stepmill machine' | 'tire' | 'trap bar' | 'upper body ergometer' | 'weighted' | 'wheel roller'

export type SetType = 'warmup' | 'normal' | 'dropset' | 'failure';

export interface Exercise {
  _id: string;
  name: string;
  target: MuscleGroup;
  secondary?: MuscleGroup[];
  equipment: EquipmentType;
  img?: string;
  gifurl?: string;
  type: number;
}

export interface WorkoutSet {
  id: string;
  setType: string;
  reps?: number;
  weight?: number;
  distance?: number;
  duration?: number;
  completed: boolean;
  restSeconds?: number;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exercise_type: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string;
  routineId?: string;
  routineName?: string;
  routine?: Routine;
  exercises: WorkoutExercise[];
  caloriesBurned?: number;
  notes?: string;
  completed: boolean;
  duration?: number; // total workout time in minutes
}

export interface WorkoutSessionSet {
  reps?: number;
  weight?: number;
  distance?: number;
  time?: number;
  rest?: number;
  type?: SetType;
  done?: boolean;
}

export interface WorkoutSessionExercise {
  exerciseId:
    | string
    | {
        _id: string;
        name?: string;
        target?: MuscleGroup;
        secondary?: MuscleGroup[];
        img?: string;
        type?: number;
      };
  order: number;
  exercise_type: number;
  sets: WorkoutSessionSet[];
}

export interface WorkoutSession {
  _id: string;
  userId: string;
  routineId?: string | { _id: string; name?: string; exercises?: Routine['exercises'] };
  routine?: { _id: string; name?: string; exercises?: Routine['exercises'] };
  exercises: WorkoutSessionExercise[];
  calories?: number;
  total_duration?: number;
  createdAt: string;
  updatedAt: string;
}

// Routine exercise configuration
export interface RoutineExerciseSet {
  id: string;
  type: string;
  reps?: number;
  weight?: number;
  distance?: number;
  time?: number;
  rest: number;
}

export interface RoutineExercise {
  exerciseId: string;
  name: string;
  sets: RoutineExerciseSet[];
  type: number;
  target: string;
  secondary: string[];
  equipment: string;
  img: string;
  gif: string;
  exercise_type: number;
}

export interface Routine {
  _id?: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number; // total weight lifted (volume)
  totalWeight: number; // total weight moved
  totalSets: number;
  totalReps: number;
  totalCardioMinutes: number;
  totalCardioDistance: number;
  totalCaloriesBurned: number;
  todayCalories: number;
  todaySets: number;
  weeklyWorkouts: number;
  weeklyVolume: number;
  dailyData: { day: string; value: number; workouts: number; volume: number; }[];
  recentWorkouts: WorkoutSession[];
}
