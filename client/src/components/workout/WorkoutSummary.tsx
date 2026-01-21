import { useMemo, useState } from "react";
import { Workout, MuscleGroup, RoutineExercise } from "@/types/fitness";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Flame,
  Clock,
  Dumbbell,
  TrendingUp,
  Calendar,
  Activity,
  Check,
  Target,
} from "lucide-react";

interface WorkoutSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout: Workout;
  duration: number;
  weeklyWorkoutCount: number;
  totalWorkoutCount: number;
  onComplete: (calories?: number) => void;
}

export const WorkoutSummary = ({
  open,
  onOpenChange,
  workout,
  duration,
  weeklyWorkoutCount,
  totalWorkoutCount,
  onComplete,
}: WorkoutSummaryProps) => {
  const [caloriesInput, setCaloriesInput] = useState("");

  /* ---------------------------------- utils --------------------------------- */
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  };

  /* ------------------------ routine exercise lookup -------------------------- */
  const routineExerciseMap = useMemo(() => {
    const map = new Map<string, RoutineExercise>();
    workout.routine?.exercises?.forEach(ex =>
      map.set(ex.exerciseId, ex)
    );
    return map;
  }, [workout.routine]);

  /* ------------------------------ stats -------------------------------------- */
  const totalSets = workout.exercises.reduce(
    (sum, we) => sum + we.sets.filter(s => s.completed).length,
    0
  );

  // Strength volume only (exercise_type === 1)
  const totalVolume = workout.exercises.reduce((sum, we) => {
    const ex = routineExerciseMap.get(we.exerciseId);
    if (!ex || ex.exercise_type !== 1) return sum;

    return (
      sum +
      we.sets.reduce((setSum, s) => {
        if (!s.completed) return setSum;
        return setSum + (s.reps ?? 0) * (s.weight ?? 0);
      }, 0)
    );
  }, 0);

  /* --------------------------- muscle groups --------------------------------- */
  const primaryMuscles: MuscleGroup[] = [];
  const secondaryMuscles: MuscleGroup[] = [];

  workout.exercises.forEach(we => {
    const ex = routineExerciseMap.get(we.exerciseId);
    if (!ex) return;

    if (ex.target && !primaryMuscles.includes(ex.target as MuscleGroup)) {
      primaryMuscles.push(ex.target as MuscleGroup);
    }

    ex.secondary?.forEach(muscle => {
      if (
        !primaryMuscles.includes(muscle as MuscleGroup) &&
        !secondaryMuscles.includes(muscle as MuscleGroup)
      ) {
        secondaryMuscles.push(muscle as MuscleGroup);
      }
    });
  });

  /* -------------------------- exercise details ------------------------------- */
  const exerciseDetails = workout.exercises.map((we, index) => {
    const exerciseMeta = routineExerciseMap.get(we.exerciseId) || null;
    return {
      workoutExercise: we,
      exerciseMeta,
      completedSets: we.sets.filter(s => s.completed),
      index,
    };
  });

  /* ------------------------------ actions ------------------------------------ */
  const handleComplete = () => {
    onComplete(caloriesInput ? parseInt(caloriesInput) : undefined);
  };

  /* -------------------------------- render ----------------------------------- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            Workout Complete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {workout.routineName && (
            <div className="text-center">
              <Badge variant="secondary">{workout.routineName}</Badge>
            </div>
          )}

          {/* Summary */}
          <div className="glass-card rounded-xl p-5 bg-primary/10 border">
            {/* Duration */}
            <div className="text-center mb-4">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold">{formatTime(duration)}</p>
              <p className="text-sm text-muted-foreground">Total Duration</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-4" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Stat icon={Dumbbell} label="Sets" value={totalSets} />
              <Stat
                icon={TrendingUp}
                label="Volume"
                value={
                  totalVolume > 1000
                    ? `${(totalVolume / 1000).toFixed(1)}k`
                    : totalVolume
                }
              />
              <Stat
                icon={Activity}
                label="Exercises"
                value={workout.exercises.length}
              />
            </div>
          </div>

          {/* Calories */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <p className="font-medium text-sm">Calories Burned (optional)</p>
            </div>
            <Input
              type="number"
              placeholder="e.g. 350"
              value={caloriesInput}
              onChange={e => setCaloriesInput(e.target.value)}
            />
          </div>

          {/* Exercises */}
          <div>
            <h4 className="text-sm font-medium mb-2">Exercises Performed</h4>
            <div className="space-y-3">
              {exerciseDetails.map(({ workoutExercise, exerciseMeta, completedSets, index }) => {
                const exerciseName = exerciseMeta?.name ?? `Exercise ${index + 1}`;
                const targetLabel = exerciseMeta?.target ?? 'custom';
                const totalSetsForExercise = workoutExercise.sets.length;
                const exerciseType = exerciseMeta?.exercise_type ?? workoutExercise.exercise_type;

                return (
                  <div key={`${workoutExercise.id}-${index}`} className="p-3 bg-secondary/30 rounded-lg space-y-2">
                  <div className="flex items-center gap-3">
                    {exerciseMeta?.img ? (
                      <img
                        src={exerciseMeta.img}
                        alt={exerciseName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {exerciseName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{exerciseName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {targetLabel} · {completedSets.length}/{totalSetsForExercise} sets
                      </p>
                    </div>
                  </div>

                  {completedSets.length > 0 ? (
                    completedSets.map((set, i) => (
                      <div key={set.id ?? `${workoutExercise.id}-set-${i}`} className="text-xs flex gap-2">
                        <span className="w-12 text-muted-foreground">Set {i + 1}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {set.setType || 'normal'}
                        </Badge>
                        {exerciseType === 3 ? (
                          <span>
                            {set.distance ?? "-"} km · {set.duration ?? "-"} min
                          </span>
                        ) : exerciseType === 2 ? (
                          <span>
                            {set.reps ?? "-"} reps
                          </span>
                        ) : (
                          <span>
                            {set.weight ?? "-"} lbs × {set.reps ?? "-"} reps
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No sets completed yet.
                    </p>
                  )}
                </div>
              );
              })}
            </div>
          </div>

          {/* Muscle Map */}
          <div className="glass-card rounded-xl p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
              <Dumbbell className="w-4 h-4" /> Muscles Targeted
            </h4>
            {/* <MuscleMap
              activeMuscles={primaryMuscles}
              secondaryMuscles={secondaryMuscles}
            /> */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {primaryMuscles.map(m => (
                <Badge key={m} className="capitalize">
                  {m}
                </Badge>
              ))}
              {secondaryMuscles.map(m => (
                <Badge key={m} variant="secondary" className="capitalize">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button onClick={handleComplete}>Save Workout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------------------- small components ------------------------------- */
interface StatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

const Stat = ({ icon: Icon, label, value }: StatProps) => (
  <div className="glass-card rounded-xl p-3 text-center">
    <Icon className="w-4 h-4 mx-auto mb-1 text-primary" />
    <p className="text-xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

interface RowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

const Row = ({ icon: Icon, label, value }: RowProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <p className="text-sm">{label}</p>
    </div>
    <p className="text-xl font-bold">{value}</p>
  </div>
);