interface GoalCardProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

export const GoalCard = ({ label, current, target, unit, color }: GoalCardProps) => {
  const progress = Math.min((current / target) * 100, 100);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {current.toLocaleString()}<span className="text-muted-foreground">/{target.toLocaleString()} {unit}</span>
        </span>
      </div>
      <div className="h-1.5 sm:h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${progress}%`,
            backgroundColor: color,
            boxShadow: `0 0 12px ${color}50`
          }}
        />
      </div>
    </div>
  );
};
