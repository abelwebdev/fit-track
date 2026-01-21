import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const muscleGroups = [
  { label: 'All Muscles', value: 'all' },
  { label: 'Abductors', value: 'abductors' },
  { label: 'Abs', value: 'abs' },
  { label: 'Adductors', value: 'adductors' },
  { label: 'Biceps', value: 'biceps' },
  { label: 'Calves', value: 'calves' },
  { label: 'Cardiovascular System', value: 'cardiovascular system' },
  { label: 'Delts', value: 'delts' },
  { label: 'Forearms', value: 'forearms' },
  { label: 'Glutes', value: 'glutes' },
  { label: 'Hamstrings', value: 'hamstrings' },
  { label: 'Lats', value: 'lats' },
  { label: 'Levator Scapulae', value: 'levator scapulae' },
  { label: 'Pectorals', value: 'pectorals' },
  { label: 'Quads', value: 'quads' },
  { label: 'Serratus Anterior', value: 'serratus anterior' },
  { label: 'Spine', value: 'spine' },
  { label: 'Traps', value: 'traps' },
  { label: 'Triceps', value: 'triceps' },
  { label: 'Upper Back', value: 'upper back' }
]
const equipmentTypes = [
  { label: 'All Equipments', value: 'all' },
  { label: 'Assisted', value: 'assisted' },
  { label: 'Band', value: 'band' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Body Weight', value: 'body weight' },
  { label: 'Bosu Ball', value: 'bosu ball' },
  { label: 'Cable', value: 'cable' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Elliptical Machine', value: 'elliptical machine' },
  { label: 'EZ Barbell', value: 'ez barbell' },
  { label: 'Hammer', value: 'hammer' },
  { label: 'Kettlebell', value: 'kettlebell' },
  { label: 'Leverage Machine', value: 'leverage machine' },
  { label: 'Medicine Ball', value: 'medicine ball' },
  { label: 'Olympic Barbell', value: 'olympic barbell' },
  { label: 'Resistance Band', value: 'resistance band' },
  { label: 'Roller', value: 'roller' },
  { label: 'Rope', value: 'rope' },
  { label: 'Skierg Machine', value: 'skierg machine' },
  { label: 'Sled Machine', value: 'sled machine' },
  { label: 'Smith Machine', value: 'smith machine' },
  { label: 'Stability Ball', value: 'stability ball' },
  { label: 'Stationary Bike', value: 'stationary bike' },
  { label: 'Stepmill Machine', value: 'stepmill machine' },
  { label: 'Tire', value: 'tire' },
  { label: 'Trap Bar', value: 'trap bar' },
  { label: 'Upper Body Ergometer', value: 'upper body ergometer' },
  { label: 'Weighted', value: 'weighted' },
  { label: 'Wheel Roller', value: 'wheel roller' }
]

interface ExerciseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  muscleFilter: string;
  onMuscleChange: (value: string) => void;
  equipmentFilter: string;
  onEquipmentChange: (value: string) => void;
  compact?: boolean;
}

export const ExerciseFilters = ({
  search,
  onSearchChange,
  muscleFilter,
  onMuscleChange,
  equipmentFilter,
  onEquipmentChange,
  compact = false,
}: ExerciseFiltersProps) => {
  if (compact) {
    return (
      <div className="flex gap-2">
        <Select value={muscleFilter} onValueChange={onMuscleChange}>
          <SelectTrigger className="flex-1 h-8 text-xs bg-background border-border/50">
            <SelectValue placeholder="Muscle" />
          </SelectTrigger>
          <SelectContent>
            {muscleGroups.map(mg => (
              <SelectItem key={mg.value} value={mg.value}>{mg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={equipmentFilter} onValueChange={onEquipmentChange}>
          <SelectTrigger className="flex-1 h-8 text-xs bg-background border-border/50">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            {equipmentTypes.map(eq => (
              <SelectItem key={eq.value} value={eq.value}>{eq.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-secondary/50 border-border/50"
        />
      </div>
      
      <Select value={muscleFilter} onValueChange={onMuscleChange}>
        <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-border/50">
          <SelectValue placeholder="All Muscles" />
        </SelectTrigger>
        <SelectContent>
          {muscleGroups.map(mg => (
            <SelectItem key={mg.value} value={mg.value}>{mg.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={equipmentFilter} onValueChange={onEquipmentChange}>
        <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50 border-border/50">
          <SelectValue placeholder="All Equipment" />
        </SelectTrigger>
        <SelectContent>
          {equipmentTypes.map(eq => (
            <SelectItem key={eq.value} value={eq.value}>{eq.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
