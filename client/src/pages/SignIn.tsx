import { useState, useEffect } from "react";
import { FirebaseError } from "firebase/app";
import { auth } from '@/auth/firebase';
import logo from "@/assets/fit-track-logo-green.png";
import { signInWithGoogle, signIn } from "@/auth/auth.service";
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Email/password sign-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Sign in the user
      const userCredential = await signIn(email, password); // returns UserCredential
      const user = userCredential.user;
      // Refresh user info
      await user.reload();
      if (!user.emailVerified) {
        toast({
          title: "Email verification required",
          description: "Please verify your email before signing in. Check your inbox including spam.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Proceed to dashboard
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      // Handle common Firebase errors
      if (err instanceof FirebaseError) {
        if (err.code === "auth/wrong-password") {
          setError("Incorrect password");
        } else if (err.code === "auth/user-not-found") {
          setError("No account found with this email");
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };
  // Google login
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err: unknown) {
      if(err instanceof FirebaseError) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email first",
        variant: "destructive",
      });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox (including spam) for the reset link.",
      });
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } else if (err instanceof Error) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: String(err),
          variant: "destructive",
        });
      }
    }
  };
  useEffect(() => {
    // Only redirect verified users
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          navigate("/dashboard", { replace: true });
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  return (

    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-end justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <img
              src={logo}
              alt="Fit Track Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-heading font-bold">Fit Track</span>
        </Link>

        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue your progress
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google Button */}
            <Button
              onClick={handleGoogleLogin}
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-4 h-12"
            >
              {/* Google SVG */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="20"
                height="20"
              >
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Continue with Google
            </Button>

            {/* Error */}
           {error && (
             <p className="text-destructive text-sm mb-4">{error}</p>
           )}

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-xs text-muted-foreground">
                or continue with email
              </span>
            </div>

            {/* Sign In Form (UI only) */}
            <form className="space-y-4"  onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="h-12"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                to="/sign-up"
                className="text-primary font-medium cursor-pointer hover:underline"
              >
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}