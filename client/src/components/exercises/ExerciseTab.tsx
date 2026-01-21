import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseFilters } from "./ExerciseFilters";
import { useGetExercisesQuery, useGetFilteredExercisesQuery } from "@/services/api";
import type { Exercise } from "@/types/fitness";

export const ExerciseTab = () => {
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("all");
  const [equipmentFilter, setEquipmentFilter] = useState("all");
  const [page, setPage] = useState(1);

  const hasFilters = muscleFilter !== "all" || equipmentFilter !== "all";

  // Queries
  const { data: exercises, isLoading: isExerciseLoading } = useGetExercisesQuery(
    { page, limit: 12, name: search },
    { skip: hasFilters }
  );

  const { data: filteredResponse, isLoading: isFilteredLoading } = useGetFilteredExercisesQuery(
    {
      page,
      limit: 12,
      name: search,
      muscle: muscleFilter !== "all" ? muscleFilter : undefined,
      equipment: equipmentFilter !== "all" ? equipmentFilter : undefined,
    },
    { skip: !hasFilters }
  );

  // Exercises to display
  const exercisesToShow: Exercise[] = hasFilters
    ? filteredResponse?.data ?? []
    : exercises?.data ?? [];

  const isLoading = hasFilters ? isFilteredLoading : isExerciseLoading;

  // Pagination totals
  const totalItems = hasFilters ? filteredResponse?.totalItems || 0 : exercises?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / 12);

  // Reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [muscleFilter, equipmentFilter, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exercise Library</h2>
          <p className="text-muted-foreground">Browse and filter exercises</p>
        </div>
      </div>

      {/* Filters */}
      <ExerciseFilters
        search={search}
        onSearchChange={setSearch}
        muscleFilter={muscleFilter}
        onMuscleChange={setMuscleFilter}
        equipmentFilter={equipmentFilter}
        onEquipmentChange={setEquipmentFilter}
      />

      {/* Exercises Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/50 bg-secondary/30 animate-pulse h-40"
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-400/30" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 bg-gray-400/30 rounded w-3/4" />
                    <div className="h-3 bg-gray-400/20 rounded w-1/2" />
                    <div className="h-3 bg-gray-400/20 rounded w-1/4 mt-auto" />
                  </div>
                </div>
              </div>
            ))
          : exercisesToShow.length > 0
          ? exercisesToShow.map((exercise) => <ExerciseCard key={exercise._id} exercise={exercise} />)
          : (
            <p className="text-center col-span-full text-muted-foreground">
              No exercises found
            </p>
          )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2 items-center">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-800 rounded-full flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <span className="px-3 py-1 text-sm">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-800 rounded-full flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};