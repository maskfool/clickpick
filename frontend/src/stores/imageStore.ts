import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReferenceImage {
  id: string;
  fileName: string;
  imageUrl: string;
  uploadedAt: string;
  size: number;
  width: number;
  height: number;
  mimetype: string;
  publicId?: string; // Cloudinary public ID
}

export interface GeneratedImage {
  id: string;
  fileName: string;
  imageUrl: string;
  generatedAt: string;
  prompt: string;
  referenceImageIds: string[];
  isLatest: boolean;
  publicId?: string; // Cloudinary public ID
  metadata?: {
    width: number;
    height: number;
    size: number;
  };
}

export interface RefinedImage {
  id: string;
  fileName: string;
  imageUrl: string;
  refinedAt: string;
  baseImageId: string;
  refinementPrompt: string;
  publicId?: string; // Cloudinary public ID
  metadata?: {
    width: number;
    height: number;
    size: number;
  };
}

interface ImageState {
  // Reference images (uploaded by user)
  referenceImages: ReferenceImage[];
  
  // Generated images (created by AI)
  generatedImages: GeneratedImage[];
  
  // Refined images (refinements of generated images)
  refinedImages: RefinedImage[];
  
  // Current session info
  currentSession: {
    id: string;
    createdAt: string;
    lastActivity: string;
  } | null;
  
  // UI state
  isUploading: boolean;
  isGenerating: boolean;
  isRefining: boolean;
  selectedImages: string[];
  
  // Actions for reference images
  addReferenceImage: (image: ReferenceImage) => void;
  removeReferenceImage: (id: string) => void;
  updateReferenceImage: (id: string, updates: Partial<ReferenceImage>) => void;
  clearReferenceImages: () => void;
  reorderReferenceImages: (fromIndex: number, toIndex: number) => void;
  
  // Actions for generated images
  addGeneratedImage: (image: GeneratedImage) => void;
  removeGeneratedImage: (id: string) => void;
  getLatestGeneratedImage: () => GeneratedImage | null;
  markAsLatest: (id: string) => void;
  clearGeneratedImages: () => void;
  
  // Actions for refined images
  addRefinedImage: (image: RefinedImage) => void;
  removeRefinedImage: (id: string) => void;
  clearRefinedImages: () => void;
  
  // Session management
  startNewSession: () => void;
  clearCurrentSession: () => void;
  
  // UI state management
  setUploading: (isUploading: boolean) => void;
  setGenerating: (isGenerating: boolean) => void;
  setRefining: (isRefining: boolean) => void;
  setSelectedImages: (ids: string[]) => void;
  toggleImageSelection: (id: string) => void;
  clearSelection: () => void;
  
  // Utility functions
  getImageById: (id: string) => ReferenceImage | GeneratedImage | RefinedImage | null;
  getAllImages: () => (ReferenceImage | GeneratedImage | RefinedImage)[];
  getImageCount: () => number;
  getTotalSize: () => number;
}

// Helper function to generate unique IDs
const generateId = (prefix: string = 'img') => 
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to get current timestamp
const getCurrentTimestamp = () => new Date().toISOString();

export const useImageStore = create<ImageState>()(
  persist(
    (set, get) => ({
      // Initial state
      referenceImages: [],
      generatedImages: [],
      refinedImages: [],
      currentSession: null,
      isUploading: false,
      isGenerating: false,
      isRefining: false,
      selectedImages: [],

      // Reference image actions
      addReferenceImage: (image) => set((state) => ({
        referenceImages: [...state.referenceImages, image],
        lastActivity: getCurrentTimestamp(),
      })),

      removeReferenceImage: (id) => set((state) => ({
        referenceImages: state.referenceImages.filter(img => img.id !== id),
        selectedImages: state.selectedImages.filter(selectedId => selectedId !== id),
        lastActivity: getCurrentTimestamp(),
      })),

      updateReferenceImage: (id, updates) => set((state) => ({
        referenceImages: state.referenceImages.map(img => 
          img.id === id ? { ...img, ...updates } : img
        ),
        lastActivity: getCurrentTimestamp(),
      })),

      clearReferenceImages: () => set((state) => ({
        referenceImages: [],
        selectedImages: state.selectedImages.filter(id => 
          !state.referenceImages.some(img => img.id === id)
        ),
        lastActivity: getCurrentTimestamp(),
      })),

      reorderReferenceImages: (fromIndex, toIndex) => set((state) => {
        const newImages = [...state.referenceImages];
        const [movedImage] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, movedImage);
        
        return {
          referenceImages: newImages,
          lastActivity: getCurrentTimestamp(),
        };
      }),

      // Generated image actions
      addGeneratedImage: (image) => set((state) => ({
        generatedImages: [...state.generatedImages, image],
        lastActivity: getCurrentTimestamp(),
      })),

      removeGeneratedImage: (id) => set((state) => ({
        generatedImages: state.generatedImages.filter(img => img.id !== id),
        selectedImages: state.selectedImages.filter(selectedId => selectedId !== id),
        lastActivity: getCurrentTimestamp(),
      })),

      getLatestGeneratedImage: () => {
        const state = get();
        return state.generatedImages.find(img => img.isLatest) || 
               state.generatedImages[state.generatedImages.length - 1] || 
               null;
      },

      markAsLatest: (id) => set((state) => ({
        generatedImages: state.generatedImages.map(img => ({
          ...img,
          isLatest: img.id === id
        })),
        lastActivity: getCurrentTimestamp(),
      })),

      clearGeneratedImages: () => set((state) => ({
        generatedImages: [],
        selectedImages: state.selectedImages.filter(id => 
          !state.generatedImages.some(img => img.id === id)
        ),
        lastActivity: getCurrentTimestamp(),
      })),

      // Refined image actions
      addRefinedImage: (image) => set((state) => ({
        refinedImages: [...state.refinedImages, image],
        lastActivity: getCurrentTimestamp(),
      })),

      removeRefinedImage: (id) => set((state) => ({
        refinedImages: state.refinedImages.filter(img => img.id !== id),
        selectedImages: state.selectedImages.filter(selectedId => selectedId !== id),
        lastActivity: getCurrentTimestamp(),
      })),

      clearRefinedImages: () => set((state) => ({
        refinedImages: [],
        selectedImages: state.selectedImages.filter(id => 
          !state.refinedImages.some(img => img.id === id)
        ),
        lastActivity: getCurrentTimestamp(),
      })),

      // Session management
      startNewSession: () => set({
        currentSession: {
          id: generateId('session'),
          createdAt: getCurrentTimestamp(),
          lastActivity: getCurrentTimestamp(),
        },
        lastActivity: getCurrentTimestamp(),
      }),

      clearCurrentSession: () => set({
        referenceImages: [],
        generatedImages: [],
        refinedImages: [],
        currentSession: null,
        selectedImages: [],
        isUploading: false,
        isGenerating: false,
        isRefining: false,
      }),

      // UI state management
      setUploading: (isUploading) => set({ isUploading }),
      setGenerating: (isGenerating) => set({ isGenerating }),
      setRefining: (isRefining) => set({ isRefining }),
      
      setSelectedImages: (ids) => set({ selectedImages: ids }),
      
      toggleImageSelection: (id) => set((state) => ({
        selectedImages: state.selectedImages.includes(id)
          ? state.selectedImages.filter(selectedId => selectedId !== id)
          : [...state.selectedImages, id]
      })),
      
      clearSelection: () => set({ selectedImages: [] }),

      // Utility functions
      getImageById: (id) => {
        const state = get();
        return state.referenceImages.find(img => img.id === id) ||
               state.generatedImages.find(img => img.id === id) ||
               state.refinedImages.find(img => img.id === id) ||
               null;
      },

      getAllImages: () => {
        const state = get();
        return [
          ...state.referenceImages,
          ...state.generatedImages,
          ...state.refinedImages,
        ];
      },

      getImageCount: () => {
        const state = get();
        return state.referenceImages.length + 
               state.generatedImages.length + 
               state.refinedImages.length;
      },

      getTotalSize: () => {
        const state = get();
        return state.referenceImages.reduce((sum, img) => sum + img.size, 0) +
               state.generatedImages.reduce((sum, img) => sum + (img.metadata?.size || 0), 0) +
               state.refinedImages.reduce((sum, img) => sum + (img.metadata?.size || 0), 0);
      },
    }),
    {
      name: 'clickpick-images',
      partialize: (state) => ({
        referenceImages: state.referenceImages,
        generatedImages: state.generatedImages,
        refinedImages: state.refinedImages,
        currentSession: state.currentSession,
      }),
    }
  )
);

// Helper hooks for common operations
export const useReferenceImages = () => useImageStore(state => state.referenceImages);
export const useGeneratedImages = () => useImageStore(state => state.generatedImages);
export const useRefinedImages = () => useImageStore(state => state.refinedImages);
export const useImageActions = () => useImageStore(state => ({
  addReferenceImage: state.addReferenceImage,
  removeReferenceImage: state.removeReferenceImage,
  clearReferenceImages: state.clearReferenceImages,
  reorderReferenceImages: state.reorderReferenceImages,
  addGeneratedImage: state.addGeneratedImage,
  removeGeneratedImage: state.removeGeneratedImage,
  getLatestGeneratedImage: state.getLatestGeneratedImage,
  markAsLatest: state.markAsLatest,
  clearGeneratedImages: state.clearGeneratedImages,
  addRefinedImage: state.addRefinedImage,
  removeRefinedImage: state.removeRefinedImage,
  clearRefinedImages: state.clearRefinedImages,
  startNewSession: state.startNewSession,
  clearCurrentSession: state.clearCurrentSession,
}));

export const useImageUI = () => useImageStore(state => ({
  isUploading: state.isUploading,
  isGenerating: state.isGenerating,
  isRefining: state.isRefining,
  selectedImages: state.selectedImages,
  setUploading: state.setUploading,
  setGenerating: state.setGenerating,
  setRefining: state.setRefining,
  setSelectedImages: state.setSelectedImages,
  toggleImageSelection: state.toggleImageSelection,
  clearSelection: state.clearSelection,
}));
