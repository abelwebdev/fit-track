import { Calendar, Dumbbell, Flame, Timer } from "lucide-react";
import { WorkoutSession } from "@/types/fitness";
import { useMemo } from "react";

interface RecentWorkoutCardProps {
  workout: WorkoutSession;
  delay?: number;
}

export const RecentWorkoutCard = ({ workout, delay = 0 }: RecentWorkoutCardProps) => {
  const stats = useMemo(() => {
    let totalSets = 0;
    let totalVolume = 0;
    let cardioMinutes = 0;
    const exerciseNames: string[] = [];

    workout.exercises.forEach(we => {
      const exercise = typeof we.exerciseId === 'object' ? we.exerciseId : null;
      if (exercise && exercise.name) {
        exerciseNames.push(exercise.name);
        we.sets.forEach(set => {
          if (set.done) {
            totalSets++;
            if (exercise.type === 1) { // cardio type
              cardioMinutes += set.time || 0;
            } else {
              totalVolume += (set.reps || 0) * (set.weight || 0);
            }
          }
        });
      }
    });

    return { totalSets, totalVolume, cardioMinutes, exerciseNames: exerciseNames.slice(0, 3) };
  }, [workout]);

  const formattedDate = new Date(workout.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div 
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 hover:bg-secondary transition-all duration-300 group cursor-pointer animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
          <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate text-sm sm:text-base">
            {stats.exerciseNames.length > 0 
              ? `${stats.exerciseNames.join(', ')}${stats.exerciseNames.length < workout.exercises.length ? '...' : ''}`
              : 'Workout Session'
            }
          </h4>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm">
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm ml-9 sm:ml-0">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{stats.totalSets} sets</span>
        </div>
        {stats.totalVolume > 0 && (
          <div className="flex items-center gap-1.5 text-primary">
            <span>{(stats.totalVolume / 1000).toFixed(1)}k </span>
          </div>
        )}
        {stats.cardioMinutes > 0 && (
          <div className="flex items-center gap-1.5 text-accent">
            <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{stats.cardioMinutes}m</span>
          </div>
        )}
        {workout.calories && (
          <div className="flex items-center gap-1.5 text-orange-400">
            <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{workout.calories}</span>
          </div>
        )}
      </div>
    </div>
  );
};
