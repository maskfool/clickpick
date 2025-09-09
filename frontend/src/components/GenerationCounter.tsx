import { useState, useEffect } from "react";
import { Zap, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface GenerationCounterProps {
  currentCount: number;
  maxCount: number;
  onUpgrade?: () => void;
}

export const GenerationCounter = ({ 
  currentCount, 
  maxCount, 
  onUpgrade 
}: GenerationCounterProps) => {
  const [animatedCount, setAnimatedCount] = useState(currentCount);

  useEffect(() => {
    setAnimatedCount(currentCount);
  }, [currentCount]);

  const progressPercentage = (currentCount / maxCount) * 100;
  const remaining = maxCount - currentCount;
  const isNearLimit = remaining <= 2;
  const isAtLimit = remaining <= 0;

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 p-4">
      <div className="space-y-4">
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {animatedCount} / {maxCount}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>

        {/* Status Message */}
        <div className="text-center">
          {isAtLimit ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive font-medium">
                Generation limit reached!
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade to continue creating thumbnails
              </p>
            </div>
          ) : isNearLimit ? (
            <div className="space-y-2">
              <p className="text-xs text-accent font-medium">
                Almost at your limit!
              </p>
              <p className="text-xs text-muted-foreground">
                Consider upgrading for unlimited generations
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {remaining} generations remaining today
            </p>
          )}
        </div>

        {/* Upgrade Button */}
        {(isAtLimit || isNearLimit) && onUpgrade && (
          <Button 
            onClick={onUpgrade}
            variant="default"
            size="sm"
            className="w-full"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        )}

        {/* Features List */}
        
      </div>
    </Card>
  );
};
