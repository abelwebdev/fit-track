import { useState } from "react";
import { Dumbbell, Play, Pencil, Eye, Plus, Trash2, Timer } from "lucide-react";
import { Routine, SetType, RoutineExercise, RoutineExerciseSet } from "@/types/fitness";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { selectMeasurementSettings } from "@/features/settings/settingsSlice";
import { useAppSelector } from "@/app/hooks";

interface RoutineCardProps {
  routine: Routine;
  onStart: (routine: Routine) => void;
  onEdit: (routine: Routine) => void;
  onDelete: (id: string) => void;
  onUpdate?: (routine: Routine) => void;
};
const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Warmup',
  normal: 'Normal',
  dropset: 'Dropset',
  failure: 'Failure',
};

export const RoutineCard = ({ routine, onStart, onEdit, onUpdate }: RoutineCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedExercises, setEditedExercises] = useState<RoutineExercise[]>([]);
  const isMobile = useIsMobile();
  const measurementSettings = useAppSelector(selectMeasurementSettings);
  
  // Use the exercise data that's already in the routine
  const exerciseDetails = routine.exercises;
  const muscleGroups = [...new Set(exerciseDetails.map(re => re.target))];
  const totalSets = routine.exercises.reduce((sum, re) => sum + re.sets.length, 0);

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedExercises([]);
  };

  const saveEditing = () => {
    if (onUpdate) {
      onUpdate({ ...routine, exercises: editedExercises });
    }
    setIsEditing(false);
    setEditedExercises([]);
  };

  const getEditedExerciseDetails = () => {
    return editedExercises.map(re => {
      // Use the exercise data from the routine itself
      const routineExercise = routine.exercises.find(e => e.exerciseId === re.exerciseId);
      return { ...re, ...routineExercise };
    }).filter(re => re);
  };

  // Read-only set row
  const ReadOnlySetRow = ({ set, setIdx, type }: { set: RoutineExerciseSet; setIdx: number; type: number }) => (
    <div className="grid grid-cols-5 gap-1 text-sm items-center">
      <span>{setIdx + 1}</span>
      <span className="text-xs">{SET_TYPE_LABELS[set.type || 'normal']}</span>
      {type === 1 && (
        <>
          <span>{set.weight || '-'}</span>
          <span>{set.reps || '-'}</span>
        </>
      )}
      {type === 2 && (
        <>
          <span>{set.reps || '-'}</span>
        </>
      )}
      {type === 3 && (
        <>
          <span>{set.distance || '-'}</span>
          <span>{set.time || '-'}</span>
        </>
      )}
      <span className="text-muted-foreground">{set.rest || 60}s</span>
    </div>
  );

  const ModalContent = () => {
    const displayExercises = isEditing ? getEditedExerciseDetails() : exerciseDetails;
    const editedTotalSets = isEditing 
      ? editedExercises.reduce((sum, re) => sum + re.sets.length, 0)
      : totalSets;
    return (
      <>
        <div className="space-y-2 mb-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {routine.exercises.length} exercises · {editedTotalSets} sets
          </p>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {muscleGroups.map(mg => (
              <Badge key={mg} variant="secondary" className="capitalize text-xs">
                {mg}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[40vh] sm:max-h-[50vh] pr-2 sm:pr-4">
          <div className="space-y-3 sm:space-y-4">
            {displayExercises.map((re, exerciseIdx) => {
              if (!re) return null;
              const routineEx = isEditing 
                ? editedExercises.find(e => e.exerciseId === re.exerciseId)
                : routine.exercises.find(e => e.exerciseId === re.exerciseId);
              if (!routineEx) return null;
              return (
                <div key={exerciseIdx} className="glass-card rounded-lg p-2 sm:p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {re.img && (
                      <img 
                        src={re.img} 
                        alt={re.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-xs sm:text-sm truncate block">{re.name}</span>
                      <p className="text-xs text-muted-foreground capitalize">{re.target}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {routineEx.sets.length} sets
                    </Badge>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-border/50">
                    <div className="grid grid-cols-5 gap-1 text-xs text-muted-foreground">
                      <span>Set</span>
                      <span>Type</span>
                      {re.exercise_type === 1 && (
                        <>
                          <span>Weight ({measurementSettings.weightUnit})</span>
                          <span>Reps</span>
                        </>
                      )}
                      {re.exercise_type === 2 && (
                        <>
                          <span>Reps</span>
                        </>
                      )}
                      {re.exercise_type === 3 && (
                        <>
                          <span>Distance ({measurementSettings.distanceUnit})</span>
                          <span>Duration (min)</span>
                        </>
                      )}
                      <span>Rest</span>
                    </div>
                    {routineEx.sets.map((set, setIdx) => (
                      <ReadOnlySetRow 
                        key={set.id} 
                        set={set} 
                        setIdx={setIdx} 
                        type={re.exercise_type} 
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-3 sm:pt-4">
          {isEditing ? (
            <>
              <Button variant="outline" className="flex-1 text-xs sm:text-sm" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button className="flex-1 text-xs sm:text-sm" onClick={saveEditing}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1 text-xs sm:text-sm" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button className="flex-1 text-xs sm:text-sm" onClick={() => {
                setDetailsOpen(false);
                onStart(routine);
              }}>
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Start
              </Button>
            </>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      <div className="glass-card rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-base sm:text-lg">{routine.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {routine.exercises.length} exercises · {totalSets} sets
            </p>
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-muted-foreground h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => onEdit(routine)}
            >
              <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button size="sm" onClick={() => onStart(routine)} className="text-xs sm:text-sm">
              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Start
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-1.5">
          {muscleGroups.map(mg => (
            <Badge key={mg} variant="secondary" className="capitalize text-xs">
              {mg}
            </Badge>
          ))}
        </div>
        {/* Collapsed view */}
        <div className="space-y-1 sm:space-y-2">
          {exerciseDetails.slice(0, 3).map((re, index) => (
            <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
              <Dumbbell className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
              <span className="flex-1 truncate">{re?.name}</span>
              <span className="text-muted-foreground">{re.sets.length} sets</span>
            </div>
          ))}
          {routine.exercises.length > 3 && (
            <p className="text-xs text-muted-foreground pl-4 sm:pl-5">
              +{routine.exercises.length - 3} more exercises
            </p>
          )}
        </div>
        {/* Show Details Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full hover:bg-primary hover:text-black text-xs sm:text-sm"
          onClick={() => setDetailsOpen(true)}
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Show Details
        </Button>
      </div>
      {/* Details Modal - Drawer on mobile, Dialog on desktop */}
      {isMobile ? (
        <Drawer open={detailsOpen} onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) cancelEditing();
        }}>
          <DrawerContent className="max-h-[90vh] sm:max-h-[85vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Dumbbell className="w-4 h-4 text-primary" />
                {routine.name}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-hidden flex flex-col flex-1">
              <ModalContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={detailsOpen} onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) cancelEditing();
        }}>
          <DialogContent className="max-w-sm sm:max-w-lg max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {routine.name}
              </DialogTitle>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
