// src/components/VideoCategories.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  ChevronDown,
  Target,
  Check,
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
  const [isOpen, setIsOpen] = useState(true);
  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleCategorySelect = (category: VideoCategory) => {
    onCategorySelect(category);
    // Collapse after selection
    if (category.id) {
      setIsOpen(false);
    }
  };

  const handleClearSelection = () => {
    onCategorySelect({
      id: "",
      name: "",
      icon: null,
      gradient: "",
      prompts: [],
    });
    setIsOpen(true); // Expand when clearing selection
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-card/80 backdrop-blur-xl border-border/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-primary" />
                Video Categories
                {selectedCategory && (
                  <Badge className="bg-gradient-primary text-primary-foreground text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Selected
                  </Badge>
                )}
              </CardTitle>
              <ChevronDown 
                className={`w-5 h-5 text-muted-foreground transition-all duration-300 ease-in-out ${
                  isOpen ? 'rotate-180' : 'rotate-0'
                }`} 
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <CardContent className="space-y-4">
            {/* Selected Category Display */}
            {selectedCategoryData && (
              <div className="p-3 bg-gradient-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                    {selectedCategoryData.icon}
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedCategoryData.name}</p>
                    <p className="text-xs text-gray-300">Selected category</p>
                  </div>
                </div>
              </div>
            )}

            {/* Category Grid */}
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    variant="ghost"
                    className={`h-20 p-2 flex flex-col gap-2 rounded-lg transition-all duration-300 ease-in-out transform
                      ${isSelected
                        ? "bg-gradient-primary text-primary-foreground shadow-lg scale-105"
                        : "bg-card/50 border border-border/40 hover:border-primary/50 hover:bg-primary/10 hover:scale-105"
                      }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300
                        ${isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : `bg-gradient-to-br ${category.gradient} text-white`
                        }`}
                    >
                      {category.icon}
                    </div>
                    <div className={`text-xs font-medium transition-colors duration-300 ${
                      isSelected ? "text-primary-foreground" : "text-white"
                    }`}>
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
                className="w-full text-xs border-border/50 hover:border-destructive/50 hover:text-destructive transition-colors duration-200 text-white"
                onClick={handleClearSelection}
              >
                Clear Selection
              </Button>
            )}

            {/* Collapse hint */}
            {!selectedCategory && (
              <p className="text-xs text-gray-400 text-center">
                Select a category to auto-collapse
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};