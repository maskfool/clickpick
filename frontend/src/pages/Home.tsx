// src/pages/Home.tsx
import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  Play,
  Users,
  TrendingUp,
  Shield,
  Star,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const Home = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("test1@example.com");
  const [password, setPassword] = useState("s2ecret123");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-screen bg-gradient-hero relative overflow-hidden text-foreground">
      {/* glowing blobs */}
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-gradient-accent rounded-full blur-3xl opacity-20 animate-pulse delay-1000" />

      {/* header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-primary">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-yellow-500 drop-shadow-lg">
                ThumbnailAI Studio
              </h1>
              <p className="text-gray-400">Professional AI Creation Suite</p>
            </div>
          </div>

          <Button
            variant="outline"
            className="rounded-2xl text-black hover:border-yellow-400 border-gray-600"
          >
            <Star className="w-4 h-4 mr-2" />
            Go Pro
          </Button>
        </div>
      </header>

      {/* main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 h-[calc(100vh-80px)] flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* left hero text */}
          <div className="space-y-8">
            <div className="space-y-6">
              <Badge className="bg-gradient-accent text-accent-foreground px-4 py-2 shadow-accent rounded-2xl">
                <Zap className="w-4 h-4 mr-2" />
                Gemini AI Powered
              </Badge>

              <h2 className="text-6xl font-bold leading-tight text-white">
                Create Stunning{" "}
                <span className="text-yellow-400">YouTube</span>{" "}
                Thumbnails in Seconds
              </h2>

              <p className="text-xl text-gray-400 leading-relaxed">
                Transform your content with AI-powered thumbnail generation. Get
                more clicks, more views, and grow your channel faster than ever
                before.
              </p>
            </div>

            {/* features */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: Play, title: "Instant Generation", desc: "30 sec" },
                { icon: Users, title: "50M+ Creators", desc: "Trust us" },
                { icon: TrendingUp, title: "3x More Clicks", desc: "Proven" },
                { icon: Shield, title: "Copyright Safe", desc: "100% AI" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{f.title}</h4>
                    <p className="text-sm text-gray-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right login form */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-gray-700 shadow-strong rounded-2xl">
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto shadow-primary">
                  <Sparkles className="w-8 h-8 text-black" />
                </div>
                <CardTitle className="text-2xl font-bold text-white">
                  Welcome
                </CardTitle>
                <p className="text-gray-400">
                  Sign in to access your creative studio
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-black/40 border border-gray-600 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      />
                    </div>
                  </div>

                  {/* password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-black/40 border border-gray-600 text-white placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-yellow-400 text-black font-semibold rounded-xl py-2 hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
                  >
                    Sign In
                  </Button>
                </form>

                {/* forgot password */}
                <div className="text-center">
                  <Button variant="link" className="text-yellow-400 p-0">
                    Forgot your password?
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;