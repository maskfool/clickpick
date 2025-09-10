import { useState } from "react";
import { Monitor, Smartphone, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ThumbnailPreviewProps {
  imageUrl: string | null;
  isGenerating: boolean;
  onDownload: () => void;
  onRegenerate?: () => void;
}

export const ThumbnailPreview = ({ 
  imageUrl, 
  isGenerating, 
  onDownload, 
  onRegenerate 
}: ThumbnailPreviewProps) => {
  const [previewMode, setPreviewMode] = useState<'video' | 'shorts'>('video');

  const getPreviewDimensions = () => {
    return previewMode === 'video' 
      ? { width: '100%', aspectRatio: '16/9' }
      : { width: '60%', aspectRatio: '9/16', margin: '0 auto' };
  };

  if (isGenerating) {
    return (
      <Card className="h-full bg-black/50 backdrop-blur-xl border flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
            <RefreshCw className="w-8 h-8 text-white animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Generating Thumbnail...</h3>
            <p className="text-sm text-gray-400">This may take a few seconds</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!imageUrl) {
    return (
      <Card className="h-full bg-black/50 backdrop-blur-xl border flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="w-20 h-20 bg-gradient-primary/20 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-primary/30">
            <Monitor className="w-10 h-10 text-primary/50" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Ready to Create</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Upload images or enter text to generate your perfect image.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-black/50 backdrop-blur-xl border relative overflow-hidden flex flex-col">
      {/* Preview Mode Toggle */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Button
          onClick={() => setPreviewMode('video')}
          variant={previewMode === 'video' ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-3"
        >
          <Monitor className="w-3 h-3 mr-1" />
          Video
        </Button>
        <Button
          onClick={() => setPreviewMode('shorts')}
          variant={previewMode === 'shorts' ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-3"
        >
          <Smartphone className="w-3 h-3 mr-1" />
          Shorts
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {onRegenerate && (
          <Button
            onClick={onRegenerate}
            variant="outline"
            size="sm"
            className="h-8 px-3"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        )}
        <Button
          onClick={onDownload}
          variant="default"
          size="sm"
          className="h-8 px-3"
        >
          <Download className="w-3 h-3 mr-1" />
          Download
        </Button>
      </div>

      {/* Preview Badge */}
      <div className="absolute bottom-4 left-4 z-10">
        <Badge 
          variant="secondary" 
          className="bg-black/70 text-white backdrop-blur-sm border-white/20"
        >
          {previewMode === 'video' ? 'YouTube Video (16:9)' : 'YouTube Shorts (9:16)'}
        </Badge>
      </div>

      {/* Image Preview */}
      <div className="flex-1 w-full flex items-center justify-center p-6">
        <div 
          style={getPreviewDimensions()}
          className="relative overflow-hidden rounded-lg shadow-float"
        >
          <img
            src={imageUrl}
            alt="Generated Thumbnail"
            className="w-full h-full object-cover"
          />
          
          {/* YouTube UI Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {previewMode === 'video' && (
            <>
              {/* Video duration badge */}
              
              {/* Play button overlay */}
              
            </>
          )}

          {previewMode === 'shorts' && (
            <>
              {/* Shorts UI elements */}
              <div className="absolute right-3 bottom-20 flex flex-col gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm" />
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm" />
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm" />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
