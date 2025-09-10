// Simple local file upload system (no UploadThing dependency)

// Upload multiple reference images to local backend
export const uploadMultipleReferenceImages = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });

  // Get auth token
  const authData = localStorage.getItem('auth-storage');
  let token = null;
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.state?.token;
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }

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
  return result.data; // Array of uploaded file data
};

// Upload single reference image
export const uploadReferenceImage = async (file: File) => {
  const formData = new FormData();
  formData.append('reference', file);

  // Get auth token
  const authData = localStorage.getItem('auth-storage');
  let token = null;
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      token = parsed.state?.token;
    } catch (error) {
      console.error('Error parsing auth data:', error);
    }
  }

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
  return result.data;
};

// Custom hook for multiple file uploads
export const useUploadThing = (endpoint: string) => {
  const startUpload = async (files: File[]) => {
    if (endpoint === 'multipleReferenceImagesUploader') {
      return await uploadMultipleReferenceImages(files);
    } else if (endpoint === 'referenceImageUploader') {
      const results = [];
      for (const file of files) {
        const result = await uploadReferenceImage(file);
        results.push(result);
      }
      return results;
    }
    throw new Error(`Unknown endpoint: ${endpoint}`);
  };

  return { startUpload, isUploading: false };
};