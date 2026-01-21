import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/fit-track-logo-green.png";

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <img
              src={logo}
              alt="Fit Track Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Ready to{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Transform</span>?
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Start tracking your workouts, building custom routines, and monitoring your fitness progress today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="xl" onClick={() => navigate("/sign-up")}>
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
