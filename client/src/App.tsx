import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { store } from './app/store';
import { Provider } from 'react-redux';
import { requireAuth } from "./loaders/authLoader";
import { AuthProvider } from "./auth/authContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DashboardPage from "./pages/dashboard/dashboard";
import SignIn from "./pages/SignIn";
import SignUp from './pages/Signup'
import ErrorPage from "./pages/ErrorPage";

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    // element: <RootLayout />,
    children: [
      // Public routes
      { index: true, element: <Index /> },
      { path: "sign-in", element: <SignIn /> },
      { path: "sign-up", element: <SignUp /> },

      // Protected routes
      {
        path: "dashboard",
        element: <DashboardPage />,
        loader: requireAuth, // check auth before rendering
        children: [

        ]
      },

      { path: "*", element: <NotFound /> },
    ],
  },
])

const App = () => (
  <Provider store={store}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </TooltipProvider>
  </Provider>
);

export default App;