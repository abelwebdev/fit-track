import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url(${heroBg})`
      }}>
        <div className="absolute inset-0 bg-background/70" />
      </div>
      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/80 border border-border mb-8 opacity-0 animate-fade-up" style={{
            animationDelay: "0.1s"
          }}>
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Track. Train. Transform.</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 opacity-0 animate-fade-up" style={{
            animationDelay: "0.2s"
          }}>
            Your Workouts,{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Supercharged</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up" style={{
            animationDelay: "0.3s"
          }}>
            The intelligent workout tracker that adapts to your goals.
            Log exercises, track progress, and crush your fitness journey.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up" style={{
            animationDelay: "0.4s"
          }}>
            <Button size="xl" onClick={() => navigate("/sign-up")}>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
};
export default HeroSection;