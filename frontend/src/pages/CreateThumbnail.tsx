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
import { thumbnailsAPI } from "../services/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadedImagePath, setUploadedImagePath] = useState<string>("");
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

        setUploadedImage(file);
        setPreviewUrl(imageUrl);
        // Store the relative path for sending to Gemini API
        setUploadedImagePath(relativePath);
        
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
      console.log("🔍 DEBUG: uploadedImagePath:", uploadedImagePath);
      console.log("🔍 DEBUG: typeof uploadedImagePath:", typeof uploadedImagePath);
      console.log("🔍 DEBUG: currentPrompt:", currentPrompt);
      
      const requestData = {
        title: `AI Thumbnail - ${Date.now()}`,
        category: selectedCategory.id,
        originalPrompt: currentPrompt,
        referenceImage: uploadedImagePath || undefined, // Only send if image exists
      };
      
      console.log("🔍 DEBUG: Final requestData:", requestData);
      
      const response = await thumbnailsAPI.create(requestData);

      const { thumbnail } = response.data.data;
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
      setCurrentThumbnail(thumbnail);
      setCurrentGeneratedImage(thumbnail.imageUrl);

      addMessage("ai", `✨ Thumbnail generated!`, thumbnail.imageUrl);
      toast.success("Thumbnail generated successfully!");
    } catch {
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
      
      const response = await thumbnailsAPI.edit(currentThumbnail.id, {
        userPrompt: refinementPrompt,
        chatHistory: chatMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      });
      
      const { thumbnail } = response.data.data;
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
      setCurrentGeneratedImage(thumbnail.imageUrl);
      setCurrentThumbnail(thumbnail);

      addMessage("ai", `🎯 Thumbnail refined!`, thumbnail.imageUrl);
      toast.success("Thumbnail refined successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to refine thumbnail");
      setChatMessages((prev) => prev.filter((msg) => !msg.isGenerating));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (currentGeneratedImage) {
      const link = document.createElement("a");
      link.href = currentGeneratedImage;
      link.download = `clickpick-thumbnail-${Date.now()}.png`;
      link.click();
      toast.success("Download started!");
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
    setUploadedImage(null);
    setPreviewUrl("");
    setUploadedImagePath("");
    setSelectedCategory(null);
    setCurrentGeneratedImage("");
    setCurrentThumbnail(null);
    setIsSessionActive(true); // Keep session active for new sessions
    setPrompt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            {currentGeneratedImage && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="btn btn-primary btn-sm"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </button>
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
            )}
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
            <h3 className="font-semibold mb-4">📸 Upload Reference</h3>
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition"
              >
                <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">PNG, JPG up to 10MB</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Uploaded reference"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setPreviewUrl("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
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

        {/* Chat Panel */}
        <div className="lg:col-span-2 card min-h-[600px] max-h-[80vh] flex flex-col">
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
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={msg.imageUrl}
                            alt="Generated"
                            className="w-full rounded-lg border"
                          />
                        </div>
                      )}
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
            {uploadedImagePath && (
              <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center text-sm text-green-700 dark:text-green-300">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  📸 Reference image uploaded: {uploadedImagePath.split('/').pop()}
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
                className="w-full px-4 py-2 border rounded-lg resize-none focus:ring-2 focus:ring-primary-500"
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