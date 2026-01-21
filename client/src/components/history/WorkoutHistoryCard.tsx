import type { Workout, SetType, Routine, WorkoutSet } from "@/types/fitness";
import { format } from "date-fns";
import { Calendar, Dumbbell, Flame, Timer, Eye, Pencil, Trash2, X, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  useUpdateWorkoutMutation,
  useDeleteWorkoutMutation,
  type CreateWorkoutSessionPayload,
} from "@/services/api";
import { selectMeasurementSettings } from "@/features/settings/settingsSlice";
import { useAppSelector } from "@/app/hooks";

interface WorkoutHistoryCardProps {
  workout: Workout;
  onEdit?: (workout: Workout) => void;
  onDelete?: (id: string) => void;
  hideSummary?: boolean;
  initialDetailsOpen?: boolean;
  onDetailsClose?: () => void;
}

export const WorkoutHistoryCard = ({
  workout,
  onEdit,
  onDelete,
  hideSummary = false,
  initialDetailsOpen = false,
  onDetailsClose,
}: WorkoutHistoryCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(initialDetailsOpen || false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedWorkout, setEditedWorkout] = useState(workout);
  const measurementSettings = useAppSelector(selectMeasurementSettings);
  const [updateWorkout, { isLoading: isUpdating }] = useUpdateWorkoutMutation();
  const [deleteWorkout, { isLoading: isDeleting }] = useDeleteWorkoutMutation();

  const routineExerciseMap = useMemo(() => {
    if (!workout.routine?.exercises?.length) return new Map<string, Routine["exercises"][number]>();
    return new Map(workout.routine.exercises.map((routineExercise) => [routineExercise.exerciseId, routineExercise]));
  }, [workout.routine]);

  const resolveExerciseMeta = (exerciseId: string | undefined) => {
    if (!exerciseId) return null;
    
    const routineExercise = routineExerciseMap.get(exerciseId);
    if (routineExercise) {
      return {
        name: routineExercise.name,
        muscleGroup: routineExercise.target,
        image: routineExercise.img,
        exercise_type: routineExercise.exercise_type,
      };
    }
    return null;
  };

  const getExerciseDisplay = (exerciseId: string | undefined, fallbackType: number) => {
    const meta = resolveExerciseMeta(exerciseId);
    return {
      name: meta?.name ?? "Custom Exercise",
      muscleGroup: meta?.muscleGroup ?? "custom",
      image: meta?.image,
      exercise_type: meta?.exercise_type ?? fallbackType,
    };
  };

  const [displayWorkout, setDisplayWorkout] = useState(workout);

  useEffect(() => {
    setDisplayWorkout(workout);
  }, [workout]);

  // Fix: Update detailsOpen when initialDetailsOpen changes
  useEffect(() => {
    setDetailsOpen(initialDetailsOpen || false);
  }, [initialDetailsOpen]);

  useEffect(() => {
    if (!isEditing) {
      setEditedWorkout(displayWorkout);
    }
  }, [displayWorkout, isEditing]);

  const parseFloatOrUndefined = (value: string) => {
    if (value === "") return undefined;
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parseIntOrUndefined = (value: string) => {
    if (value === "") return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const totalSets = displayWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.completed).length, 0);
  const totalVolume = displayWorkout.exercises.reduce((sum, exercise) => {
    const display = getExerciseDisplay(exercise.exerciseId, exercise.exercise_type);
    if (display.exercise_type === 3) return sum;
    return sum + exercise.sets.reduce((setSum, set) => (set.completed ? setSum + (set.reps || 0) * (set.weight || 0) : setSum), 0);
  }, 0);

  const handleSave = async () => {
    try {
      await updateWorkout({ id: workout.id, body: mapWorkoutToPayload(editedWorkout) }).unwrap();
      setDisplayWorkout(editedWorkout);
      onEdit?.(editedWorkout);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update workout:', error);
    }
  };

  const mapWorkoutToPayload = (data: Workout): CreateWorkoutSessionPayload => ({
    routineId: data.routineId,
    duration: data.duration,
    calories: data.caloriesBurned,
    exercises: data.exercises.map((exercise, index) => {
      const display = getExerciseDisplay(exercise.exerciseId, exercise.exercise_type);
      return {
        exerciseId: exercise.exerciseId,
        exercise_type: display.exercise_type,
        order: index,
        sets: exercise.sets.map((set) => ({
          reps: set.reps,
          weight: set.weight,
          distance: set.distance,
          time: set.duration,
          rest: set.restSeconds,
          type: set.setType as SetType,
          done: set.completed,
        })),
      };
    }),
  });

  const handleCancel = () => {
    setEditedWorkout(displayWorkout);
    setIsEditing(false);
  };

  const updateSetValue = (exerciseIdx: number, setIdx: number, field: keyof WorkoutSet, value: string | number | boolean | undefined) => {
    const newExercises = [...editedWorkout.exercises];
    newExercises[exerciseIdx] = {
      ...newExercises[exerciseIdx],
      sets: newExercises[exerciseIdx].sets.map((s, i) => 
        i === setIdx ? { ...s, [field]: value } : s
      )
    };
    setEditedWorkout({ ...editedWorkout, exercises: newExercises });
  };

  return (
    <>
      {!hideSummary && (
        <div className="glass-card rounded-xl p-3 sm:p-4 space-y-3">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="font-medium text-sm sm:text-base">
                  {format(new Date(displayWorkout.date), "EEEE, MMM d, yyyy")}
                </span>
              </div>
              {(displayWorkout.routineName || displayWorkout.routine?.name) && (
                <Badge variant="secondary" className="text-xs">
                  {displayWorkout.routineName || displayWorkout.routine?.name}
                </Badge>
              )}
            </div>
            <Badge variant={displayWorkout.completed ? "default" : "outline"} className="text-xs">
              {displayWorkout.completed ? "Completed" : "Incomplete"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center py-2">
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs sm:text-sm">
                <Dumbbell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Sets</span>
                <span className="sm:hidden">Sets</span>
              </div>
              <p className="font-bold text-base sm:text-lg">{totalSets}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs sm:text-sm">
                <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Volume ({measurementSettings.weightUnit})</span>
                <span className="sm:hidden">Vol ({measurementSettings.weightUnit})</span>
              </div>
              <p className="font-bold text-base sm:text-lg">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs sm:text-sm">
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Calories</span>
                <span className="sm:hidden">Cal</span>
              </div>
              <p className="font-bold text-base sm:text-lg">{displayWorkout.caloriesBurned || 0}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 text-xs sm:text-sm"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
              <span className="hidden sm:inline">Show Details</span>
              <span className="sm:hidden">Details</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs sm:text-sm"
              onClick={() => {
                setDetailsOpen(true);
                setIsEditing(true);
              }}
            >
              <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Edit
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={(open) => {
        setDetailsOpen(open);
        if (!open) {
          setIsEditing(false);
          setEditedWorkout(displayWorkout);
          onDetailsClose?.();
        }
      }}>
        <DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span className="hidden sm:inline">
                  {format(new Date(displayWorkout.date), "EEEE, MMM d, yyyy")}
                </span>
                <span className="sm:hidden">
                  {format(new Date(displayWorkout.date), "MMM d, yyyy")}
                </span>
              </DialogTitle>

              {isEditing ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isUpdating} className="text-xs sm:text-sm">
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                    <span className="hidden sm:inline">{isUpdating ? 'Saving...' : 'Save'}</span>
                    <span className="sm:hidden">{isUpdating ? '...' : 'Save'}</span>
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-2 mb-4">
            {(displayWorkout.routineName || displayWorkout.routine?.name) && (
              <Badge variant="secondary" className="text-xs sm:text-sm">
                {displayWorkout.routineName || displayWorkout.routine?.name}
              </Badge>
            )}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center py-2 glass-card rounded-lg p-2 sm:p-3">
              <div>
                <p className="text-xs text-muted-foreground">Sets</p>
                <p className="font-bold text-base sm:text-lg">{totalSets}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="font-bold text-base sm:text-lg">{totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Calories</p>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={editedWorkout.caloriesBurned ?? ""}
                    onChange={(e) => setEditedWorkout({
                      ...editedWorkout,
                      caloriesBurned: parseIntOrUndefined(e.target.value),
                    })}
                    className="h-6 sm:h-8 w-12 sm:w-16 mx-auto text-center text-xs sm:text-sm"
                  />
                ) : (
                  <p className="font-bold text-base sm:text-lg">{displayWorkout.caloriesBurned || 0}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {(isEditing ? editedWorkout : displayWorkout).exercises.map((exercise, exerciseIdx) => {
              const display = getExerciseDisplay(exercise.exerciseId, exercise.exercise_type);
              const completedSets = exercise.sets.filter((set) => set.completed);

              return (
                <div key={exercise.id ?? `${exercise.exerciseId}-${exerciseIdx}`} className="glass-card rounded-lg p-2 sm:p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {display.image ? (
                      <img src={display.image} alt={display.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        {display.name.slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-xs sm:text-sm block truncate">{display.name}</span>
                      <p className="text-xs text-muted-foreground capitalize">{display.muscleGroup}</p>
                    </div>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {completedSets.length}/{exercise.sets.length}
                    </Badge>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <div className="grid grid-cols-5 gap-1 text-xs text-muted-foreground">
                      <span>Set</span>
                      <span className="hidden sm:inline">Type</span>
                      <span className="sm:hidden">T</span>
                      {display.exercise_type === 3 ? (
                        <>
                          <span className="hidden sm:inline">Distance ({measurementSettings.distanceUnit})</span>
                          <span className="sm:hidden">Dist</span>
                          <span>Time (min) </span>
                        </>
                      ) : display.exercise_type === 2 ? (
                        <span className="col-span-2">Reps</span>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Weight ({measurementSettings.weightUnit})</span>
                          <span className="sm:hidden">Wt</span>
                          <span>Reps</span>
                        </>
                      )}
                      <span className="text-center">✓</span>
                    </div>
                    {exercise.sets.map((set, setIdx) => (
                      <div
                        key={set.id ?? `${exerciseIdx}-${setIdx}`}
                        className="grid grid-cols-5 gap-1 text-xs sm:text-sm items-center"
                      >
                        {/* Set number */}
                        <span>{setIdx + 1}</span>

                        {/* Set type */}
                        <span className="text-xs capitalize truncate">{set.setType || "normal"}</span>

                        {/* Values columns */}
                        {display.exercise_type === 3 ? (
                          // DISTANCE + TIME
                          isEditing ? (
                            <>
                              <Input
                                type="number"
                                value={set.distance ?? ""}
                                onChange={(e) =>
                                  updateSetValue(exerciseIdx, setIdx, "distance", parseFloatOrUndefined(e.target.value))
                                }
                                className="h-5 sm:h-6 text-xs"
                              />
                              <Input
                                type="number"
                                value={set.duration ?? ""}
                                onChange={(e) =>
                                  updateSetValue(exerciseIdx, setIdx, "duration", parseIntOrUndefined(e.target.value))
                                }
                                className="h-5 sm:h-6 text-xs"
                              />
                            </>
                          ) : (
                            <>
                              <span className="truncate">{set.distance || "-"}</span>
                              <span className="truncate">{set.duration || "-"}</span>
                            </>
                          )
                        ) : display.exercise_type === 2 ? (
                          // REPS ONLY (span 2 columns)
                          isEditing ? (
                            <Input
                              type="number"
                              value={set.reps ?? ""}
                              onChange={(e) =>
                                updateSetValue(exerciseIdx, setIdx, "reps", parseIntOrUndefined(e.target.value))
                              }
                              className="h-5 sm:h-6 text-xs col-span-2"
                            />
                          ) : (
                            <span className="col-span-2 truncate">{set.reps || "-"}</span>
                          )
                        ) : (
                          // WEIGHT + REPS
                          isEditing ? (
                            <>
                              <Input
                                type="number"
                                value={set.weight ?? ""}
                                onChange={(e) =>
                                  updateSetValue(exerciseIdx, setIdx, "weight", parseFloatOrUndefined(e.target.value))
                                }
                                className="h-5 sm:h-6 text-xs"
                              />
                              <Input
                                type="number"
                                value={set.reps ?? ""}
                                onChange={(e) =>
                                  updateSetValue(exerciseIdx, setIdx, "reps", parseIntOrUndefined(e.target.value))
                                }
                                className="h-5 sm:h-6 text-xs"
                              />
                            </>
                          ) : (
                            <>
                              <span className="truncate">{set.weight || "-"}</span>
                              <span className="truncate">{set.reps || "-"}</span>
                            </>
                          )
                        )}

                        {/* Done column */}
                        <span
                          className={`text-center ${set.completed ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {set.completed ? "✓" : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t">
            {isEditing ? (
              showDeleteConfirm ? (
                <div className="flex flex-col gap-2 w-full">
                  <p className="text-xs sm:text-sm text-center text-muted-foreground">Are you sure you want to delete this workout?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 text-xs sm:text-sm"
                      onClick={async () => {
                        try {
                          await deleteWorkout(workout.id).unwrap();
                          onDelete?.(workout.id);
                          setDetailsOpen(false);
                          setIsEditing(false);
                          setShowDeleteConfirm(false);
                        } catch (error) {
                          console.error("Failed to delete workout:", error);
                        }
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Confirm Delete"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs sm:text-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Delete Workout
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                className="w-full text-xs sm:text-sm"
                onClick={() => setDetailsOpen(false)}
              >
                Close
              </Button>
            )}
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};