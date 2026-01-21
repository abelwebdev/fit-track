import logo from "@/assets/fit-track-logo-green.png";

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-end gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <img
                  src={logo}
                  alt="Fit Track Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-foreground leading-none">
                Fit Track
              </span>
            </div>
            <p className="text-muted-foreground text-sm text-center md:text-left">
              Track your workouts, build routines, monitor progress.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with 💪 by{" "}
            <a 
              href="https://abelwebdev.netlify.app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              me
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
