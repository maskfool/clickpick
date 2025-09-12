import { useState, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { useReferenceImages, useImageActions } from "@/stores/imageStore";
import ImageGallery from "./ImageGallery";

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  onTextPromptChange?: (text: string) => void;
  onImagePathsChange?: (paths: string[]) => void; // For backend relative paths
  maxImages?: number;
  showTextInput?: boolean;
  showGallery?: boolean;
}

export const ImageUpload = ({ 
  onImagesChange, 
  onTextPromptChange, 
  onImagePathsChange,
  maxImages = 5, 
  showTextInput = false,
  showGallery = true
}: ImageUploadProps) => {
  const [textPrompt, setTextPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Zustand store
  const referenceImages = useReferenceImages();
  const { clearReferenceImages } = useImageActions();
  
  // Upload hook
  const { startUpload, isUploading } = useUploadThing("multipleReferenceImagesUploader");

  // Update parent components when images change
  useEffect(() => {
    const imageUrls = referenceImages.map(img => img.imageUrl);
    const imagePaths = referenceImages.map(img => img.fileName);
    
    onImagesChange(imageUrls);
    onImagePathsChange?.(imagePaths);
  }, [referenceImages, onImagesChange, onImagePathsChange]);

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    toast.error(`Upload failed: ${error.message}`);
  };

  const handleFileUpload = async (files: File[]) => {
    if (referenceImages.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast.error("File size must be less than 4MB");
        return;
      }
    }

    try {
      // Use the enhanced upload function
      await startUpload(files);
      toast.success(`${files.length} image(s) uploaded successfully!`);
    } catch (error) {
      handleUploadError(error as Error);
    }
  };

  const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    await handleFileUpload(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    await handleFileUpload(files);
  };

  const handleTextPromptChange = (value: string) => {
    setTextPrompt(value);
    onTextPromptChange?.(value);
  };

  const handleClearAll = () => {
    clearReferenceImages();
    toast.success("All images cleared");
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isUploading ? "Uploading..." : "Upload Images"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drop files here or click to browse ({referenceImages.length}/{maxImages})
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Image Gallery */}
      {showGallery && referenceImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Uploaded Images</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
          <ImageGallery 
            maxImages={maxImages}
            onImageSelect={(imageId) => {
              // Handle image selection if needed
            }}
            onImageRemove={(imageId) => {
              // Handle image removal if needed
            }}
          />
        </div>
      )}

      {/* Text Input */}
      {showTextInput && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Additional Text Prompt (Optional)
          </label>
          <Textarea
            value={textPrompt}
            onChange={(e) => handleTextPromptChange(e.target.value)}
            placeholder="Add additional text description to enhance your images..."
            className="min-h-[80px] bg-input/80 backdrop-blur-sm border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            This text will be combined with your uploaded images to generate the thumbnail
          </p>
        </div>
      )}
    </div>
  );
};
