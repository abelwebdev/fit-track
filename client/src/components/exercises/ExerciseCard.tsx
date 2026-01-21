import { Exercise, MuscleGroup } from "@/types/fitness";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selected?: boolean;
}
const muscleLabels: Record<MuscleGroup, string> = {
  abductors: 'Abductors',
  abs: 'Abs',
  adductors: 'Adductors',
  biceps: 'biceps',
  calves: 'Calves',
  'cardiovascular system': 'Cardio',
  delts: 'Delts',
  forearms: 'Forearms',
  glutes: 'Glutes',
  hamstrings: 'Hamstring',
  lats: 'Lats',
  'levator scapulae': 'Levator Scapulae',
  pectorals: 'Pectorals',
  quads: 'Quads',
  'serratus anterior': 'Serratus Anterior',
  spine: 'Spine',
  traps: 'Traps',
  triceps: 'Triceps',
  'upper back': 'Upper Back',
};

export const ExerciseCard = ({ exercise, onSelect, selected }: ExerciseCardProps) => {
  const hasMedia = exercise.img || exercise.gifurl;
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!exercise.gifurl) return;
    setHovered(true);
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setCoords({ x: rect.right + 10, y: rect.top });
  };
  const handleMouseLeave = () => {
    setHovered(false);
  };

  return (
    <>
      <div
        onClick={() => onSelect?.(exercise)}
        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group ${
          selected
            ? "border-primary bg-primary/10"
            : "border-border/50 bg-secondary/30 hover:bg-secondary/60 hover:border-border"
        }`}
      >
        {/* Vertical layout */}
        <div className="flex flex-col items-start">
          {/* Image/GIF container */}
          <div
            className={`relative overflow-hidden rounded-lg ${
              hasMedia ? "w-16 h-16" : "p-2"
            } ${!hasMedia && "bg-primary/20"}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {hasMedia ? (
              <img
                src={exercise.img}
                alt={exercise.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Dumbbell className="w-4 h-4 text-primary" />
            )}
          </div>

          {/* Name */}
          <h4 className="font-medium text-sm mt-2">{exercise.name}</h4>
          {/* Muscles */}
          <div className="flex flex-wrap items-start gap-1 mt-1.5">
            <Badge variant="default" className="text-xs capitalize">
              {muscleLabels[exercise.target]}
            </Badge>
            {exercise.secondary?.map((muscle) => (
              <Badge key={muscle} variant="secondary" className="text-xs capitalize">
                {muscle}
              </Badge>
            ))}
          </div>
          {/* Equipment */}
          <Badge variant="outline" className="text-xs capitalize mt-1.5 border-white">
            {exercise.equipment}
          </Badge>
        </div>
      </div>
      {/* Pop-out GIF */}
      {hovered && exercise.gifurl && (
        <img
          src={exercise.gifurl}
          style={{
            position: "fixed",
            top: coords.y,
            left: coords.x,
            width: 200,
            height: 200,
            objectFit: "cover",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
            zIndex: 1000,
            pointerEvents: "none",
            transition: "transform 0.2s, opacity 0.2s",
            transform: hovered ? "scale(1)" : "scale(0.9)",
            opacity: hovered ? 1 : 0,
          }}
        />
      )}
    </>
  );
};