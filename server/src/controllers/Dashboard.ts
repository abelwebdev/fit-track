import { FastifyRequest, FastifyReply } from 'fastify';
import WorkoutSessionModel from "../models/WorkoutSession.js";
import admin from "firebase-admin";

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
export const getDashboardStats = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = await extractUserId(request);
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const workouts = await WorkoutSessionModel.find({ userId })
      .populate('exercises.exerciseId', 'name target secondary img type')
      .lean();
    
    // Calculate stats
    let totalVolume = 0;
    let totalWeight = 0;
    let totalSets = 0;
    let totalReps = 0;
    let totalCardioMinutes = 0;
    let totalCardioDistance = 0;
    let totalCaloriesBurned = 0;

    workouts.forEach((workout, workoutIndex) => {
      totalCaloriesBurned += workout.calories || 0;
      
      workout.exercises.forEach((we, exerciseIndex) => {
        we.sets.forEach((set, setIndex) => {
          // Handle cases where 'done' might be missing or different
          const isDone = set.done === true || (set.done !== false && set.done !== undefined && 
            ((set.reps !== undefined && set.reps > 0) || 
             (set.time !== undefined && set.time > 0) || 
             (set.distance !== undefined && set.distance > 0)));
          
          if (isDone) {
            totalSets++;
            
            // More flexible cardio detection
            const hasCardioData = (set.time !== undefined && set.time > 0) || (set.distance !== undefined && set.distance > 0);
            const hasStrengthData = (set.reps !== undefined && set.reps > 0) || (set.weight !== undefined && set.weight > 0);
            
            // If it has cardio data, treat as cardio
            if (hasCardioData) {
              const timeAdded = set.time || 0;
              const distanceAdded = set.distance || 0;
              totalCardioMinutes += timeAdded;
              totalCardioDistance += distanceAdded;
            }
            
            // If it has strength data, treat as strength (some exercises might have both)
            if (hasStrengthData) {
              const setReps = set.reps || 0;
              const setWeight = set.weight || 0;
              const weightAdded = setWeight * setReps;
              totalReps += setReps;
              totalWeight += weightAdded;
              totalVolume += weightAdded;
            }
            
          }
        });
      });
    });
    // Get today's workouts for daily progress
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.createdAt);
      return workoutDate >= today && workoutDate < tomorrow;
    });

    let todayCalories = 0;
    let todaySets = 0;

    todayWorkouts.forEach(workout => {
      todayCalories += workout.calories || 0;
      workout.exercises.forEach(we => {
        todaySets += we.sets.filter(s => s.done).length;
      });
    });

    // Get weekly workouts with daily breakdown
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyWorkouts = workouts.filter(w => new Date(w.createdAt) >= weekAgo);

    // Calculate weekly volume
    let weeklyVolume = 0;
    weeklyWorkouts.forEach(workout => {
      workout.exercises.forEach(we => {
        we.sets.forEach(set => {
          if (set.done && we.exercise_type !== 1) { // Only non-cardio exercises
            weeklyVolume += (set.reps || 0) * (set.weight || 0);
          }
        });
      });
    });

    // Generate daily workout data for the week
    const generateDailyData = () => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);

      return days.map((day, index) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + index);
        const dateStart = new Date(date);
        const dateEnd = new Date(date);
        dateEnd.setDate(dateEnd.getDate() + 1);
        
        const dayWorkouts = workouts.filter(w => {
          const workoutDate = new Date(w.createdAt);
          return workoutDate >= dateStart && workoutDate < dateEnd;
        });
        
        let volume = 0;
        dayWorkouts.forEach(workout => {
          workout.exercises.forEach(we => {
            we.sets.forEach(set => {
              if (set.done && we.exercise_type !== 1) {
                volume += (set.reps || 0) * (set.weight || 0);
              }
            });
          });
        });

        return { 
          day, 
          value: Math.round(volume / 100) || 0, // Scale down for display
          workouts: dayWorkouts.length,
          volume: volume
        };
      });
    };

    const dailyData = generateDailyData();

    // Get recent workouts (last 5)
    const recentWorkouts = workouts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    const stats = {
      totalWorkouts: workouts.length,
      totalVolume,
      totalWeight,
      totalSets,
      totalReps,
      totalCardioMinutes,
      totalCardioDistance,
      totalCaloriesBurned,
      todayCalories,
      todaySets,
      weeklyWorkouts: weeklyWorkouts.length,
      weeklyVolume,
      dailyData,
      recentWorkouts: recentWorkouts.map(({ routineId, ...workout }) => ({
        ...workout,
        routine: typeof routineId === 'object' ? routineId : undefined,
      }))
    };

    return reply.code(200).send({ status: "success", data: stats });
  } catch (err: any) {
    console.error("Failed to fetch dashboard stats:", err);
    return reply.code(500).send({ message: err.message || "Failed to fetch dashboard stats" });
  }
};