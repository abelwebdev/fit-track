import React, { useState } from "react";
import { Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RoutineBuilder } from "@/components/routines/RoutineBuilder";
import { RoutineCard } from "@/components/routines/RoutineCard";
import { WorkoutLogger } from "../workout/WorkoutLogger";
import type { Routine, Workout, WorkoutExercise, SetType } from "@/types/fitness";
import {
  useGetRoutineQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useCreateWorkoutSessionMutation,
  useGetDashboardStatsQuery,
} from "@/services/api";

export const RoutinesTab: React.FC = () => {
  const { data: routines, isLoading, isError, refetch } = useGetRoutineQuery();
  const { data: dashboardData } = useGetDashboardStatsQuery();
  const [createRoutine] = useCreateRoutineMutation();
  const [updateRoutine] = useUpdateRoutineMutation();
  const [createWorkoutSession] = useCreateWorkoutSessionMutation();
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<{ id: string; name: string } | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const routinesArray: Routine[] = Array.isArray(routines) ? routines : routines ? [routines] : [];
  
  // Get stats from dashboard data
  const stats = dashboardData?.data || {
    totalWorkouts: 0,
    weeklyWorkouts: 0,
  };
  const handleSaveRoutine = async (routine: Routine) => {
    try {
      if (editingRoutine) {
        await updateRoutine({ id: editingRoutine._id!, data: routine }).unwrap();
        toast.success("Routine updated!");
      } else {
        await createRoutine(routine).unwrap();
        toast.success("Routine saved!");
      }
      setRoutineDialogOpen(false);
      setEditingRoutine(null);
      refetch();
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "Failed to save routine");
    }
  };
  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineDialogOpen(true);
  };
  const handleDeleteRoutine = (id: string) => {
    const routine = routinesArray.find(r => r._id === id);
    if (routine) {
      setRoutineToDelete({ id, name: routine.name });
      setDeleteConfirmOpen(true);
    }
  };
  const startWorkoutFromRoutine = (routine: Routine) => {
    const workoutExercises: WorkoutExercise[] = routine.exercises.map(re => ({
      id: crypto.randomUUID(),
      exerciseId: re.exerciseId,
      exercise_type: re.exercise_type,
      sets: re.sets.map(s => ({
        id: crypto.randomUUID(),
        setType: s.type,
        reps: s.reps,
        weight: s.weight,
        distance: s.distance,
        duration: s.time,
        completed: false,
        restSeconds: s.rest,
      })),
    }));
    const newWorkout: Workout = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      routine: routine,
      routineId: routine._id,
      routineName: routine.name,
      exercises: workoutExercises,
      completed: false,
    };
    setActiveWorkout(newWorkout);
    setWorkoutStartTime(new Date());
  };
  // Active workout state
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const completeWorkout = async (calories?: number, durationSeconds?: number) => {
    if (!activeWorkout) return;

    const derivedDurationSeconds = durationSeconds ?? (workoutStartTime 
      ? Math.floor((Date.now() - workoutStartTime.getTime()) / 1000)
      : undefined);

    const payload = {
      routineId: activeWorkout.routineId,
      duration: derivedDurationSeconds,
      calories,
      exercises: activeWorkout.exercises.map((exercise, index) => ({
        exerciseId: exercise.exerciseId,
        order: index,
        exercise_type: exercise.exercise_type,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight: set.weight,
          distance: set.distance,
          time: set.duration,
          rest: set.restSeconds,
          type: (set.setType as SetType) ?? 'normal',
          done: set.completed,
        })),
      })),
    };

    try {
      await createWorkoutSession(payload).unwrap();
      setActiveWorkout(null);
      setWorkoutStartTime(null);
      toast.success("Workout logged! 💪");
    } catch (error) {
      console.error("Failed to save workout session:", error);
      toast.error("Failed to save workout session");
      throw error;
    }
  };
  const cancelWorkout = () => {
    setActiveWorkout(null);
    setWorkoutStartTime(null);
  };

  return (
    activeWorkout && workoutStartTime ? (
      <WorkoutLogger 
        workout={activeWorkout}
        onUpdate={setActiveWorkout}
        onComplete={completeWorkout}
        onCancel={cancelWorkout}
        startTime={workoutStartTime}
        weeklyWorkoutCount={stats.weeklyWorkouts + 1}
        totalWorkoutCount={stats.totalWorkouts + 1}
      />
    ) : (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Routines</h2>
            <p className="text-muted-foreground">
              Create and manage workout routines
            </p>
          </div>

          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingRoutine(null);
              setRoutineDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Routine
          </Button>
        </div>

        {/* Routine Builder */}
        <RoutineBuilder
          open={routineDialogOpen}
          onOpenChange={(open) => {
            setRoutineDialogOpen(open);
            if (!open) setEditingRoutine(null);
          }}
          onSave={handleSaveRoutine}
          onDelete={handleDeleteRoutine}
          editRoutine={editingRoutine}
        />

        {/* Routine List */}
        {isError ? (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center gap-2 p-6 bg-red-900/30 rounded-lg border border-red-700">
              <span className="text-3xl">⚠️</span>
              <p className="text-lg font-semibold text-red-400">
                Unable to load routines
              </p>
              <p className="text-sm text-red-300 max-w-xs">
                Something went wrong while fetching your routines.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="glass-card rounded-xl p-5 space-y-4 animate-pulse"
                role="status"
                aria-live="polite"
              >
                <div className="h-5 w-3/4 bg-gray-300/50 rounded"></div>
                <div className="h-4 w-1/2 bg-gray-300/50 rounded"></div>

                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-gray-300/50 rounded"></div>
                  <div className="h-5 w-12 bg-gray-300/50 rounded"></div>
                  <div className="h-5 w-12 bg-gray-300/50 rounded"></div>
                </div>

                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-300/50 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-300/50 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-300/50 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : routinesArray.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {routinesArray.map((routine) => (
              <RoutineCard
                key={routine._id}
                routine={routine}
                onStart={startWorkoutFromRoutine}
                onEdit={handleEditRoutine}
                onDelete={handleDeleteRoutine}
                onUpdate={handleSaveRoutine}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No routines yet. Create your first routine!</p>
          </div>
        )}
      </div>
    )
  );  
};
