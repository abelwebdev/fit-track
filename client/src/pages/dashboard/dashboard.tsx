import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from '@/auth/firebase';
import type { User } from 'firebase/auth';
import { useCreateUserMutation, useGetDashboardStatsQuery } from "@/services/api";
import { onAuthStateChanged } from 'firebase/auth';
import { Flame, Timer, Dumbbell, Activity, TrendingUp, History, LogOut, Edit, Mail, Camera, Shield, Trash2, Settings, Scale, MapPin } from "lucide-react";
import logo from '@/assets/fit-track-logo-green.png';
import { StatCard } from "@/components/dashboard/StatCard";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { GoalCard } from "@/components/dashboard/GoalCard";
import { RecentWorkoutCard } from "@/components/dashboard/RecentWorkoutCard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExerciseTab } from "@/components/exercises/ExerciseTab";
import { RoutinesTab } from "@/components/routines/RoutineTab";
import HistoryTab from "@/components/history/HistoryTab";
import type { WorkoutSession } from "@/types/fitness";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectMeasurementSettings, updateMeasurementSetting, selectDailyGoalSettings, updateDailyGoalSetting } from "@/features/settings/settingsSlice";
import { useGetUserSettingsQuery, useUpdateAllSettingsMutation } from "@/services/api";
import { toast } from "sonner";

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const measurementSettings = useAppSelector(selectMeasurementSettings);
  const dailyGoalSettings = useAppSelector(selectDailyGoalSettings);
  const [createUser] = useCreateUserMutation();
  const { data: userSettingsData, isLoading: isSettingsLoading } = useGetUserSettingsQuery();
  const [updateAllSettings, { isLoading: isUpdatingSettings }] = useUpdateAllSettingsMutation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [localDailyGoals, setLocalDailyGoals] = useState({
    dailySetsGoal: dailyGoalSettings.dailySetsGoal,
    dailyCaloriesGoal: dailyGoalSettings.dailyCaloriesGoal,
  });
  const [tempInputValues, setTempInputValues] = useState({
    dailySetsGoal: dailyGoalSettings.dailySetsGoal.toString(),
    dailyCaloriesGoal: dailyGoalSettings.dailyCaloriesGoal.toString(),
  });
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
  });
  const [passwordResetStatus, setPasswordResetStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({
    loading: false,
    success: false,
    error: null,
  });
  const [deleteAccountStatus, setDeleteAccountStatus] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });
  
  const { data: dashboardData, isLoading, error } = useGetDashboardStatsQuery();
  
  // Ensure all stats have valid numeric values
  const rawStats = (dashboardData?.data || {}) as Partial<{
    totalWorkouts: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalCardioMinutes: number;
    totalCardioDistance: number;
    totalCaloriesBurned: number;
    todayCalories: number;
    todaySets: number;
    weeklyWorkouts: number;
    weeklyVolume: number;
    dailyData: { day: string; value: number; workouts: number; volume: number; }[];
    recentWorkouts: WorkoutSession[];
  }>;
  
  const stats = {
    totalWorkouts: Number(rawStats.totalWorkouts) || 0,
    totalVolume: Number(rawStats.totalVolume) || 0,
    totalSets: Number(rawStats.totalSets) || 0,
    totalReps: Number(rawStats.totalReps) || 0,
    totalCardioMinutes: Number(rawStats.totalCardioMinutes) || 0,
    totalCardioDistance: Number(rawStats.totalCardioDistance) || 0,
    totalCaloriesBurned: Number(rawStats.totalCaloriesBurned) || 0,
    todayCalories: Number(rawStats.todayCalories) || 0,
    todaySets: Number(rawStats.todaySets) || 0,
    weeklyWorkouts: Number(rawStats.weeklyWorkouts) || 0,
    weeklyVolume: Number(rawStats.weeklyVolume) || 0,
    dailyData: (Array.isArray(rawStats.dailyData) ? rawStats.dailyData : []) as { day: string; value: number; workouts: number; volume: number; }[],
    recentWorkouts: (Array.isArray(rawStats.recentWorkouts) ? rawStats.recentWorkouts : []) as WorkoutSession[]
  };

  // Calculate daily goal progress
  const dailyCaloriesGoal = dailyGoalSettings.dailyCaloriesGoal;
  const dailySetsGoal = dailyGoalSettings.dailySetsGoal;
  const dailyProgress = Math.min(100, Math.round(((stats.todayCalories / dailyCaloriesGoal) + (stats.todaySets / dailySetsGoal)) / 2 * 100));

  useEffect(() => {
    if (isSettingsModalOpen) {
      // Sync local state with Redux state when modal opens
      setLocalDailyGoals({
        dailySetsGoal: dailyGoalSettings.dailySetsGoal,
        dailyCaloriesGoal: dailyGoalSettings.dailyCaloriesGoal,
      });
      setTempInputValues({
        dailySetsGoal: dailyGoalSettings.dailySetsGoal.toString(),
        dailyCaloriesGoal: dailyGoalSettings.dailyCaloriesGoal.toString(),
      });
    }
  }, [isSettingsModalOpen, dailyGoalSettings]);

  // Load user settings from backend when user is authenticated
  useEffect(() => {
    if (currentUser && userSettingsData) {
      // Settings are automatically loaded via RTK Query and handled by the settings slice
    }
  }, [currentUser, userSettingsData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) return
      setCurrentUser(user);
      setProfileData({
        displayName: user.displayName || "",
        email: user.email || "",
      });
      createUser({
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
      })
    })
    return () => unsubscribe()
  }, [createUser])

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/sign-in"); // redirect to login after logout
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Logout failed:", message);
      toast.error("Failed to logout", {
        description: "Please try again.",
        duration: 4000,
      });
    }
  };

  const handleProfileSave = async () => {
    if (!currentUser) return;
    
    try {
      // Update Firebase user profile
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(currentUser, {
        displayName: profileData.displayName,
      });
      
      // Update local user data
      await createUser({
        uid: currentUser.uid,
        email: currentUser.email!,
        displayName: profileData.displayName,
        photoURL: currentUser.photoURL ?? '',
      });
      
      setIsEditMode(false);
      toast.success("Profile updated successfully!", {
        description: "Your profile information has been saved.",
        duration: 3000,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Profile update failed:", message);
      toast.error("Failed to update profile", {
        description: "Please try again.",
        duration: 4000,
      });
    }
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileModalClose = () => {
    setIsProfileModalOpen(false);
    setIsEditMode(false);
    // Reset profile data to current user data when closing
    if (currentUser) {
      setProfileData({
        displayName: currentUser.displayName || "",
        email: currentUser.email || "",
      });
    }
    // Reset password reset status
    setPasswordResetStatus({
      loading: false,
      success: false,
      error: null,
    });
    // Reset delete account status
    setDeleteAccountStatus({
      loading: false,
      error: null,
    });
  };

  const handleSettingsModalClose = () => {
    // Reset local state to Redux state when canceling
    setLocalDailyGoals({
      dailySetsGoal: dailyGoalSettings.dailySetsGoal,
      dailyCaloriesGoal: dailyGoalSettings.dailyCaloriesGoal,
    });
    setTempInputValues({
      dailySetsGoal: dailyGoalSettings.dailySetsGoal.toString(),
      dailyCaloriesGoal: dailyGoalSettings.dailyCaloriesGoal.toString(),
    });
    setIsSettingsModalOpen(false);
  };

  const handleMeasurementChange = async (setting: string, value: string) => {
    // Update local Redux state immediately for UI responsiveness
    dispatch(updateMeasurementSetting({ 
      setting: setting as keyof typeof measurementSettings, 
      value 
    }));
    
    // Save to backend
    try {
      await updateAllSettings({
        measurements: {
          ...measurementSettings,
          [setting]: value,
        },
      }).unwrap();
    } catch (error) {
      console.error('Failed to save measurement setting:', error);
      toast.error("Failed to save measurement setting", {
        description: "Please try again.",
        duration: 3000,
      });
    }
  };

  const handleSettingsSave = async () => {
    try {
      // Save both measurement and daily goal settings to backend
      await updateAllSettings({
        measurements: {
          weightUnit: measurementSettings.weightUnit,
          distanceUnit: measurementSettings.distanceUnit,
        },
        dailyGoals: {
          dailySetsGoal: localDailyGoals.dailySetsGoal,
          dailyCaloriesGoal: localDailyGoals.dailyCaloriesGoal,
        },
      }).unwrap();
      
      // Update local Redux state with the new daily goals
      dispatch(updateDailyGoalSetting({ 
        setting: 'dailySetsGoal', 
        value: localDailyGoals.dailySetsGoal 
      }));
      dispatch(updateDailyGoalSetting({ 
        setting: 'dailyCaloriesGoal', 
        value: localDailyGoals.dailyCaloriesGoal 
      }));
      
      setIsSettingsModalOpen(false);
      toast.success("Settings saved successfully!", {
        description: "Your preferences have been saved to your account.",
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error("Failed to save settings", {
        description: "Please try again.",
        duration: 4000,
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    setPasswordResetStatus({ loading: true, success: false, error: null });
    
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, currentUser.email);
      
      setPasswordResetStatus({
        loading: false,
        success: true,
        error: null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Password reset failed:", message);
      setPasswordResetStatus({
        loading: false,
        success: false,
        error: message,
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    setDeleteAccountStatus({ loading: true, error: null });
    
    try {
      // Delete user from Firebase Auth
      await currentUser.delete();
      
      // Redirect to sign-in page
      navigate("/sign-in");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Account deletion failed:", message);
      setDeleteAccountStatus({
        loading: false,
        error: message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-2 sm:gap-3">
              <img
                src={logo}
                alt="Fit Track Logo"
                className="h-8 sm:h-10 w-auto"
              />
              <span className="text-lg sm:text-xl font-bold leading-none">
                Fit Track
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-2 p-1 sm:p-2 h-auto"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold overflow-hidden">
                      {currentUser?.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt="Profile" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsProfileModalOpen(true)}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsSettingsModalOpen(true)}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={handleProfileModalClose}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit className="w-5 h-5" />
                  Edit Profile
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  Profile
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update your profile information. Changes will be saved to your account."
                : "View your profile information and account details."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-4 py-4">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-xl overflow-hidden">
                  {currentUser?.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Activity className="w-8 h-8" />
                  )}
                </div>
                {isEditMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => toast.info("Photo upload feature coming soon!", {
                      description: "This feature will be available in a future update.",
                      duration: 3000,
                    })}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Information */}
            {isEditMode ? (
              // Edit Mode - Form Fields
              <>
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={profileData.displayName}
                    onChange={(e) => handleProfileInputChange("displayName", e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={profileData.email}
                      disabled
                      className="pr-10"
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                
                {/* Password Update Section */}
                <div className="grid gap-3 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Security</Label>
                  </div>
                  
                  {passwordResetStatus.success ? (
                    <Alert className="border-green-200 bg-green-50">
                      <Mail className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Password reset email sent! Check your inbox including spam folder and follow the instructions to update your password.
                      </AlertDescription>
                    </Alert>
                  ) : passwordResetStatus.error ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">
                        Failed to send password reset email: {passwordResetStatus.error}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {deleteAccountStatus.error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">
                        Failed to delete account: {deleteAccountStatus.error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={passwordResetStatus.loading}
                          className="w-full justify-center"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Send Password Reset Email
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset Password</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reset your password? A password reset email will be sent to <strong>{currentUser?.email}</strong>. You'll need to check your email and follow the instructions to set a new password.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handlePasswordReset}
                            disabled={passwordResetStatus.loading}
                          >
                            {passwordResetStatus.loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                Sending...
                              </>
                            ) : (
                              "Send Reset Email"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll receive an email with instructions to securely update your password.
                    </p>
                  </div>

                  {/* Danger Zone */}
                  <div className="grid gap-3 pt-4 border-t border-red-200">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-red-500" />
                      <Label className="text-sm font-medium text-red-700">Danger Zone</Label>
                    </div>
                    
                    <div className="grid gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            disabled={deleteAccountStatus.loading}
                            className="w-full justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                              <p>
                                <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                              </p>
                              <p>
                                All your workout history, routines, and progress will be lost forever.
                              </p>
                              <p>
                                Are you absolutely sure you want to delete your account?
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAccount}
                              disabled={deleteAccountStatus.loading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteAccountStatus.loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                  Deleting...
                                </>
                              ) : (
                                "Yes, Delete My Account"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <p className="text-xs text-red-600 text-center">
                        This action is permanent and cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // View Mode - Display Information
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">Display Name</Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">
                      {currentUser?.displayName || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="p-3 bg-muted/50 rounded-md flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium">
                      {currentUser?.metadata?.creationTime 
                        ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                        : "Unknown"
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
          <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4">
            {isEditMode ? (
              // Edit Mode Buttons
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleProfileSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              // View Mode Buttons
              <>
                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={handleSettingsModalClose}>
        <DialogContent className="sm:max-w-[425px] max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </DialogTitle>
            <DialogDescription>
              Customize your measurement preferences and app settings.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-6 py-4">
              {/* Measurement Units Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Measurement Units</Label>
                </div>
                
                <div className="grid gap-4 pl-6">
                  {/* Weight Unit */}
                  <div className="grid gap-2">
                    <Label htmlFor="weightUnit" className="text-sm font-medium text-muted-foreground">
                      Weight
                    </Label>
                    <Select
                      value={measurementSettings.weightUnit}
                      onValueChange={(value) => handleMeasurementChange("weightUnit", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select weight unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for weight lifting and body weight measurements
                    </p>
                  </div>

                  {/* Distance Unit */}
                  <div className="grid gap-2">
                    <Label htmlFor="distanceUnit" className="text-sm font-medium text-muted-foreground">
                      Distance
                    </Label>
                    <Select
                      value={measurementSettings.distanceUnit}
                      onValueChange={(value) => handleMeasurementChange("distanceUnit", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select distance unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">Kilometers (km)</SelectItem>
                        <SelectItem value="miles">Miles (mi)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Used for cardio activities like running and cycling
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Goals Section */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Daily Goals</Label>
                </div>
                
                <div className="grid gap-4 pl-6">
                  {/* Daily Sets Goal */}
                  <div className="grid gap-2">
                    <Label htmlFor="dailySetsGoal" className="text-sm font-medium text-muted-foreground">
                      Daily Sets Target
                    </Label>
                    <Input
                      id="dailySetsGoal"
                      type="number"
                      min="1"
                      max="100"
                      value={tempInputValues.dailySetsGoal}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTempInputValues(prev => ({ ...prev, dailySetsGoal: value }));
                        
                        if (value === '') {
                          return; // Allow empty for editing
                        }
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                          setLocalDailyGoals(prev => ({ ...prev, dailySetsGoal: numValue }));
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value) || value < 1) {
                          const newValue = 1;
                          setLocalDailyGoals(prev => ({ ...prev, dailySetsGoal: newValue }));
                          setTempInputValues(prev => ({ ...prev, dailySetsGoal: newValue.toString() }));
                        } else if (value > 100) {
                          const newValue = 100;
                          setLocalDailyGoals(prev => ({ ...prev, dailySetsGoal: newValue }));
                          setTempInputValues(prev => ({ ...prev, dailySetsGoal: newValue.toString() }));
                        }
                      }}
                      className="w-full"
                      placeholder="20"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of sets you want to complete each day (1-100)
                    </p>
                  </div>

                  {/* Daily Calories Goal */}
                  <div className="grid gap-2">
                    <Label htmlFor="dailyCaloriesGoal" className="text-sm font-medium text-muted-foreground">
                      Daily Calories Target
                    </Label>
                    <Input
                      id="dailyCaloriesGoal"
                      type="number"
                      min="50"
                      max="2000"
                      step="50"
                      value={tempInputValues.dailyCaloriesGoal}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTempInputValues(prev => ({ ...prev, dailyCaloriesGoal: value }));
                        
                        if (value === '') {
                          return; // Allow empty for editing
                        }
                        const numValue = parseInt(value);
                        if (!isNaN(numValue) && numValue >= 50 && numValue <= 2000) {
                          setLocalDailyGoals(prev => ({ ...prev, dailyCaloriesGoal: numValue }));
                        }
                      }}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value) || value < 50) {
                          const newValue = 50;
                          setLocalDailyGoals(prev => ({ ...prev, dailyCaloriesGoal: newValue }));
                          setTempInputValues(prev => ({ ...prev, dailyCaloriesGoal: newValue.toString() }));
                        } else if (value > 2000) {
                          const newValue = 2000;
                          setLocalDailyGoals(prev => ({ ...prev, dailyCaloriesGoal: newValue }));
                          setTempInputValues(prev => ({ ...prev, dailyCaloriesGoal: newValue.toString() }));
                        }
                      }}
                      className="w-full"
                      placeholder="500"
                    />
                    <p className="text-xs text-muted-foreground">
                      Calories you want to burn through exercise each day (50-2000)
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Preview</Label>
                </div>
                <div className="grid gap-2 pl-6">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">Weight example:</span>
                    <span className="text-sm font-medium">
                      100 {measurementSettings.weightUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">Distance example:</span>
                    <span className="text-sm font-medium">
                      5.0 {measurementSettings.distanceUnit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">Daily sets goal:</span>
                    <span className="text-sm font-medium">
                      {localDailyGoals.dailySetsGoal} sets
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-muted-foreground">Daily calories goal:</span>
                    <span className="text-sm font-medium">
                      {localDailyGoals.dailyCaloriesGoal} kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={handleSettingsModalClose}>
              Cancel
            </Button>
            <Button onClick={handleSettingsSave} disabled={isUpdatingSettings}>
              {isUpdatingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 sm:mb-6 w-full sm:w-fit grid grid-cols-4 sm:grid-cols-none sm:flex sm:justify-start">
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
            <TabsTrigger value="exercises" className="text-xs sm:text-sm">Exercises</TabsTrigger>
            <TabsTrigger value="routines" className="text-xs sm:text-sm">Routines</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">History</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Stats Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="w-8 h-8 sm:w-11 sm:h-11 bg-primary/10 rounded-lg sm:rounded-xl"></div>
                    </div>
                    <div className="h-3 sm:h-4 bg-muted rounded mb-2"></div>
                    <div className="h-6 sm:h-8 bg-muted rounded w-16 sm:w-20"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center">
                <p className="text-muted-foreground text-sm sm:text-base">Failed to load dashboard stats</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard 
                  icon={Dumbbell} 
                  label="Total Workouts" 
                  value={stats.totalWorkouts} 
                  unit="sessions" 
                  delay={0} 
                />
                <StatCard 
                  icon={TrendingUp} 
                  label="Weight Lifted" 
                  value={stats.totalVolume}
                  unit={measurementSettings.weightUnit} 
                  delay={100} 
                />
                <StatCard 
                  icon={Timer} 
                  label="Cardio Activity" 
                  value={stats.totalCardioMinutes > 0 || stats.totalCardioDistance > 0 
                    ? `${stats.totalCardioMinutes}min / ${stats.totalCardioDistance.toFixed(1)}${measurementSettings.distanceUnit}`
                    : "0"
                  }
                  unit="" 
                  delay={200} 
                />
                <StatCard 
                  icon={Flame} 
                  label="Calories Burned" 
                  value={stats.totalCaloriesBurned} 
                  unit="kcal" 
                  delay={300} 
                />
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Daily Goal Progress */}
              <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center animate-scale-in">
                <h3 className="font-semibold text-base sm:text-lg mb-4 sm:mb-6">Today's Progress</h3>
                <ProgressRing progress={dailyProgress} label="of daily goal" value={`${dailyProgress}%`} />
                <div className="mt-4 sm:mt-6 w-full space-y-3 sm:space-y-4">
                  <GoalCard label="Sets Completed" current={stats.todaySets} target={dailySetsGoal} unit="" color="hsl(var(--primary))" />
                  <GoalCard label="Calories" current={stats.todayCalories} target={dailyCaloriesGoal} unit="kcal" color="hsl(38, 92%, 50%)" />
                </div>
              </div>

              {/* Weekly Volume Chart */}
              <div className="lg:col-span-2">
                <WeeklyChart dailyData={stats.dailyData} />
              </div>
            </div>

            {/* Recent Workouts */}
            <div className="space-y-4 sm:space-y-6">
              <div className="glass-card rounded-xl sm:rounded-2xl p-3 sm:p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-6 gap-2 sm:gap-0">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-lg">Recent Workouts</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">Your latest sessions</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("history")} className="text-xs sm:text-sm px-2 sm:px-3 self-start sm:self-auto">
                    <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> 
                    <span className="hidden sm:inline">View All</span>
                    <span className="sm:hidden">All</span>
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-4 sm:py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-2 sm:mb-3"></div>
                    <p className="text-xs sm:text-base">Loading workouts...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 sm:py-8 text-muted-foreground">
                    <Dumbbell className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                    <p className="text-xs sm:text-base">Failed to load workouts</p>
                  </div>
                ) : stats.recentWorkouts.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {stats.recentWorkouts.map((workout, index) => (
                      <RecentWorkoutCard key={workout._id} workout={workout} delay={400 + index * 100} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-8 text-muted-foreground">
                    <Dumbbell className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-30" />
                    <p className="text-xs sm:text-base">No workouts yet. Start your first workout!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4 sm:space-y-6 animate-fade-in">
            <ExerciseTab />
          </TabsContent>

          <TabsContent value="routines" className="space-y-4 sm:space-y-6 animate-fade-in">
            <RoutinesTab />
          </TabsContent>

          <TabsContent value="history" className="space-y-4 sm:space-y-6 animate-fade-in">
            <HistoryTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}