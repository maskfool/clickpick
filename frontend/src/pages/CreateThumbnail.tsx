import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  Send,
  RefreshCw,
  Download,
  ArrowLeft,
  X,
  MessageSquare,
  Heart,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useReferenceImages, useImageActions, useImageUI, useImageStore } from "../stores/imageStore";
import { thumbnailsAPI } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ImageUpload } from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";

interface ChatMessage {
  id: string;
  type: "user" | "ai" | "system";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isGenerating?: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Thumbnail {
  id: string;
  imageUrl: string;
  finalPrompt: string;
  category: string;
  status: string;
  isLiked?: boolean;
}

const CreateThumbnail = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  // Zustand store
  const referenceImages = useReferenceImages();
  const { addGeneratedImage, markAsLatest, getLatestGeneratedImage, addRefinedImage } = useImageActions();
  const { isGenerating, setGenerating } = useImageUI();
  
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImagePaths, setUploadedImagePaths] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [prompt, setPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSessionActive, setIsSessionActive] = useState(true); // Start with active session
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<string>(
    ""
  );
  const [currentThumbnail, setCurrentThumbnail] = useState<Thumbnail | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const categories: Category[] = [
    { id: "education", name: "Education", description: "", icon: "📚", color: "bg-blue-500" },
    { id: "gaming", name: "Gaming", description: "", icon: "🎮", color: "bg-purple-500" },
    { id: "technology", name: "Technology", description: "", icon: "💻", color: "bg-indigo-500" },
    { id: "entertainment", name: "Entertainment", description: "", icon: "🎬", color: "bg-pink-500" },
    { id: "lifestyle", name: "Lifestyle", description: "", icon: "🌟", color: "bg-green-500" },
    { id: "business", name: "Business", description: "", icon: "💼", color: "bg-gray-500" },
    { id: "news", name: "News", description: "", icon: "📰", color: "bg-red-500" },
    { id: "sports", name: "Sports", description: "", icon: "⚽", color: "bg-orange-500" },
    { id: "music", name: "Music", description: "", icon: "🎵", color: "bg-yellow-500" },
    { id: "comedy", name: "Comedy", description: "", icon: "😂", color: "bg-teal-500" },
    { id: "travel", name: "Travel", description: "", icon: "✈️", color: "bg-cyan-500" },
    { id: "food", name: "Food", description: "", icon: "🍕", color: "bg-amber-500" },
  ];

  useEffect(() => {
    // Only auto-scroll if user is near the bottom of chat
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.parentElement;
      if (chatContainer) {
        const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
        if (isNearBottom) {
          chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [chatMessages]);



  // Upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      try {
        setIsLoading(true);
        const response = await thumbnailsAPI.uploadReference(file);
        const { imageUrl, relativePath } = response.data.data;

      // Store the relative path for sending to Gemini API
      setUploadedImagePaths([relativePath]);
        
        console.log("🔍 DEBUG: Image upload completed!");
        console.log("🔍 DEBUG: relativePath:", relativePath);
        console.log("🔍 DEBUG: imageUrl:", imageUrl);
        console.log("🔍 DEBUG: uploadedImagePath state set to:", relativePath);
        
        addMessage("system", `📸 Reference photo uploaded: ${file.name}`, imageUrl);
        toast.success("Reference image uploaded successfully!");
      } catch (error: any) {
        toast.error(error.response?.data?.error || "Failed to upload image");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    addMessage("system", `🎯 Category selected: ${category.name}`);
    addMessage(
      "ai",
      `Great! Category <strong>${category.name}</strong> selected. Now describe your thumbnail idea!`
    );
  };

  const addMessage = (
    type: "user" | "ai" | "system",
    content: string,
    imageUrl?: string
  ) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      imageUrl,
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const handlePromptSubmit = async () => {
    if (!prompt.trim()) return;
    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }
    if (uploadedImagePaths.length === 0) {
      toast.error("Please upload at least one reference image");
      return;
    }

    // If there's already a generated image, use refine instead of create
    if (currentGeneratedImage && currentThumbnail) {
      await handleRefineImage(prompt);
      return;
    }

    // Store the prompt before clearing it
    const currentPrompt = prompt;
    
    addMessage("user", currentPrompt);
    setPrompt("");

    const thinkingMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "ai",
      content: "🤔 Processing your request...",
      timestamp: new Date(),
      isGenerating: true,
    };
    setChatMessages((prev) => [...prev, thinkingMessage]);

    try {
      setIsLoading(true);
      
      console.log("🔍 DEBUG: About to send request with:");
      console.log("🔍 DEBUG: uploadedImagePaths:", uploadedImagePaths);
      console.log("🔍 DEBUG: currentPrompt:", currentPrompt);
      
      // Use the new image generation API
      const response = await fetch('http://localhost:5001/api/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          category: selectedCategory.id,
          referenceImages: uploadedImagePaths,
          userId: user?.id || 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
      
      // Update state with generated image
      setCurrentGeneratedImage(result.imageUrl);
      setCurrentThumbnail({
        id: `gen_${Date.now()}`,
        imageUrl: result.imageUrl,
        finalPrompt: currentPrompt,
        category: selectedCategory.id,
        status: 'completed'
      });

      // Add generated image to store
      const generatedImage = {
        id: `gen_${Date.now()}`,
        fileName: `generated_${Date.now()}.png`,
        imageUrl: result.imageUrl,
        generatedAt: new Date().toISOString(),
        prompt: currentPrompt,
        referenceImageIds: referenceImages.map(img => img.id),
        isLatest: true,
        publicId: result.variants[0]?.publicId,
        metadata: {
          width: 1280,
          height: 720,
          size: 0, // Will be updated when we get actual size
        }
      };

      addGeneratedImage(generatedImage);
      markAsLatest(generatedImage.id);

      addMessage("ai", `✨ Thumbnail generated!`);
      toast.success("Thumbnail generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate thumbnail");
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineImage = async (refinementPrompt: string) => {
    if (!refinementPrompt.trim() || !currentThumbnail) return;
    
    addMessage("user", `Refinement: ${refinementPrompt}`);
    const thinkingMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "ai",
      content: "🎨 Refining your image...",
      timestamp: new Date(),
      isGenerating: true,
    };
    setChatMessages((prev) => [...prev, thinkingMessage]);

    try {
      setIsLoading(true);
      
      // Use the new image refinement API
      const response = await fetch('http://localhost:5001/api/images/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          prompt: refinementPrompt,
          baseImageId: currentThumbnail.id,
          category: selectedCategory?.id || 'other',
          userId: user?.id || 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error(`Refinement failed: ${response.statusText}`);
      }

      const result = await response.json();
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
      
      // Update state with refined image
      setCurrentGeneratedImage(result.imageUrl);
      setCurrentThumbnail({
        ...currentThumbnail,
        imageUrl: result.imageUrl,
        finalPrompt: refinementPrompt
      });

      // Add refined image to store
      const refinedImage = {
        id: `refined_${Date.now()}`,
        fileName: `refined_${Date.now()}.png`,
        imageUrl: result.imageUrl,
        refinedAt: new Date().toISOString(),
        baseImageId: getLatestGeneratedImage()?.id || '',
        refinementPrompt: refinementPrompt,
        publicId: result.variants[0]?.publicId,
        metadata: {
          width: 1280,
          height: 720,
          size: 0, // Will be updated when we get actual size
        }
      };

      addRefinedImage(refinedImage);

      addMessage("ai", `🎯 Thumbnail refined!`);
      toast.success("Thumbnail refined successfully!");
    } catch (error: any) {
      console.error("Refinement error:", error);
      toast.error(error.message || "Failed to refine thumbnail");
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!currentGeneratedImage) {
      toast.error("No image to download");
      return;
    }

    try {
      // Cloudinary URLs are already absolute, no need to convert
      const imageUrl = currentGeneratedImage;

      // Fetch the image as a blob
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clickpick-thumbnail-${Date.now()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image. Please try again.");
    }
  };

  // Function to download any image from chat messages
  const downloadImage = async (imageUrl: string) => {
    if (!imageUrl) {
      toast.error("No image to download");
      return;
    }

    try {
      // Cloudinary URLs are already absolute, no need to convert
      const url = imageUrl;

      // Fetch the image as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `clickpick-image-${Date.now()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image. Please try again.");
    }
  };

  const handleLike = async (thumbnailId?: string) => {
    if (!thumbnailId) return;
    
    try {
      const response = await thumbnailsAPI.like(thumbnailId);
      const { thumbnail } = response.data.data;
      
      // Update the current thumbnail with like status
      setCurrentThumbnail(thumbnail);
      
      toast.success(thumbnail.isLiked ? "Added to favorites!" : "Removed from favorites!");
    } catch (error: any) {
      toast.error("Failed to update like status");
    }
  };

  const handleNewSession = () => {
    setChatMessages([]);
    setUploadedImagePaths([]);
    setSelectedCategory(null);
    setCurrentGeneratedImage("");
    setCurrentThumbnail(null);
    setIsSessionActive(true); // Keep session active for new sessions
    setPrompt("");
    
    // Clear Zustand store
    const { clearCurrentSession } = useImageStore.getState();
    clearCurrentSession();
    
    toast.success("New session started!");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Thumbnail
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleNewSession}
              className="btn btn-outline btn-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> New Session
            </button>
          </div>
            {/* Help text */}
            {!selectedCategory && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Select a category above to enable generation
              </p>
            )}
            {selectedCategory && !prompt.trim() && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                Type your thumbnail idea to get started
              </p>
            )}
          </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
        {/* Left Panel */}
        <div className="space-y-6">
          {/* Upload */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">📸 Upload Reference Images</h3>
            <ImageUpload
              onImagesChange={(images) => {
                // Update the image paths for API calls
                setUploadedImagePaths(images.map(img => img.split('/').pop() || ''));
              }}
              onImagePathsChange={setUploadedImagePaths}
              maxImages={5}
              showTextInput={false}
              showGallery={true}
            />
          </div>

          {/* Categories */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">🎯 Select Category (Required)</h3>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedCategory?.id === category.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="text-sm font-medium">{category.name}</div>
                  </div>
                </button>
              ))}
            </div>
            {!selectedCategory && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-3 text-center">
                ⚠️ Please select a category to continue
              </p>
            )}
          </div>
        </div>

        {/* Center Preview Panel */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">🎨 Generated Thumbnail</h3>
            {currentGeneratedImage ? (
              <div className="relative group">
                <img
                  src={currentGeneratedImage}
                  alt="Generated thumbnail"
                  className="w-full rounded-lg border shadow-lg"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleDownload}
                    className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-full shadow-lg transition-all"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleLike(currentThumbnail?.id)}
                      className={`btn btn-sm ${
                        currentThumbnail?.isLiked 
                          ? 'btn-primary' 
                          : 'btn-outline'
                      }`}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${
                        currentThumbnail?.isLiked ? 'fill-current' : ''
                      }`} /> 
                      {currentThumbnail?.isLiked ? 'Liked' : 'Like'}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">
                    {currentThumbnail?.category && (
                      <span className="capitalize">{currentThumbnail.category}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  No thumbnail generated yet
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload images, select a category, and describe your idea to generate a thumbnail.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="card min-h-[600px] max-h-[80vh] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f3f4f6' }}>
            <AnimatePresence>
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Welcome to ClickPick!
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Upload a photo, pick a category, and describe your idea.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === "user"
                          ? "bg-primary-600 text-white"
                          : msg.type === "system"
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          : "bg-white dark:bg-gray-800 border text-gray-900 dark:text-white"
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: msg.content,
                        }}
                      />
                      {msg.isGenerating && (
                        <div className="flex items-center mt-2 space-x-2">
                          <div className="spinner-sm"></div>
                          <span className="text-xs opacity-70">
                            Processing...
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            {/* Status indicator */}
            {uploadedImagePaths.length > 0 && (
              <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  📸 {uploadedImagePaths.length} reference image{uploadedImagePaths.length > 1 ? 's' : ''} uploaded
                </div>
              </div>
            )}
            {currentGeneratedImage && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  🎨 Generated image ready for refinement
                </div>
              </div>
            )}
            <div className="flex space-x-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !selectedCategory
                    ? "Select a category first..."
                    : currentGeneratedImage
                    ? "Refine your thumbnail..."
                    : "Describe your thumbnail idea..."
                }
                disabled={isLoading}
                className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500 text-white placeholder:text-gray-400 bg-gray-800/50"
                rows={2}
              />
              <button
                onClick={handlePromptSubmit}
                disabled={!prompt.trim() || !selectedCategory}
                className={`px-5 ${
                  !prompt.trim() || !selectedCategory
                    ? "btn btn-disabled opacity-50 cursor-not-allowed"
                    : "btn btn-primary"
                }`}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : currentGeneratedImage ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refine
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Generate
                  </>
                )}
              </button>
            </div>
            {/* Help text */}
            {!selectedCategory && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-2 text-center">
                🎯 Select a category above to continue
              </p>
            )}
            {selectedCategory && !prompt.trim() && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                {currentGeneratedImage 
                  ? "Type your refinement request..." 
                  : "Type your thumbnail idea to get started..."
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateThumbnail;