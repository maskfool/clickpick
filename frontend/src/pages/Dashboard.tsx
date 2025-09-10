import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  Youtube,
  Sparkles,
  Image as ImageIcon,
  Type,
  Zap,
  Settings,
  Download,
  RefreshCw,
  Crown,
  Upload,
  Wand2,
  Play,
  RotateCcw,
  Star,
  Heart,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatArea } from "../components/ChatArea";
import { VideoCategories, VideoCategory } from "../components/VideoCategories";
import { ThumbnailPreview } from "../components/ThumbnailPreview";
import { GenerationModes } from "../components/GenerationModes";
import { AdvancedQuestions } from "../components/AdvancedQuestions";
import { GenerationCounter } from "../components/GenerationCounter";
import { ImageUpload } from "../components/ImageUpload";
import { thumbnailsAPI } from "@/services/api";

const MAX_REFINEMENTS = 100; // Increased for local testing

const Dashboard = () => {
  const { logout } = useAuthStore();

  // State management
  const [inputMethod, setInputMethod] = useState<'image' | 'text'>('text');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imagePaths, setImagePaths] = useState<string[]>([]); // Backend relative paths
  const [imageTextPrompt, setImageTextPrompt] = useState(""); // Text prompt for image mode
  const [prompt, setPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null); // base64 preview
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // relativePath from backend
  const [generatedThumbnail, setGeneratedThumbnail] = useState<string | null>(null);
  const [thumbnailId, setThumbnailId] = useState<string | null>(null);
  const [refinementCount, setRefinementCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<'video' | 'shorts' | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null); // Store base64 image data
  const [generationMode, setGenerationMode] = useState<'random' | 'advanced' | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generationCount, setGenerationCount] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load latest image from localStorage on component mount
  useEffect(() => {
    const savedImage = localStorage.getItem('clickpick-latest-image');
    if (savedImage) {
      setImageDataUrl(savedImage);
    }
  }, []);

  // ✅ Upload image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      // local preview
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target?.result as string);
      reader.readAsDataURL(file);

      // upload to backend
      const res = await thumbnailsAPI.uploadReference(file);
      if (res.data) {
        // UploadThing FileRouter returns file data directly
        const fileData = Array.isArray(res.data) ? res.data[0] : res.data;
        setReferenceImage(fileData.relativePath || fileData.key);
        toast.success("Reference image uploaded!");
      } else {
        toast.error("Failed to upload reference image");
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error("Image upload failed");
    }
  };

  // ✅ Generate
  const generateThumbnail = async () => {
    if (generationCount >= 100) { // Increased for local testing
      toast.error("Generation limit reached! Upgrade to Pro for unlimited generations.");
      return;
    }

    if (inputMethod === 'text' && !prompt.trim()) {
      toast.error("Please enter a text prompt");
      return;
    }

    if (inputMethod === 'image' && uploadedImages.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category first");
      return;
    }

    if (!generationMode) {
      toast.error("Please select a generation mode");
      return;
    }

    setIsGenerating(true);
    try {
      // Combine text prompt with image text prompt if in image mode
      let finalPrompt = aiPrompt || prompt;
      if (inputMethod === 'image' && imageTextPrompt.trim()) {
        finalPrompt = `${imageTextPrompt} ${finalPrompt}`.trim();
      }

      const res = await thumbnailsAPI.create({
        title: "AI Generated Thumbnail",
        description: "Generated by AI",
        category: selectedCategory,
        originalPrompt: finalPrompt,
        referenceImage: referenceImage || undefined,
        referenceImages: imagePaths.length > 0 ? imagePaths : undefined,
      });

      if (res.data?.success) {
        const thumbnail = res.data.data.thumbnail;
        setGeneratedThumbnail(thumbnail.imageUrl);
        setThumbnailId(thumbnail._id);
        setRefinementCount(0); // reset counter
        setSelectedRatio(null); // reset ratio selection
        setGenerationCount(prev => prev + 1);
        
        // Store image data for download
        try {
          // Convert the image URL to base64 and store it
          const imageResponse = await fetch(thumbnail.imageUrl.startsWith('/') 
            ? `${window.location.origin}${thumbnail.imageUrl}` 
            : thumbnail.imageUrl
          );
          const imageBlob = await imageResponse.blob();
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result as string;
            setImageDataUrl(base64Data);
            // Also store in localStorage as backup
            localStorage.setItem('clickpick-latest-image', base64Data);
          };
          reader.readAsDataURL(imageBlob);
        } catch (error) {
          console.error("Failed to store image data:", error);
        }
        
        toast.success("Thumbnail generated!");
      } else {
        toast.error("Generation failed");
      }
    } catch (err: any) {
      console.error("Generate error:", err);
      toast.error("Failed to generate thumbnail");
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ Refine
  const handleRefineRequest = async (userPrompt: string) => {
    if (!thumbnailId) {
      toast.error("No thumbnail to refine yet!");
      return;
    }
    if (refinementCount >= MAX_REFINEMENTS) {
      toast.error(`You've reached the max refinements (${MAX_REFINEMENTS}).`);
      return;
    }

    try {
      const res = await thumbnailsAPI.edit(thumbnailId, {
        userPrompt,
        referenceImage: referenceImage || undefined,
      });

      if (res.data?.success) {
        const updatedThumb = res.data.data.thumbnail;
        setGeneratedThumbnail(updatedThumb.imageUrl);
        setPrompt(updatedThumb.finalPrompt);
        setRefinementCount((c) => c + 1);
        
        // Store updated image data for download
        try {
          // Convert the image URL to base64 and store it
          const imageResponse = await fetch(updatedThumb.imageUrl.startsWith('/') 
            ? `${window.location.origin}${updatedThumb.imageUrl}` 
            : updatedThumb.imageUrl
          );
          const imageBlob = await imageResponse.blob();
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result as string;
            setImageDataUrl(base64Data);
            // Also store in localStorage as backup
            localStorage.setItem('clickpick-latest-image', base64Data);
          };
          reader.readAsDataURL(imageBlob);
        } catch (error) {
          console.error("Failed to store updated image data:", error);
        }
        
        toast.success(`Thumbnail refined (${refinementCount + 1}/${MAX_REFINEMENTS})`);
      } else {
        toast.error("Refinement failed");
      }
    } catch (err: any) {
      console.error("Refine error:", err);
      toast.error("Failed to refine thumbnail");
    }
  };

  // ✅ Keep prompt synced
  const handlePromptRefinement = (refinedPrompt: string) => {
    setPrompt(refinedPrompt);
  };

  // Handle advanced prompt generation
  const handleAdvancedPrompt = (prompt: string) => {
    setAiPrompt(prompt);
    setPrompt(prompt);
    toast.success("Advanced prompt generated! Ready to create thumbnail.");
  };

  // Handle upgrade
  const handleUpgrade = () => {
    toast.success("Upgrade feature coming soon! 🚀");
  };

  // ✅ Download generated thumbnail from localStorage
  const handleDownload = async () => {
    let imageData = imageDataUrl;
    
    // Fallback to localStorage if state doesn't have the image
    if (!imageData) {
      imageData = localStorage.getItem('clickpick-latest-image');
      if (!imageData) {
        toast.error("No image to download");
        return;
      }
    }

    try {
      // Convert base64 data URL to blob
      const response = await fetch(imageData);
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



  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-glow" />
      
      {/* Subtle floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-primary rounded-full blur-3xl opacity-5 animate-float" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-accent rounded-full blur-3xl opacity-5 animate-float-delayed" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }} />
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-accent/5" />

      {/* Header */}
      <header className="relative z-10 p-6 border-b border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-primary">
                <Youtube className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  ClickPick
                </h1>
                <p className="text-sm text-gray-300">
                  Professional YouTube Thumbnail Generator
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-primary/50 text-primary">
                <Crown className="w-3 h-3 mr-1" />
                Free Tier
              </Badge>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="border-border/50 hover:border-primary hover:shadow-primary"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          
          {/* Left Panel - Input & Controls */}
          <div className="col-span-4 space-y-6 overflow-y-auto h-[calc(100vh-200px)] pr-2">
            
            {/* Category Selection */}
            <VideoCategories
              onCategorySelect={(cat: VideoCategory) => setSelectedCategory(cat.id)}
              selectedCategory={selectedCategory}
            />

            {/* Input Method Selection */}
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Create From
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={inputMethod} onValueChange={(v: string) => setInputMethod(v as 'image' | 'text')}>
                  <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1">
                    <TabsTrigger 
                      value="image" 
                      className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-primary/10 data-[state=inactive]:hover:text-primary"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Images
                    </TabsTrigger>
                    <TabsTrigger 
                      value="text" 
                      className="flex items-center gap-2 transition-all duration-300 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-primary/10 data-[state=inactive]:hover:text-primary"
                    >
                      <Type className="w-4 h-4" />
                      Text
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="image" className="mt-4">
                    <ImageUpload 
                      onImagesChange={setUploadedImages}
                      onTextPromptChange={setImageTextPrompt}
                      onImagePathsChange={setImagePaths}
                      maxImages={5}
                      showTextInput={true}
                    />
                  </TabsContent>
                  
                  <TabsContent value="text" className="mt-4">
                    <div className="space-y-3">
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your perfect YouTube thumbnail..."
                        className="min-h-[120px] bg-input/80 backdrop-blur-sm border-border/50 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
                      />
                      <p className="text-xs text-gray-300">
                        Be specific about colors, style, elements, and mood you want
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Generation Modes */}
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  Generation Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GenerationModes 
                  onModeSelect={setGenerationMode}
                  selectedMode={generationMode}
                />
              </CardContent>
            </Card>

            {/* Advanced Questions */}
            {generationMode === 'advanced' && (
              <AdvancedQuestions onPromptGenerated={handleAdvancedPrompt} />
            )}

            {/* Generate Button */}
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
              <CardContent className="pt-6">
                <Button
                  onClick={generateThumbnail}
                  disabled={isGenerating || generationCount >= 100}
                  className="w-full h-12"
                  variant={generationCount >= 100 ? "outline" : "default"}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : generationCount >= 100 ? (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Upgrade to Generate
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Generate Thumbnail
                    </>
                  )}
                </Button>
                
                {(aiPrompt || prompt) && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Current Prompt:</p>
                    <p className="text-sm">{aiPrompt || prompt}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Preview */}
          <div className="col-span-5 h-[calc(100vh-200px)]">
            <ThumbnailPreview
              imageUrl={generatedThumbnail}
              isGenerating={isGenerating}
              onDownload={handleDownload}
              onRegenerate={generateThumbnail}
            />
          </div>

          {/* Right Panel - Chat */}
          <div className="col-span-3 h-[calc(100vh-200px)]">
            <ChatArea
              onPromptRefinement={handlePromptRefinement}
              onRefineRequest={handleRefineRequest}
              currentPrompt={prompt}
              generationCount={generationCount}
              maxGenerationCount={100}
              onUpgrade={handleUpgrade}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;