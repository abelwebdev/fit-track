import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  const status = isRouteErrorResponse(error) ? error.status : 500;
  const statusText = isRouteErrorResponse(error)
    ? error.statusText || "Not Found"
    : "Something went wrong";
  const message = isRouteErrorResponse(error)
    ? error.data || "The page you are looking for doesn't exist."
    : (error as Error)?.message || "An unexpected error occurred.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">Oops!</p>
      <h1 className="mt-4 text-6xl font-black text-foreground">{status}</h1>
      <p className="mt-2 text-xl font-semibold text-foreground/80">{statusText}</p>
      <p className="mt-4 max-w-md text-muted-foreground">{message}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => navigate(-1)} variant="outline">
          Go Back
        </Button>
        <Button onClick={() => navigate("/")}>Return Home</Button>
      </div>
    </div>
  );
};

export default ErrorPage;
