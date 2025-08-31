// src/components/VideoCategories.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gamepad2,
  Music,
  Utensils,
  Wrench,
  BookOpen,
  Dumbbell,
  MapPin,
  Palette,
  Briefcase,
  Baby,
  ShoppingBag,
} from "lucide-react";

export interface VideoCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: string;
  prompts: string[];
}

const categories: VideoCategory[] = [
  { id: "gaming", name: "Gaming", icon: <Gamepad2 className="w-4 h-4" />, gradient: "from-purple-500 to-indigo-500", prompts: [] },
  { id: "music", name: "Music", icon: <Music className="w-4 h-4" />, gradient: "from-pink-500 to-rose-600", prompts: [] },
  { id: "food", name: "Food", icon: <Utensils className="w-4 h-4" />, gradient: "from-orange-400 to-red-500", prompts: [] },
  { id: "technology", name: "Tech", icon: <Wrench className="w-4 h-4" />, gradient: "from-blue-500 to-cyan-500", prompts: [] }, // ✅ fixed
  { id: "education", name: "Education", icon: <BookOpen className="w-4 h-4" />, gradient: "from-green-500 to-emerald-500", prompts: [] },
  { id: "travel", name: "Travel", icon: <MapPin className="w-4 h-4" />, gradient: "from-teal-400 to-blue-500", prompts: [] },
  { id: "fitness", name: "Fitness", icon: <Dumbbell className="w-4 h-4" />, gradient: "from-red-500 to-pink-500", prompts: [] },
  { id: "art", name: "Art", icon: <Palette className="w-4 h-4" />, gradient: "from-violet-500 to-fuchsia-500", prompts: [] },
  { id: "business", name: "Business", icon: <Briefcase className="w-4 h-4" />, gradient: "from-slate-500 to-gray-600", prompts: [] },
  { id: "family", name: "Family", icon: <Baby className="w-4 h-4" />, gradient: "from-yellow-500 to-orange-600", prompts: [] },
  { id: "fashion", name: "Fashion", icon: <ShoppingBag className="w-4 h-4" />, gradient: "from-rose-500 to-pink-600", prompts: [] },
];

interface VideoCategoriesProps {
  onCategorySelect: (category: VideoCategory) => void;
  selectedCategory: string | null;
}

export const VideoCategories = ({ onCategorySelect, selectedCategory }: VideoCategoriesProps) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">🎯 Video Categories</h3>
        {selectedCategory && (
          <Badge className="bg-gradient-accent text-accent-foreground text-xs">
            Selected
          </Badge>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-3 gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          return (
            <Button
              key={category.id}
              variant="ghost"
              className={`h-20 p-2 flex flex-col gap-2 rounded-lg transition-all duration-300 
                ${isSelected
                  ? "bg-yellow-500 border border-yellow-400 shadow-lg text-black"
                  : "bg-black/30 border border-border/40 hover:border-yellow-400 hover:bg-black/50 text-white"
                }`}
              onClick={() => onCategorySelect(category)}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center 
                  ${isSelected
                    ? "bg-yellow-200 text-black"
                    : `bg-gradient-to-br ${category.gradient} text-white`
                  }`}
              >
                {category.icon}
              </div>
              <div className={`text-xs font-medium ${isSelected ? "text-black" : "text-white"}`}>
                {category.name}
              </div>
            </Button>
          );
        })}
      </div>

      {/* Clear selection */}
      {selectedCategory && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-border/50 hover:border-primary/50 text-black"
          onClick={() =>
            onCategorySelect({
              id: "",
              name: "",
              icon: null,
              gradient: "",
              prompts: [],
            })
          }
        >
          Clear Selection
        </Button>
      )}
    </div>
  );
};