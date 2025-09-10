import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use UploadThing hook for manual control
  const { startUpload, isUploading: isUploadThingLoading } = useUploadThing("multipleReferenceImagesUploader");

  const handleUploadComplete = (res: any) => {
    console.log("Files uploaded:", res);
    
    if (res && res.length > 0) {
      const newPaths = res.map((img: any) => img.fileName);
      const newPreviews = res.map((img: any) => `http://localhost:5001${img.imageUrl}`);
      
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
      
      toast.success(`${res.length} image(s) uploaded successfully!`);
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("Upload error:", error);
    toast.error(`Upload failed: ${error.message}`);
  };

  const handleFileUpload = async (files: File[]) => {
    if (uploadedImages.length + files.length > maxImages) {
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
      // Use UploadThing's startUpload function
      const res = await startUpload(files);
      
      if (res) {
        handleUploadComplete(res);
      }
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
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            {isUploadThingLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-primary-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isUploadThingLoading ? "Uploading..." : "Upload Images"}
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
        onChange={handleFileInputChange}
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
