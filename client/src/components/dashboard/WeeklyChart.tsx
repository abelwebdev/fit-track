import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";
import { selectMeasurementSettings } from "@/features/settings/settingsSlice";
import { useAppSelector } from "@/app/hooks";

interface DailyData {
  day: string;
  value: number;
  workouts: number;
  volume: number;
}

interface WeeklyChartProps {
  dailyData: DailyData[];
}

export const WeeklyChart = ({ dailyData }: WeeklyChartProps) => {
  
  const data = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // If no data is provided, create a default week structure
    if (!dailyData || dailyData.length === 0) {
      const sampleData = [
        { day: 'Mon', value: 0, workouts: 0, volume: 0 },
        { day: 'Tue', value: 0, workouts: 0, volume: 0 },
        { day: 'Wed', value: 0, workouts: 0, volume: 0 },
        { day: 'Thu', value: 0, workouts: 0, volume: 0 },
        { day: 'Fri', value: 0, workouts: 0, volume: 0 },
        { day: 'Sat', value: 0, workouts: 0, volume: 0 },
        { day: 'Sun', value: 0, workouts: 0, volume: 0 },
      ];
      return sampleData;
    }
        
    // Create a map of existing data
    const dataMap = new Map(dailyData.map(item => [item.day, item]));
    
    // Ensure we have data for all 7 days and map volume to value for the chart
    const processedData = days.map(day => {
      const existingData = dataMap.get(day);
      if (existingData) {
        const value = Math.max(existingData.volume / 100, existingData.workouts * 10);
        return {
          day,
          value,
          workouts: existingData.workouts || 0,
          volume: existingData.volume || 0
        };
      }
      return {
        day,
        value: 0,
        workouts: 0,
        volume: 0
      };
    });
    
    return processedData;
  }, [dailyData]);
  const measurementSettings = useAppSelector(selectMeasurementSettings);

  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;

  // Calculate totals
  const totalVolume = data.reduce((sum, day) => sum + (day.volume || 0), 0);
  const totalWorkouts = data.reduce((sum, day) => sum + (day.workouts || 0), 0);
  const hasData = totalVolume > 0 || totalWorkouts > 0;
  const maxValue = Math.max(...data.map(d => d.value), 1); // Ensure minimum scale

  return (
    <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div>
          <h3 className="font-semibold text-base sm:text-lg">Weekly Volume</h3>
          <p className="text-muted-foreground text-xs sm:text-sm">Daily training volume (x100 {measurementSettings.weightUnit})</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-primary" />
          <span className="text-xs sm:text-sm text-muted-foreground">Volume</span>
        </div>
      </div>
      
      <div className="h-32 sm:h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%" margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              className="sm:text-xs"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
              width={20}
              domain={[0, Math.max(maxValue * 1.1, 10)]}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              className="sm:rounded-[6px]"
              minPointSize={hasData ? 0 : 2} // Show minimal bars when no data
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={
                    hasData 
                      ? (index === dayIndex ? 'hsl(var(--primary))' : 'hsl(var(--secondary))')
                      : 'hsl(var(--muted))'
                  }
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm font-medium">No workout data yet</p>
              <p className="text-xs text-muted-foreground/70">Complete workouts to see your progress</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm gap-1 sm:gap-0">
        <div className="text-muted-foreground">
          Total: {totalVolume.toLocaleString()}
        </div>
        <div className="text-muted-foreground">
          {totalWorkouts} workout{totalWorkouts !== 1 ? 's' : ''} this week
        </div>
      </div>
    </div>
  );
};
