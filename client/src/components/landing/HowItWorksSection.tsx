import { ClipboardList, LineChart, Rocket } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Create Your Routine",
    description: "Build custom workout routines by selecting exercises from our comprehensive library. Set your target sets, reps, and weights."
  },
  {
    icon: LineChart,
    step: "02", 
    title: "Track Your Workouts",
    description: "Log your workouts in real-time. Mark sets as complete, track your performance, and record calories burned."
  },
  {
    icon: Rocket,
    step: "03",
    title: "Monitor Your Progress",
    description: "View your workout history, track daily goals, and watch your fitness stats grow on your personalized dashboard."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Simple as{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">1-2-3</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Get started in minutes. See results in weeks.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          {steps.map((step, index) => (
            <div key={step.step} className="relative">
              <div className="text-center">
                {/* Step Icon */}
                <div className="relative inline-flex">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-6 mx-auto relative z-10">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-4 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;