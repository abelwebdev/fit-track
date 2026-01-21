// src/loaders/authLoader.ts
import { redirect } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export const requireAuth = async () => {
  const user = await isAuthenticated();
  if (!user) {
    return redirect("/sign-in"); // redirect to login if not authenticated
  }
  return null; // allow access
};