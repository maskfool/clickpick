// Enhanced Cloudinary upload system with Zustand integration
import { useImageStore, type ReferenceImage } from '../stores/imageStore';

// Helper function to generate unique IDs
const generateId = (prefix: string = 'img') => 
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to get current timestamp
const getCurrentTimestamp = () => new Date().toISOString();

// Get auth token helper
const getAuthToken = (): string | null => {
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed.state?.token || null;
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }
  return null;
};

// Upload multiple reference images to Cloudinary via backend
export const uploadMultipleReferenceImages = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  const token = getAuthToken();
  const response = await fetch('http://localhost:5001/api/images/upload-multiple-reference', {
    method: 'POST',
    body: formData,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data; // Array of uploaded file data with Cloudinary URLs
};

// Upload single reference image to Cloudinary via backend
export const uploadReferenceImage = async (file: File) => {
  const formData = new FormData();
  formData.append('reference', file);

  const token = getAuthToken();
  const response = await fetch('http://localhost:5001/api/images/upload-reference', {
    method: 'POST',
    body: formData,
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data; // Returns Cloudinary URL and metadata
};

// Enhanced upload hook with Zustand integration
export const useUploadThing = (endpoint: string) => {
  const { addReferenceImage, setUploading } = useImageStore();
  const isUploading = useImageStore(state => state.isUploading);

  const startUpload = async (files: File[]) => {
    setUploading(true);
    
    try {
      let uploadedData;
      
      if (endpoint === 'multipleReferenceImagesUploader') {
        uploadedData = await uploadMultipleReferenceImages(files);
      } else if (endpoint === 'referenceImageUploader') {
        const results = [];
        for (const file of files) {
          const result = await uploadReferenceImage(file);
          results.push(result);
        }
        uploadedData = results;
      } else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      // Convert uploaded data to ReferenceImage format and add to store
      const referenceImages: ReferenceImage[] = uploadedData.map((data: any) => ({
        id: generateId('ref'),
        fileName: data.fileName || data.publicId,
        imageUrl: data.imageUrl, // Use the URL as-is (already absolute for Cloudinary)
        uploadedAt: getCurrentTimestamp(),
        size: data.size,
        width: data.width,
        height: data.height,
        mimetype: data.mimetype,
        publicId: data.publicId,
      }));

      // Add each image to the store
      referenceImages.forEach(image => {
        addReferenceImage(image);
      });

      return referenceImages;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { startUpload, isUploading };
};

// Batch upload utility
export const batchUploadImages = async (files: File[]) => {
  const { addReferenceImage, setUploading } = useImageStore();
  
  setUploading(true);
  
  try {
    const uploadedData = await uploadMultipleReferenceImages(files);
    
    const referenceImages: ReferenceImage[] = uploadedData.map((data: any) => ({
      id: generateId('ref'),
      fileName: data.fileName,
      imageUrl: `http://localhost:5001${data.imageUrl}`,
      uploadedAt: getCurrentTimestamp(),
      size: data.size,
      width: data.width,
      height: data.height,
      mimetype: data.mimetype,
    }));

    // Add all images to the store
    referenceImages.forEach(image => {
      addReferenceImage(image);
    });

    return referenceImages;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw error;
  } finally {
    setUploading(false);
  }
};