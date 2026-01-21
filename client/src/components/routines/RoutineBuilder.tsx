import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Dumbbell, Timer, GripVertical, Search, ListPlus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExerciseFilters } from "@/components/exercises/ExerciseFilters";
import { Exercise, Routine, RoutineExercise, RoutineExerciseSet, SetType } from "@/types/fitness";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGetExercisesQuery, useGetFilteredExercisesQuery, useCreateRoutineMutation, useUpdateRoutineMutation, useDeleteRoutineMutation } from "@/services/api";
import { selectMeasurementSettings } from "@/features/settings/settingsSlice";
import { useAppSelector } from "@/app/hooks";

interface RoutineBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (routine: Routine) => void;
  onDelete?: (id: string) => void;
  editRoutine?: Routine | null;
}

// Backend set format (from API)
interface BackendSet {
  id?: string;
  setType?: SetType;
  type?: SetType;
  targetReps?: number;
  reps?: number;
  targetWeight?: number;
  weight?: number;
  targetDistance?: number;
  distance?: number;
  targetDuration?: number;
  time?: number;
  restSeconds?: number;
  rest?: number;
}

// Backend exercise format (from API)
interface BackendExercise {
  exerciseId: string | { _id?: string; toString?: () => string };
  name: string;
  target: string;
  secondary?: string[];
  type?: number;
  exercise_type?: number;
  img: string;
  gif?: string;
  gifurl?: string;
  equipment: string;
  sets?: BackendSet[];
}

// Transform backend set format to frontend format
const transformBackendSetToFrontend = (backendSet: BackendSet): RoutineExerciseSet => {
  return {
    id: backendSet.id || crypto.randomUUID(),
    type: backendSet.setType || backendSet.type || 'normal',
    reps: backendSet.targetReps !== undefined ? backendSet.targetReps : backendSet.reps,
    weight: backendSet.targetWeight !== undefined ? backendSet.targetWeight : backendSet.weight,
    distance: backendSet.targetDistance !== undefined ? backendSet.targetDistance : backendSet.distance,
    time: backendSet.targetDuration !== undefined ? backendSet.targetDuration : backendSet.time,
    rest: backendSet.restSeconds !== undefined ? backendSet.restSeconds : (backendSet.rest ?? 0),
  };
};

// Transform backend exercise format to frontend format
const transformBackendExerciseToFrontend = (backendExercise: BackendExercise): RoutineExercise => {
  const exerciseId = typeof backendExercise.exerciseId === 'object' 
    ? backendExercise.exerciseId._id || backendExercise.exerciseId.toString?.() || String(backendExercise.exerciseId)
    : String(backendExercise.exerciseId);
  
  return {
    exerciseId,
    name: backendExercise.name,
    target: backendExercise.target,
    secondary: backendExercise.secondary || [],
    type: backendExercise.type !== undefined ? backendExercise.type : (backendExercise.exercise_type ?? 1),
    img: backendExercise.img,
    gif: backendExercise.gif || backendExercise.gifurl || '',
    equipment: backendExercise.equipment,
    exercise_type: backendExercise.exercise_type !== undefined ? backendExercise.exercise_type : (backendExercise.type ?? 1),
    sets: (backendExercise.sets || []).map(set => transformBackendSetToFrontend(set)),
  };
};

export const RoutineBuilder = ({ open, onOpenChange, onDelete, editRoutine }: RoutineBuilderProps) => {
  const [routineName, setRoutineName] = useState("");
  const measurementSettings = useAppSelector(selectMeasurementSettings);
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [mobileTab, setMobileTab] = useState<'exercises' | 'library'>('exercises');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const hasFilters =
  muscleFilter !== 'all' || equipmentFilter !== 'all';
  const [createRoutine, { isLoading: isCreating }] = useCreateRoutineMutation();
  const [updateRoutine, { isLoading: isUpdating }] = useUpdateRoutineMutation();
  const [deleteRoutine] = useDeleteRoutineMutation();
  const {
    data: exercises,
    isLoading: isExerciseLoading,
  } = useGetExercisesQuery(
    { page, limit: 12, name: search },
    { skip: hasFilters }
  );
  const {
    data: filteredResponse,
    isLoading: isFilteredLoading,
  } = useGetFilteredExercisesQuery(
    {
      muscle: muscleFilter !== 'all' ? muscleFilter : undefined,
      equipment: equipmentFilter !== 'all' ? equipmentFilter : undefined,
      page,
      limit: 12,
      name: search,
    },
    { skip: !hasFilters }
  );
  const exercisesToShow = hasFilters
    ? filteredResponse?.data ?? []
    : exercises?.data ?? [];
  // For general exercises
  const totalItems = exercises?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / 12);
  // For filtered exercises
  const filteredTotalItems = filteredResponse?.totalItems || 0;
  const filteredTotalPages = Math.ceil(filteredTotalItems / 12);
  const currentTotalPages = hasFilters ? filteredTotalPages : totalPages;
  
  // Get routine ID (handle both id and _id from API)
  const routineId = editRoutine?._id || (editRoutine as unknown as Record<string, unknown>)?._id as string || null;
  
  // Load edit data when dialog opens or editRoutine changes
  useEffect(() => {
    if (open && editRoutine) {
      setRoutineName(editRoutine.name || "");
      // Check if exercises need transformation (backend format) or are already in frontend format
      const transformedExercises = editRoutine.exercises 
        ? editRoutine.exercises.map(exercise =>
            transformBackendExerciseToFrontend(exercise as BackendExercise)
          )
        : [];
      setSelectedExercises(transformedExercises);
    } else if (!open) {
      // Reset form when dialog closes
      setRoutineName("");
      setSelectedExercises([]);
      setMobileTab('exercises');
      setSearch("");
      setMuscleFilter("all");
      setEquipmentFilter("all");
      setPage(1);
    }
  }, [open, editRoutine]);
  useEffect(() => {
    setPage(1);
  }, [muscleFilter, equipmentFilter, search]);
  
  const addExercise = (exercise: Exercise) => {
    const exists = selectedExercises.find(e => e.exerciseId === exercise._id);
    if (exists) {
      toast.info("Exercise already added");
      return;
    }
    const newExercise: RoutineExercise = {
      exerciseId: exercise._id,
      name: exercise.name,
      target: exercise.target,
      secondary: exercise.secondary,
      type: exercise.type,
      img: exercise.img,
      gif: exercise.gifurl,
      equipment: exercise.equipment,
      exercise_type: exercise.type,
      sets: [{
        id: crypto.randomUUID(),
        type: 'normal',
        reps: 0,
        weight: 0,
        distance: 0,
        time: 0,
        rest: 0,
      }],
    };
    setSelectedExercises(prev => [...prev, newExercise]);
    if (isMobile) setMobileTab('exercises');
  };
  const addSet = (exerciseId: string) => {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.exerciseId === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: RoutineExerciseSet = {
          id: crypto.randomUUID(),
          type: lastSet?.type || 'normal',
          reps: lastSet?.reps,
          weight: lastSet?.weight,
          distance: lastSet?.distance,
          time: lastSet?.time,
          rest: lastSet?.rest,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
  };
  const removeSet = (exerciseId: string, setId: string) => {
    setSelectedExercises(prev => prev.map(ex => {
      if (ex.exerciseId === exerciseId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
      }
      return ex;
    }));
  };
  const updateSet = useCallback((exerciseId: string, setId: string, updates: Partial<RoutineExerciseSet>) => {
    setSelectedExercises(prev => {
      let hasChanges = false;
      const updated = prev.map(ex => {
        if (ex.exerciseId === exerciseId) {
          const updatedSets = ex.sets.map(s => {
            if (s.id === setId) {
              // Check if any value actually changed
              const hasValueChanges = Object.keys(updates).some(key => {
                const typedKey = key as keyof RoutineExerciseSet;
                return s[typedKey] !== updates[typedKey];
              });
              
              if (hasValueChanges) {
                hasChanges = true;
                return { ...s, ...updates };
              }
              return s;
            }
            return s;
          });
          
          if (hasChanges) {
            return { ...ex, sets: updatedSets };
          }
        }
        return ex;
      });
      
      // Only return new array if there were actual changes
      return hasChanges ? updated : prev;
    });
  }, []);
  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.exerciseId !== exerciseId));
  };
  const handleSave = async () => {
    if (!routineName.trim()) {
      toast.error("Enter a routine name");
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error("Add at least one exercise");
      return;
    }
    const routine: Routine = {
      name: routineName,
      exercises: selectedExercises,
      createdAt: editRoutine?.createdAt || new Date().toISOString(),
    };
    try {
      if (routineId) {
        await updateRoutine({
          id: routineId,
          data: routine,
        }).unwrap();
        toast.success("Routine updated");
      } else {
        await createRoutine(routine).unwrap();
        toast.success("Routine created");
      }
      resetForm();
    } catch (err) {
      toast.error("Failed to save routine");
      console.error(err);
    }
  };
  const handleDeleteClick = () => {
    if (routineId) {
      setDeleteConfirmOpen(true);
    }
  };
  const confirmDelete = async () => {
    if (!routineId) return;
    
    try {
      await deleteRoutine(routineId).unwrap();
      toast.success("Routine deleted");
      setDeleteConfirmOpen(false);
      resetForm();
      // Also call onDelete prop if provided (for parent component cleanup)
      if (onDelete) {
        onDelete(routineId);
      }
    } catch (err: unknown) {
      const error = err as { data?: { message?: string } };
      toast.error(error?.data?.message || "Failed to delete routine");
      setDeleteConfirmOpen(false);
    }
  };
  const resetForm = () => {
    setRoutineName("");
    setSelectedExercises([]);
    setMobileTab('exercises');
    onOpenChange(false);
  };
  // Mobile set row component
  const MobileSetRow = ({ routineEx, set, index }: { routineEx: RoutineExercise; set: RoutineExerciseSet; index: number }) => (
    <div className="space-y-2 p-3 bg-secondary/30 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Set {index + 1}</span>
        {routineEx.sets.length > 1 && (
          <Button 
            size="icon" 
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => removeSet(routineEx.exerciseId, set.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <Select 
        value={set.type} 
        onValueChange={(value: SetType) => updateSet(routineEx.exerciseId, set.id, { type: value })}
      >
        <SelectTrigger className="h-9 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="warmup">Warmup</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="dropset">Dropset</SelectItem>
          <SelectItem value="failure">Failure</SelectItem>
        </SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-2">
        {routineEx.type === 1 && (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Weight</label>
              <Input
                key={`m-weight-${routineEx.exerciseId}-${set.id}-${set.weight ?? ''}`}
                type="number"
                placeholder="0"
                defaultValue={set.weight !== undefined && set.weight !== null ? String(set.weight) : '0'}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  const num = value === '' ? undefined : Number(value);
                  if (num !== undefined && !isNaN(num)) {
                    updateSet(routineEx.exerciseId, set.id, {
                      weight: num,
                    });
                  } else if (value === '') {
                    updateSet(routineEx.exerciseId, set.id, {
                      weight: undefined,
                    });
                  }
                }}
                className="h-9 bg-background"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Reps</label>
              <Input
                key={`m-reps-${routineEx.exerciseId}-${set.id}-${set.reps ?? ''}`}
                type="number"
                placeholder="0"
                defaultValue={set.reps !== undefined && set.reps !== null ? String(set.reps) : '0'}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  const num = value === '' ? undefined : Number(value);
                  if (num !== undefined && !isNaN(num)) {
                    updateSet(routineEx.exerciseId, set.id, {
                      reps: num,
                    });
                  } else if (value === '') {
                    updateSet(routineEx.exerciseId, set.id, {
                      reps: undefined,
                    });
                  }
                }}
                className="h-9 bg-background"
              />
            </div>
          </>
        )}
        {routineEx.type === 2 && (
          <div>
            <label className="text-xs text-muted-foreground">Reps</label>
            <Input
              key={`m-reps2-${routineEx.exerciseId}-${set.id}-${set.reps ?? ''}`}
              type="number"
              placeholder="0"
              defaultValue={set.reps !== undefined && set.reps !== null ? String(set.reps) : '0'}
              onBlur={(e) => {
                const value = e.target.value.trim();
                const num = value === '' ? undefined : Number(value);
                if (num !== undefined && !isNaN(num)) {
                  updateSet(routineEx.exerciseId, set.id, {
                    reps: num,
                  });
                } else if (value === '') {
                  updateSet(routineEx.exerciseId, set.id, {
                    reps: undefined,
                  });
                }
              }}
              className="h-9 bg-background"
            />
          </div>
        )}
        {routineEx.type === 3 && (
          <>
            <div>
              <label className="text-xs text-muted-foreground">Distance (km)</label>
              <Input
                key={`m-distance-${routineEx.exerciseId}-${set.id}-${set.distance ?? ''}`}
                type="number"
                step="0.1"
                placeholder="0"
                defaultValue={set.distance !== undefined && set.distance !== null ? String(set.distance) : '0'}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  const num = value === '' ? undefined : Number(value);
                  if (num !== undefined && !isNaN(num)) {
                    updateSet(routineEx.exerciseId, set.id, {
                      distance: num,
                    });
                  } else if (value === '') {
                    updateSet(routineEx.exerciseId, set.id, {
                      distance: undefined,
                    });
                  }
                }}
                className="h-9 bg-background"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Time (min)</label>
              <Input
                key={`m-duration-${routineEx.exerciseId}-${set.id}-${set.time ?? ''}`}
                type="number"
                placeholder="0"
                defaultValue={set.time !== undefined && set.time !== null ? String(set.time) : '0'}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  const num = value === '' ? undefined : Number(value);
                  if (num !== undefined && !isNaN(num)) {
                    updateSet(routineEx.exerciseId, set.id, {
                      time: num,
                    });
                  } else if (value === '') {
                    updateSet(routineEx.exerciseId, set.id, {
                      time: undefined,
                    });
                  }
                }}
                className="h-9 bg-background"
              />
            </div>
          </>
        )}
      </div>
      <div>
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Timer className="w-3 h-3" /> Rest (seconds)
        </label>
        <Input
          key={`m-rest-${routineEx.exerciseId}-${set.id}-${set.rest ?? ''}`}
          type="number"
          placeholder="60"
          defaultValue={set.rest !== undefined && set.rest !== null ? String(set.rest) : ''}
          onBlur={(e) => {
            const value = e.target.value.trim();
            const num = value === '' ? undefined : Number(value);
            if (num !== undefined && !isNaN(num)) {
              updateSet(routineEx.exerciseId, set.id, { 
                rest: num,
              });
            } else if (value === '') {
              updateSet(routineEx.exerciseId, set.id, { 
                rest: undefined,
              });
            }
          }}
          className="h-9 bg-background"
        />
      </div>
    </div>
  );
  const SortableExerciseCard = ({
    routineEx,
    children,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    routineEx: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    children: (listeners: any) => React.ReactNode;
  }) => {
    const {
      setNodeRef,
      attributes,
      listeners,
      transform,
      transition,
    } = useSortable({ id: routineEx.exerciseId });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes}>
        {children(listeners)}
      </div>
    );
  };
  // Selected exercises content
  const SelectedExercisesContent = () => (
    <div className="space-y-4">
      {selectedExercises.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No exercises added yet</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setMobileTab("library")}
          >
            <ListPlus className="w-4 h-4 mr-1" /> Browse Exercises
          </Button>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={(event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            setSelectedExercises((items) => {
              const oldIndex = items.findIndex(
                (i) => i.exerciseId === active.id
              );
              const newIndex = items.findIndex(
                (i) => i.exerciseId === over.id
              );
              return arrayMove(items, oldIndex, newIndex);
            });
          }}
        >
          <SortableContext
            items={selectedExercises.map((e) => e.exerciseId)}
            strategy={verticalListSortingStrategy}
          >
            {selectedExercises.map((routineEx) => {
              if (!routineEx) return null;
              return (
                <SortableExerciseCard
                  key={routineEx.exerciseId}
                  routineEx={routineEx}
                >
                  {(listeners) => (
                    <div className="glass-card rounded-xl p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* DRAG HANDLE */}
                          <GripVertical
                            {...listeners}
                            className="w-4 h-4 text-muted-foreground/50 shrink-0 cursor-grab active:cursor-grabbing"
                          />

                          {/* Image → GIF on hover */}
                          <div className="relative group w-20 h-20 shrink-0">
                            <img
                              src={routineEx.img}
                              alt={routineEx.name}
                              className="absolute inset-0 w-full h-full rounded-md object-cover border transition-opacity duration-200 group-hover:opacity-0"
                              loading="lazy"
                            />
                            <img
                              src={routineEx.gif}
                              alt={`${routineEx.name} demo`}
                              className="absolute inset-0 w-full h-full rounded-md object-cover border opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                              loading="lazy"
                            />
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <h4
                              className="font-medium text-sm truncate"
                              title={routineEx.name}
                            >
                              {routineEx.name}
                            </h4>

                            <div className="flex flex-wrap gap-1 mt-1.5">
                              <Badge className="text-xs capitalize">
                                {routineEx.target}
                              </Badge>
                              {routineEx.secondary?.map((muscle) => (
                                <Badge
                                  key={muscle}
                                  variant="secondary"
                                  className="text-xs capitalize"
                                >
                                  {muscle}
                                </Badge>
                              ))}
                            </div>

                            <Badge
                              variant="outline"
                              className="text-xs capitalize mt-1.5 border-white"
                            >
                              {routineEx.equipment}
                            </Badge>
                          </div>
                        </div>
                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() =>
                            removeExercise(routineEx.exerciseId)
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* SETS */}
                      {isMobile ? (
                        <div className="space-y-2">
                          {routineEx.sets.map((set, index) => (
                            <MobileSetRow
                              key={set.id}
                              routineEx={routineEx}
                              set={set}
                              index={index}
                            />
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              addSet(routineEx.exerciseId)
                            }
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Set
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-2">
                            <div className="col-span-1">Set</div>
                            <div className="col-span-2">Type</div>
                            {routineEx.type === 1 && (
                              <>
                                <div className="col-span-2">Weight ({measurementSettings.weightUnit})</div>
                                <div className="col-span-2">Reps</div>
                              </>
                            )}
                            {routineEx.type === 2 && <div className="col-span-2">Reps</div>}
                            {routineEx.type === 3 && (
                              <>
                                <div className="col-span-2">Distance ({measurementSettings.distanceUnit})</div>
                                <div className="col-span-2">Time (min)</div>
                              </>
                            )}
                            <div className="col-span-3">
                              <div className="flex items-center gap-1">
                                <Timer className="w-3 h-3" /> Rest
                              </div>
                            </div>
                            <div className="col-span-2"></div>
                          </div>
                          {routineEx.sets.map((set, index) => (
                            <div key={set.id} className="grid grid-cols-12 gap-2 items-center">
                              <div className="col-span-1 text-sm font-medium text-center">
                                {index + 1}
                              </div>
                              <div className="col-span-2">
                                <Select
                                  value={set.type}
                                  onValueChange={(value: SetType) =>
                                    updateSet(routineEx.exerciseId, set.id, {
                                      type: value,
                                    })
                                  }
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
                              {routineEx.type === 1 && (
                                <>
                                  <div className="col-span-2">
                                    <Input
                                      key={`weight-${routineEx.exerciseId}-${set.id}-${set.weight ?? ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      placeholder="0"
                                      defaultValue={
                                        set.weight !== undefined && set.weight !== null
                                          ? String(set.weight)
                                          : ""
                                      }
                                      onBlur={(e) => {
                                        const value = e.target.value.trim();
                                        const num =
                                          value === "" ? undefined : Number(value);
                                        updateSet(routineEx.exerciseId, set.id, {
                                          weight: num,
                                        });
                                      }}
                                      className="h-8 bg-secondary/50"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Input
                                      key={`reps-${routineEx.exerciseId}-${set.id}-${set.reps ?? ''}`}
                                      type="text"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      placeholder="0"
                                      defaultValue={
                                        set.reps !== undefined && set.reps !== null
                                          ? String(set.reps)
                                          : ""
                                      }
                                      onBlur={(e) => {
                                        const value = e.target.value.trim();
                                        const num = value === "" ? undefined : Number(value);
                                        updateSet(routineEx.exerciseId, set.id, {
                                          reps: num,
                                        });
                                      }}
                                      className="h-8 bg-secondary/50"
                                    />
                                  </div>
                                </>
                              )}
                              {routineEx.type === 2 && (
                                <div className="col-span-2">
                                  <Input
                                    key={`reps-only-${routineEx.exerciseId}-${set.id}-${set.reps ?? ''}`}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="0"
                                    defaultValue={
                                      set.reps !== undefined && set.reps !== null
                                        ? String(set.reps)
                                        : ""
                                    }
                                    onBlur={(e) => {
                                      const value = e.target.value.trim();
                                      const num =
                                        value === "" ? undefined : Number(value);
                                      updateSet(routineEx.exerciseId, set.id, {
                                        reps: num,
                                      });
                                    }}
                                    className="h-8 bg-secondary/50"
                                  />
                                </div>
                              )}
                              {routineEx.type === 3 && (
                                <>
                                  <div className="col-span-2">
                                    <Input
                                      key={`distance-${routineEx.exerciseId}-${set.id}-${set.distance ?? ''}`}
                                      type="text"
                                      inputMode="decimal"
                                      pattern="[0-9]*"
                                      step="0.1"
                                      placeholder="0"
                                      defaultValue={
                                        set.distance !== undefined && set.distance !== null
                                          ? String(set.distance)
                                          : ""
                                      }
                                      onBlur={(e) => {
                                        const value = e.target.value.trim();
                                        const num =
                                          value === "" ? undefined : Number(value);
                                        updateSet(routineEx.exerciseId, set.id, {
                                          distance: num,
                                        });
                                      }}
                                      className="h-8 bg-secondary/50"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <Input
                                      key={`duration-${routineEx.exerciseId}-${set.id}-${set.time ?? ''}`}
                                      type="text"
                                      inputMode="decimal"
                                      pattern="[0-9]*"
                                      placeholder="0"
                                      defaultValue={
                                        set.time !== undefined && set.time !== null
                                          ? String(set.time)
                                          : ""
                                      }
                                      onBlur={(e) => {
                                        const value = e.target.value.trim();
                                        const num =
                                          value === "" ? undefined : Number(value);
                                        updateSet(routineEx.exerciseId, set.id, {
                                          time: num,
                                        });
                                      }}
                                      className="h-8 bg-secondary/50"
                                    />
                                  </div>
                                </>
                              )}
                              <div className="col-span-3">
                                <Input
                                  key={`rest-${routineEx.exerciseId}-${set.id}-${set.rest ?? ''}`}
                                  type="number"
                                  placeholder="60"
                                  defaultValue={
                                    set.rest !== undefined && set.rest !== null
                                      ? String(set.rest)
                                      : ""
                                  }
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    const num =
                                      value === "" ? undefined : Number(value);
                                    updateSet(routineEx.exerciseId, set.id, {
                                      rest: num,
                                    });
                                  }}
                                  className="h-8 bg-secondary/50"
                                />
                              </div>
                              <div className="col-span-2 flex justify-end">
                                {routineEx.sets.length > 1 && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    onClick={() =>
                                      removeSet(routineEx.exerciseId, set.id)
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => addSet(routineEx.exerciseId)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Set
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </SortableExerciseCard>
              );
            })}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
  // Exercise library content
  const ExerciseLibraryContent = () => (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 bg-background"
        />
      </div>
      <ExerciseFilters
        search=""
        onSearchChange={() => {}}
        muscleFilter={muscleFilter}
        onMuscleChange={setMuscleFilter}
        equipmentFilter={equipmentFilter}
        onEquipmentChange={setEquipmentFilter}
        compact
      />
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {exercisesToShow.map(exercise => {
          const isSelected = selectedExercises.some(
            e => e.exerciseId === exercise._id
          );
          return (
            <button
              key={exercise._id}
              onClick={() => addExercise(exercise)}
              disabled={isSelected}
              className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-primary/10 text-primary cursor-default'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="font-medium text-sm">{exercise.name}</div>
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs capitalize">
                  {exercise.target}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {exercise.equipment}
                </Badge>
              </div>
            </button>
          );
        })}
        <div className="flex justify-center mt-4 gap-2 items-center">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 rounded-full flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {currentTotalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, currentTotalPages))}
            disabled={page === currentTotalPages}
            className="px-4 py-2 bg-gray-800 rounded-full flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
  // Footer actions
  const FooterActions = () => (
    <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
      <div>
        {editRoutine && onDelete && routineId && (
          <Button 
            variant="destructive" 
            size={isMobile ? "sm" : "default"}
            className="w-full sm:w-auto"
            onClick={handleDeleteClick}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none" onClick={resetForm}>
          Cancel
        </Button>
        <Button 
          size={isMobile ? "sm" : "default"}
          className="flex-1 sm:flex-none"
          onClick={handleSave}
          disabled={selectedExercises.length === 0 || !routineName.trim() || isCreating || isUpdating}
        >
          {editRoutine ? (isUpdating ? 'Updating...' : 'Update') : (isCreating ? 'Creating...' : 'Save')}
        </Button>
      </div>
    </div>
  );
  // Delete Confirmation Dialog
  const DeleteConfirmationDialog = () => (
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Routine</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{routineName || 'this routine'}</strong>? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Mobile view - use Drawer
  if (isMobile) {
    return (
      <>
        <DeleteConfirmationDialog />
        <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="pb-2 shrink-0">
            <DrawerTitle className="flex items-center gap-2 text-base">
              <Dumbbell className="w-4 h-4 text-primary" />
              {editRoutine ? 'Edit Routine' : 'Create Routine'}
            </DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-2">
            <Input 
              placeholder="Routine name"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="bg-background"
            />
          </div>

          {/* Mobile tabs */}
          <div className="flex border-b mx-4">
            <button
              onClick={() => setMobileTab('exercises')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                mobileTab === 'exercises' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Exercises ({selectedExercises.length})
            </button>
            <button
              onClick={() => setMobileTab('library')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                mobileTab === 'library' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Add Exercise
            </button>
          </div>

          <ScrollArea className="flex-1 max-h-[80vh]">
            <div className="p-4">
              {mobileTab === 'exercises' ? <SelectedExercisesContent /> : <ExerciseLibraryContent />}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <FooterActions />
          </div>
        </DrawerContent>
      </Drawer>
      </>
    );
  }
  // Desktop view - use Dialog
  return (
    <>
      <DeleteConfirmationDialog />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            {editRoutine ? 'Edit Routine' : 'Create Routine'}
          </DialogTitle>
          <div className="mt-4">
            <Input 
              placeholder="Enter routine name (e.g., Push Day)"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="bg-background text-lg font-medium"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Selected Exercises with Edit Options */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b bg-muted/20">
              <h3 className="font-medium text-sm">
                Selected Exercises ({selectedExercises.length})
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <SelectedExercisesContent />
              </div>
            </ScrollArea>
          </div>

          {/* Right: Exercise List */}
          <div className="w-72 border-l flex flex-col bg-muted/20">
            <div className="p-3 border-b">
              <ExerciseLibraryContent />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t">
          <FooterActions />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};