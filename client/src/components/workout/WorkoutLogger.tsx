import { useState, useEffect, useMemo } from "react";
import { Check, Plus, Trash2, X, Timer, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Workout, WorkoutSet, SetType, RoutineExercise } from "@/types/fitness";
import { WorkoutSummary } from "./WorkoutSummary";

interface WorkoutLoggerProps {
  workout: Workout;
  onUpdate: (workout: Workout) => void;
  onComplete: (calories?: number, durationSeconds?: number) => void | Promise<void>;
  onCancel: () => void;
  startTime: Date;
  weeklyWorkoutCount: number;
  totalWorkoutCount: number;
}
const SET_TYPE_COLORS: Record<SetType, string> = {
  warmup: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  normal: 'bg-primary/20 text-primary border-primary/30',
  dropset: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  failure: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const WorkoutLogger = ({ workout, onUpdate, onComplete, onCancel, startTime, weeklyWorkoutCount, totalWorkoutCount }: WorkoutLoggerProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeRestTimer, setActiveRestTimer] = useState<{ exerciseId: string; setId: string; seconds: number } | null>(null);
  const [restCountdown, setRestCountdown] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [finalDuration, setFinalDuration] = useState(0);
  const routineExerciseMap = useMemo(() => {
    const map = new Map<string, RoutineExercise>();
    workout.routine?.exercises?.forEach((routineExercise) => {
      map.set(routineExercise.exerciseId, routineExercise);
    });
    return map;
  }, [workout.routine]);

  // Workout timer - pauses when summary is shown
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, isPaused]);
  // Rest countdown timer
  useEffect(() => {
    if (restCountdown <= 0) {
      setActiveRestTimer(null);
      return;
    }
    const interval = setInterval(() => {
      setRestCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [restCountdown]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const addSet = (exerciseId: string) => {
    const updatedExercises = workout.exercises.map(we => {
      if (we.id === exerciseId) {
        const lastSet = we.sets[we.sets.length - 1];
        const newSet: WorkoutSet = {
          id: crypto.randomUUID(),
          setType: lastSet?.setType || 'normal',
          reps: undefined,
          weight: undefined,
          completed: false,
          restSeconds: lastSet?.restSeconds || 60,
        };
        return { ...we, sets: [...we.sets, newSet] };
      }
      return we;
    });
    onUpdate({ ...workout, exercises: updatedExercises });
  };
  const updateSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    const updatedExercises = workout.exercises.map(we => {
      if (we.id === exerciseId) {
        const updatedSets = we.sets.map(set => 
          set.id === setId ? { ...set, ...updates } : set
        );
        return { ...we, sets: updatedSets };
      }
      return we;
    });
    onUpdate({ ...workout, exercises: updatedExercises });
  };
  const removeSet = (exerciseId: string, setId: string) => {
    const updatedExercises = workout.exercises.map(we => {
      if (we.id === exerciseId) {
        return { ...we, sets: we.sets.filter(s => s.id !== setId) };
      }
      return we;
    });
    onUpdate({ ...workout, exercises: updatedExercises });
  };
  const toggleSetComplete = (exerciseId: string, setId: string) => {
    const we = workout.exercises.find(e => e.id === exerciseId);
    const set = we?.sets.find(s => s.id === setId);
    if (set) {
      const newCompleted = !set.completed;
      updateSet(exerciseId, setId, { completed: newCompleted });
      // Start rest timer when completing a set
      if (newCompleted && set.restSeconds) {
        setActiveRestTimer({ exerciseId, setId, seconds: set.restSeconds });
        setRestCountdown(set.restSeconds);
      }
    }
  };
  const handleCompleteClick = () => {
    setIsPaused(true);
    setFinalDuration(elapsedTime);
    setShowSummary(true);
  };
  const handleFinalComplete = (calories?: number) => {
    setShowSummary(false);
    onComplete(calories, finalDuration);
  };
  const handleSummaryClose = (open: boolean) => {
    setShowSummary(open);
    if (!open) {
      setIsPaused(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with workout timer */}
      <div className="glass-card rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 sticky top-16 sm:top-20 z-40 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-bold">Active Workout</h2>
          {workout.routineName && (
            <Badge variant="secondary" className="text-xs">{workout.routineName}</Badge>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-base sm:text-lg font-mono bg-primary/10 px-3 sm:px-4 py-2 rounded-lg">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="font-bold">{formatTime(elapsedTime)}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs sm:text-sm">
            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>

      {/* Rest Timer Display - Fixed at bottom */}
      {activeRestTimer && restCountdown > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 animate-fade-in">
          <div className="container mx-auto max-w-2xl">
            <div className="glass-card rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-primary/10 border border-primary/30 shadow-lg backdrop-blur-xl">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Timer className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Rest Timer</p>
                  <p className="text-2xl sm:text-3xl font-bold font-mono">{formatTime(restCountdown)}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setRestCountdown(0)} className="text-xs sm:text-sm">
                Skip Rest
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise List */}
      {workout.exercises.length > 0 ? (
        workout.exercises.map((workoutExercise, exerciseIndex) => {
          const routineExercise = routineExerciseMap.get(workoutExercise.exerciseId);
          const exerciseName = routineExercise?.name ?? `Exercise ${exerciseIndex + 1}`;
          const exerciseImg = routineExercise?.img;
          const exerciseGif = routineExercise?.gif;
          const muscleTarget = routineExercise?.target;
          const muscleSecondary = routineExercise?.secondary;
          const exerciseEquipment = routineExercise?.equipment;
          const exerciseType = routineExercise?.exercise_type ?? workoutExercise.exercise_type;

          return (
            <div key={workoutExercise.id} className="glass-card rounded-xl p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 relative flex-shrink-0">
                    <img
                      src={exerciseImg} // static image
                      alt={exerciseName}
                      className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
                    />
                    {exerciseGif && (
                      <img
                        src={exerciseGif} // gif
                        alt={exerciseName}
                        className="absolute top-0 left-0 w-full h-full object-cover rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                  </div>
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-lg truncate w-full">{exerciseName}</h3>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
                      {muscleTarget && (
                        <Badge
                          variant="default"
                          className="text-xs capitalize inline-block px-1.5 sm:px-2 py-0.5 sm:py-1"
                        >
                          {muscleTarget}
                        </Badge>
                      )}
                      {muscleSecondary?.slice(0, 2).map((muscle) => (
                        <Badge
                          key={muscle}
                          variant="secondary"
                          className="text-xs capitalize inline-block px-1.5 sm:px-2 py-0.5 sm:py-1"
                        >
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                    {exerciseEquipment && (
                      <Badge
                        variant="outline"
                        className="text-xs capitalize mt-1 sm:mt-2 border-white px-1.5 sm:px-2 py-0.5 sm:py-1"
                      >
                        {exerciseEquipment}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {/* Mobile: Stacked layout, Desktop: Grid layout */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-2">
                    <div className="col-span-1">Set</div>
                    <div className="col-span-2">Type</div>
                    {exerciseType === 1 && (
                      <>
                        <div className="col-span-2">Weight</div>
                        <div className="col-span-2">Reps</div>
                      </>
                    )}
                    {exerciseType === 2 && (
                      <>
                        <div className="col-span-2">Reps</div>
                      </>
                    )}
                    {exerciseType === 3 && (
                      <>
                        <div className="col-span-2">Distance</div>
                        <div className="col-span-2">Time</div>
                      </>
                    )}
                    <div className="col-span-2">Rest (s)</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                
                {workoutExercise.sets.map((set, index) => (
                  <div key={set.id}>
                    {/* Mobile Layout */}
                    <div className="sm:hidden">
                      <div className={`p-3 rounded-lg transition-colors space-y-3 ${
                        set.completed ? 'bg-primary/10' : 'bg-secondary/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Set {index + 1}</span>
                          <div className="flex gap-1">
                            <Button 
                              size="icon" 
                              variant={set.completed ? "default" : "outline"}
                              className="h-7 w-7"
                              onClick={() => toggleSetComplete(workoutExercise.id, set.id)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeSet(workoutExercise.id, set.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Type</label>
                            <Select 
                              value={set.setType} 
                              onValueChange={(value: SetType) => updateSet(workoutExercise.id, set.id, { setType: value })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="warmup">Warmup</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="dropset">Dropset</SelectItem>
                                <SelectItem value="failure">Failure</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {exerciseType === 1 && (
                              <>
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">Weight</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={set.weight ?? ''}
                                    onChange={(e) =>
                                      updateSet(workoutExercise.id, set.id, {
                                        weight: parseFloat(e.target.value) || undefined,
                                      })
                                    }
                                    className="h-8 bg-background/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">Reps</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={set.reps ?? ''}
                                    onChange={(e) =>
                                      updateSet(workoutExercise.id, set.id, {
                                        reps: parseInt(e.target.value) || undefined,
                                      })
                                    }
                                    className="h-8 bg-background/50"
                                  />
                                </div>
                              </>
                            )}
                            {exerciseType === 2 && (
                              <div className="col-span-2">
                                <label className="text-xs text-muted-foreground block mb-1">Reps</label>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={set.reps ?? ''}
                                  onChange={(e) =>
                                    updateSet(workoutExercise.id, set.id, {
                                      reps: parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  className="h-8 bg-background/50"
                                />
                              </div>
                            )}
                            {exerciseType === 3 && (
                              <>
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">Distance</label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="0"
                                    value={set.distance ?? ''}
                                    onChange={(e) =>
                                      updateSet(workoutExercise.id, set.id, {
                                        distance: parseFloat(e.target.value) || undefined,
                                      })
                                    }
                                    className="h-8 bg-background/50"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground block mb-1">Time</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={set.duration ?? ''}
                                    onChange={(e) =>
                                      updateSet(workoutExercise.id, set.id, {
                                        duration: parseInt(e.target.value) || undefined,
                                      })
                                    }
                                    className="h-8 bg-background/50"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">Rest (seconds)</label>
                            <Input
                              type="number"
                              placeholder="60"
                              value={set.restSeconds || ''}
                              onChange={(e) => updateSet(workoutExercise.id, set.id, { restSeconds: parseInt(e.target.value) || 60 })}
                              className="h-8 bg-background/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:block">
                      <div 
                        className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
                          set.completed ? 'bg-primary/10' : 'bg-secondary/30'
                        }`}
                      >
                        <div className="col-span-1 text-sm font-medium">{index + 1}</div>
                        <div className="col-span-2">
                          <Select 
                            value={set.setType} 
                            onValueChange={(value: SetType) => updateSet(workoutExercise.id, set.id, { setType: value })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warmup">Warmup</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="dropset">Dropset</SelectItem>
                              <SelectItem value="failure">Failure</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Strength (type 1) */}
                        {exerciseType === 1 && (
                          <>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="0"
                                value={set.weight ?? ''}
                                onChange={(e) =>
                                  updateSet(workoutExercise.id, set.id, {
                                    weight: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="h-8 bg-background/50"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="0"
                                value={set.reps ?? ''}
                                onChange={(e) =>
                                  updateSet(workoutExercise.id, set.id, {
                                    reps: parseInt(e.target.value) || undefined,
                                  })
                                }
                                className="h-8 bg-background/50"
                              />
                            </div>
                          </>
                        )}
                        {/* Bodyweight (type 2) */}
                        {exerciseType === 2 && (
                          <>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="0"
                                value={set.reps ?? ''}
                                onChange={(e) =>
                                  updateSet(workoutExercise.id, set.id, {
                                    reps: parseInt(e.target.value) || undefined,
                                  })
                                }
                                className="h-8 bg-background/50"
                              />
                            </div>
                          </>
                        )}
                        {/* Time-based / Cardio (type 3) */}
                        {exerciseType === 3 && (
                          <>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="0"
                                value={set.distance ?? ''}
                                onChange={(e) =>
                                  updateSet(workoutExercise.id, set.id, {
                                    distance: parseFloat(e.target.value) || undefined,
                                  })
                                }
                                className="h-8 bg-background/50"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="0"
                                value={set.duration ?? ''}
                                onChange={(e) =>
                                  updateSet(workoutExercise.id, set.id, {
                                    duration: parseInt(e.target.value) || undefined,
                                  })
                                }
                                className="h-8 bg-background/50"
                              />
                            </div>
                          </>
                        )}
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="0"
                            value={set.restSeconds || ''}
                            onChange={(e) => updateSet(workoutExercise.id, set.id, { restSeconds: parseInt(e.target.value) || 60 })}
                            className="h-8 bg-background/50"
                          />
                        </div>
                        <div className="col-span-3 flex justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant={set.completed ? "default" : "outline"}
                            className="h-8 w-8"
                            onClick={() => toggleSetComplete(workoutExercise.id, set.id)}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeSet(workoutExercise.id, set.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full mt-2 text-xs sm:text-sm"
                  onClick={() => addSet(workoutExercise.id)}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Add Set
                </Button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="glass-card rounded-xl p-3 sm:p-4 text-center text-muted-foreground">
          <p className="text-sm sm:text-base">No exercises available for this workout yet.</p>
        </div>
      )}

      {/* Complete Workout Button at the end */}
      <div className="glass-card rounded-xl p-4 sm:p-6 flex flex-col items-center gap-3 sm:gap-4">
        <div className="text-center">
          <h3 className="font-semibold text-base sm:text-lg">Finished your workout?</h3>
          <p className="text-muted-foreground text-xs sm:text-sm">Duration: {formatTime(elapsedTime)}</p>
        </div>
        <Button size="lg" onClick={handleCompleteClick} className="w-full max-w-xs text-sm sm:text-base">
          <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Complete Workout
        </Button>
      </div>

      {/* Workout Summary Dialog */}
      <WorkoutSummary
        open={showSummary}
        onOpenChange={handleSummaryClose}
        workout={workout}
        duration={finalDuration}
        weeklyWorkoutCount={weeklyWorkoutCount}
        totalWorkoutCount={totalWorkoutCount}
        onComplete={handleFinalComplete}
      />
    </div>
  );
};