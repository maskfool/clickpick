import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { thumbnailsAPI } from "@/services/api";

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  onTextPromptChange?: (text: string) => void;
  onImagePathsChange?: (paths: string[]) => void; // For backend relative paths
  maxImages?: number;
  showTextInput?: boolean;
}

export const ImageUpload = ({ 
  onImagesChange, 
  onTextPromptChange, 
  onImagePathsChange,
  maxImages = 5, 
  showTextInput = false 
}: ImageUploadProps) => {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imagePaths, setImagePaths] = useState<string[]>([]); // Backend relative paths
  const [textPrompt, setTextPrompt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (uploadedImages.length + files.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
    }

    setIsUploading(true);
    
    try {
      // Upload files to backend
      const response = await thumbnailsAPI.uploadMultipleReferences(files);
      
      if (response.data?.success) {
        const uploadedImageData = response.data.data.images;
        const newPaths = uploadedImageData.map((img: any) => img.relativePath);
        const newPreviews = uploadedImageData.map((img: any) => img.imageUrl);
        
        // Update state
        setImagePaths(prev => {
          const updated = [...prev, ...newPaths];
          onImagePathsChange?.(updated);
          return updated;
        });
        
        setUploadedImages(prev => {
          const updated = [...prev, ...newPreviews];
          onImagesChange(updated);
          return updated;
        });
        
        toast.success(`${files.length} image(s) uploaded successfully!`);
      } else {
        toast.error("Failed to upload images");
      }
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onImagesChange(updated);
      return updated;
    });
    
    setImagePaths(prev => {
      const updated = prev.filter((_, i) => i !== index);
      onImagePathsChange?.(updated);
      return updated;
    });
  };

  const handleTextPromptChange = (value: string) => {
    setTextPrompt(value);
    onTextPromptChange?.(value);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
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
              Drop files here or click to browse ({uploadedImages.length}/{maxImages})
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />

      {uploadedImages.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {uploadedImages.map((image, index) => (
              <Card key={index} className="relative group overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
                <img
                  src={image}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                <Button
                  onClick={() => removeImage(index)}
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Card>
            ))}
          </div>
          
          {showTextInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Additional Text Prompt (Optional)
              </label>
              <Textarea
                value={textPrompt}
                onChange={(e) => handleTextPromptChange(e.target.value)}
                placeholder="Add additional text description to enhance your images..."
                className="min-h-[80px] bg-input/80 backdrop-blur-sm border-border/50 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
              />
              <p className="text-xs text-gray-300">
                This text will be combined with your uploaded images to generate the thumbnail
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
