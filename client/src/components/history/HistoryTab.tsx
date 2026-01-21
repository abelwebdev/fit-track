import { useMemo, useState } from "react";
import { Calendar, Flame, Dumbbell, Clock, RefreshCw, History as HistoryIcon, Eye } from "lucide-react";
import { useGetWorkoutSessionsQuery } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkoutSession, Workout } from "@/types/fitness";
import { WorkoutHistoryCard } from "@/components/history/WorkoutHistoryCard";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
};

const extractExerciseName = (exercise: WorkoutSession["exercises"][number]) => {
  if (typeof exercise.exerciseId === "string") return "Exercise";
  return exercise.exerciseId?.name ?? "Exercise";
};

const sessionToWorkout = (session: WorkoutSession): Workout => ({
  id: session._id,
  date: session.createdAt,
  routineId: typeof session.routineId === "string"
    ? session.routineId
    : session.routineId?._id,
  routineName: session.routine?.name,
  routine: session.routine as Workout["routine"],
  exercises: session.exercises.map((exercise, exerciseIdx) => ({
    id: `${session._id}-${exerciseIdx}`,
    exerciseId:
      typeof exercise.exerciseId === "string"
        ? exercise.exerciseId
        : exercise.exerciseId?._id ?? `${session._id}-${exerciseIdx}`,
    exercise_type: exercise.exercise_type,
    sets: exercise.sets.map((set, setIdx) => ({
      id: `${session._id}-${exerciseIdx}-${setIdx}`,
      setType: set.type ?? "normal",
      reps: set.reps,
      weight: set.weight,
      distance: set.distance,
      duration: set.time,
      completed: Boolean(set.done),
      restSeconds: set.rest,
    })),
  })),
  caloriesBurned: session.calories,
  completed: true,
  duration: session.total_duration,
});

const HistoryTab = () => {
  const { data, isLoading, isError, refetch, isFetching } = useGetWorkoutSessionsQuery();
  const sessions = useMemo(() => data?.data ?? [], [data]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const sessionSummaries = useMemo(() => {
    return sessions.map((session) => {
      const totalSets = session.exercises.reduce((sum, exercise) => {
        return sum + exercise.sets.filter((set) => set.done).length;
      }, 0);

      const totalVolume = session.exercises.reduce((volume, exercise) => {
        if (exercise.exercise_type !== 1) return volume;
        return (
          volume +
          exercise.sets.reduce((setVolume, set) => {
            if (!set.done) return setVolume;
            return setVolume + (set.weight ?? 0) * (set.reps ?? 0);
          }, 0)
        );
      }, 0);

      return {
        session,
        totalSets,
        totalVolume,
        exerciseNames: session.exercises.map(extractExerciseName).slice(0, 3),
      };
    });
  }, [sessions]);

  const selectedSummary = useMemo(() => {
    if (!selectedSessionId) return undefined;
    return sessionSummaries.find(({ session }) => session._id === selectedSessionId);
  }, [selectedSessionId, sessionSummaries]);

  const selectedWorkout = useMemo(() => {
    if (!selectedSummary) return null;
    return sessionToWorkout(selectedSummary.session);
  }, [selectedSummary]);

  const handleShowDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    // Small delay to allow modal to close before clearing selection
    setTimeout(() => {
      setSelectedSessionId(null);
    }, 100);
  };

  if (isError) {
    return (
      <div className="glass-card rounded-xl p-6 text-center space-y-4">
        <p className="text-lg font-semibold text-red-400">Unable to load workout history</p>

        <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className="w-4 h-4 mr-2" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workout History</h2>
          <p className="text-muted-foreground">All workouts saved to your account</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="glass-card rounded-xl p-4 space-y-4 animate-pulse">
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-3 w-1/3 bg-muted rounded" />
              <div className="h-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No workouts logged yet. Complete a workout to see it here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessionSummaries.map(({ session, totalSets, totalVolume, exerciseNames }) => (
            <div key={session._id} className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                  {session.routine && (
                    <Badge variant="secondary" className="mt-2">
                      {session?.routine?.name || "Routine"}
                    </Badge>
                  )}
                </div>
                <Badge variant="outline">{session.exercises.length} exercises</Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Dumbbell className="w-3.5 h-3.5" /> Sets
                  </div>
                  <p className="text-lg font-semibold">{totalSets}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Flame className="w-3.5 h-3.5" /> Calories
                  </div>
                  <p className="text-lg font-semibold">{session.calories ?? "—"}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
                    <Clock className="w-3.5 h-3.5" /> Duration
                  </div>
                  <p className="text-lg font-semibold">{formatDuration(session.total_duration)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs w-full hover:bg-primary hover:text-black"
                    onClick={() => handleShowDetails(session._id)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Show Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedWorkout && (
        <WorkoutHistoryCard
          workout={selectedWorkout}
          hideSummary
          initialDetailsOpen={detailsOpen}
          onDetailsClose={handleDetailsClose}
          onEdit={() => refetch()}
          onDelete={() => {
            handleDetailsClose();
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default HistoryTab;
