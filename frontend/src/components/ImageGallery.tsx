import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  RotateCcw, 
  ZoomIn,
  GripVertical,
  Check
} from 'lucide-react';
import { useReferenceImages, useImageActions, useImageUI } from '@/stores/imageStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageGalleryProps {
  onImageSelect?: (imageId: string) => void;
  onImageRemove?: (imageId: string) => void;
  showSelection?: boolean;
  maxImages?: number;
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  onImageSelect,
  onImageRemove,
  showSelection = true,
  maxImages = 10,
  className = ''
}) => {
  const referenceImages = useReferenceImages();
  const { removeReferenceImage, reorderReferenceImages } = useImageActions();
  const { selectedImages, toggleImageSelection, clearSelection } = useImageUI();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  const handleRemoveImage = (imageId: string) => {
    removeReferenceImage(imageId);
    onImageRemove?.(imageId);
    toast.success('Image removed');
  };

  const handleImageClick = (imageId: string) => {
    if (showSelection) {
      toggleImageSelection(imageId);
    }
    onImageSelect?.(imageId);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderReferenceImages(draggedIndex, dropIndex);
      toast.success('Images reordered');
    }
    setDraggedIndex(null);
  };

  const handleDownload = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (referenceImages.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No images uploaded</h3>
        <p className="text-sm text-muted-foreground">
          Upload some reference images to get started
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Reference Images</h3>
          <Badge variant="secondary">{referenceImages.length}</Badge>
          {selectedImages.length > 0 && (
            <Badge variant="default">
              {selectedImages.length} selected
            </Badge>
          )}
        </div>
        
        {selectedImages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            className="text-muted-foreground"
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {referenceImages.map((image, index) => {
            const isSelected = selectedImages.includes(image.id);
            const isDragging = draggedIndex === index;
            
            return (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative group cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'hover:shadow-lg'
                  }`}
                  onMouseEnter={() => setHoveredImage(image.id)}
                  onMouseLeave={() => setHoveredImage(null)}
                >
                  {/* Image */}
                  <div className="aspect-square relative">
                    <img
                      src={image.imageUrl}
                      alt={image.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    
                    {/* Overlay */}
                    <div className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
                      hoveredImage === image.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(image.imageUrl, image.fileName);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(image.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Drag handle */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Image info */}
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {image.fileName}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(image.size)}</span>
                      <span>{formatDate(image.uploadedAt)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {image.width} × {image.height}
                    </div>
                  </div>

                  {/* Click to select */}
                  <div 
                    className="absolute inset-0 cursor-pointer"
                    onClick={() => handleImageClick(image.id)}
                  />
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <div className="text-sm text-muted-foreground text-center">
        {referenceImages.length} of {maxImages} images uploaded
        {referenceImages.length > 0 && (
          <span className="ml-2">
            • Total size: {formatFileSize(
              referenceImages.reduce((sum, img) => sum + img.size, 0)
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
