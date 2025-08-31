import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Bot, User, RefreshCw } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatAreaProps {
  onPromptRefinement: (refinedPrompt: string) => void;
  onRefineRequest: (userPrompt: string) => Promise<void>; // ✅ new callback
  currentPrompt: string;
}

export const ChatArea = ({ onPromptRefinement, onRefineRequest, currentPrompt }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I can help you refine your thumbnail prompt. What changes would you like to make?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsProcessing(true);

    try {
      // ✅ Ask Dashboard to refine via backend
      await onRefineRequest(userMessage.text);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Applied refinement: " + userMessage.text,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      const refinedPrompt = `${currentPrompt} with ${userMessage.text.toLowerCase()}`;
      onPromptRefinement(refinedPrompt);
    } catch {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "❌ Failed to refine thumbnail",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }

    setIsProcessing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestions = [
    "Make it more colorful",
    "Add dramatic lighting",
    "Include text overlay",
    "Change background",
  ];

  return (
    <Card className="h-full bg-black/50 backdrop-blur-xl border shadow-card flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-accent-foreground" />
          </div>
          AI Chat Assistant
          <Badge className="bg-gradient-primary text-primary-foreground text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[75%] rounded-xl p-3 ${
                  msg.isUser
                    ? "bg-gradient-primary text-primary-foreground"
                    : "bg-card/80 border border-border/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                  <span className="text-xs opacity-70">
                    {msg.isUser ? "You" : "AI Assistant"}
                  </span>
                </div>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-card/80 border border-border/50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="text-xs opacity-70">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2 text-black">
              {quickSuggestions.map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 border-border/50 hover:border-primary/50 rounded-2xl"
                  onClick={() => setInputText(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for refinements..."
            className="flex-1 bg-input/80 backdrop-blur-sm border-border/50 text-sm"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            className="bg-gradient-primary hover:shadow-primary"
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};