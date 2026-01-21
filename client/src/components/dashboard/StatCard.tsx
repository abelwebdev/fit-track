import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit: string;
  trend?: string;
  delay?: number;
}

export const StatCard = ({ icon: Icon, label, value, unit, trend, delay = 0 }: StatCardProps) => {
  // Format the value for display
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}k`;
      }
      return val.toString();
    }
    return val;
  };

  return (
    <div 
      className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/30 transition-all duration-300 group animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-muted-foreground text-xs sm:text-sm mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-3xl font-bold tracking-tight">{formatValue(value)}</span>
        <span className="text-muted-foreground text-xs sm:text-sm">{unit}</span>
      </div>
    </div>
  );
};
