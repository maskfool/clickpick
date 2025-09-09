import { Zap, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GenerationModesProps {
  onModeSelect: (mode: 'random' | 'advanced') => void;
  selectedMode: 'random' | 'advanced' | null;
}

export const GenerationModes = ({ onModeSelect, selectedMode }: GenerationModesProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card 
        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
          selectedMode === 'random' 
            ? 'bg-gradient-primary/20 border-primary shadow-primary' 
            : 'bg-card/80 backdrop-blur-xl border-border/50 hover:border-primary/50'
        }`}
        onClick={() => onModeSelect('random')}
      >
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              selectedMode === 'random' ? 'bg-gradient-primary' : 'bg-gradient-accent'
            }`}>
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-lg">Random Generation</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Quick and easy thumbnail generation with AI magic
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            <span>Fast • Creative • Surprise Me</span>
          </div>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
          selectedMode === 'advanced' 
            ? 'bg-gradient-accent/20 border-accent shadow-accent' 
            : 'bg-card/80 backdrop-blur-xl border-border/50 hover:border-accent/50'
        }`}
        onClick={() => onModeSelect('advanced')}
      >
        <CardHeader className="text-center pb-3">
          <div className="flex justify-center mb-3">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              selectedMode === 'advanced' ? 'bg-gradient-accent' : 'bg-gradient-primary'
            }`}>
              <Settings className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-lg">Advanced Generation</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Customize your thumbnail with guided questions
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Settings className="w-3 h-3" />
            <span>Detailed • Customized • Professional</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
