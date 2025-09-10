import axios from "axios";

// Create axios instance
const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || "http://localhost:5001/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-storage");
    if (token) {
      try {
        const authData = JSON.parse(token);
        if (authData.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`;
        }
      } catch (error) {
        console.error("Error parsing auth token:", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ======================= Auth API =======================
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get("/auth/me"),

  updateProfile: (data: any) => api.put("/auth/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
};

// ======================= Thumbnails API =======================
export const thumbnailsAPI = {
  // ✅ Create new thumbnail (with optional referenceImage and referenceImages)
  create: (data: {
    title: string;
    description?: string;
    category: string;
    originalPrompt: string;
    referenceImage?: string;
    referenceImages?: string[];
  }) => api.post("/thumbnails", data),

  // ✅ Refine thumbnail with optional referenceImage and chatHistory
  edit: (id: string, data: { userPrompt: string; referenceImage?: string; chatHistory?: Array<{ role: string; content: string }> }) =>
    api.patch(`/thumbnails/${id}/refine`, data),

  // Fetch my thumbnails
  getMy: (params?: any) => api.get("/thumbnails/my", { params }),

  // Fetch public thumbnails
  getPublic: (params?: any) => api.get("/thumbnails/public", { params }),

  // Get single thumbnail
  getById: (id: string) => api.get(`/thumbnails/${id}`),

  // Update thumbnail info
  update: (id: string, data: any) => api.put(`/thumbnails/${id}`, data),

  // Delete thumbnail
  delete: (id: string) => api.delete(`/thumbnails/${id}`),

  // Like a thumbnail
  like: (id: string) => api.post(`/thumbnails/${id}/like`),

  // ✅ Upload reference image using UploadThing FileRouter
  uploadReference: (file: File) => {
    const formData = new FormData();
    formData.append("files", file);
    console.log("🔍 DEBUG: Frontend sending file:", file.name, "to UploadThing FileRouter");
    return api.post("/uploadthing/referenceImageUploader", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ✅ Upload multiple reference images using UploadThing FileRouter
  uploadMultipleReferences: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append("files", file);
    });
    console.log("🔍 DEBUG: Frontend sending files:", files.map(f => f.name), "to UploadThing FileRouter");
    return api.post("/uploadthing/multipleReferenceImagesUploader", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ======================= Chat/AI API =======================
export const chatAPI = {
  enhancePrompt: (data: any) => api.post("/chat/enhance-prompt", data),

  getThumbnailIdeas: (data: any) => api.post("/chat/thumbnail-ideas", data),

  getEditSuggestions: (data: any) => api.post("/chat/edit-suggestions", data),

  getThumbnailFeedback: (data: any) => api.post("/chat/thumbnail-feedback", data),

  getPromptHelp: (data: any) => api.post("/chat/prompt-help", data),

  getTrendingTopics: (params?: any) =>
    api.get("/chat/trending-topics", { params }),
};

// ======================= Health check =======================
export const healthAPI = {
  check: () => api.get("/health"),
};

export default api;