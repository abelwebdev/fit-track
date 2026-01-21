import { BarChart3, Calendar, Dumbbell, LineChart, Target, Trophy } from "lucide-react";

const features = [
  {
    icon: Dumbbell,
    title: "Exercise Library",
    description: "Browse through hundreds of exercises with detailed instructions and animations. Filter by muscle group and equipment.",
  },
  {
    icon: LineChart,
    title: "Workout Tracking",
    description: "Log your workouts with sets, reps, weights, and rest times. Track strength training and cardio activities.",
  },
  {
    icon: Calendar,
    title: "Workout History",
    description: "View your complete workout history with detailed statistics. Edit past workouts and track your consistency.",
  },
  {
    icon: Target,
    title: "Custom Routines",
    description: "Create personalized workout routines with your favorite exercises. Save and reuse them for consistent training.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    description: "Monitor your fitness journey with comprehensive stats. Track total volume, sets completed, and calories burned.",
  },
  {
    icon: Trophy,
    title: "Daily Goals",
    description: "Set personalized daily targets for sets and calories. Track your progress with visual indicators and stay motivated.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 ">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Dominate</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Powerful tools designed for athletes who demand results. No fluff, just gains.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
