import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Smartphone, Tablet, Monitor, Check, Sparkles, GraduationCap, Heart, Brain, Users, Star, MessageCircle, BookOpen } from "lucide-react";
import { toast } from "sonner";

type DeviceType = "phone" | "tablet7" | "tablet10";

interface Screenshot {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
}

const screenshots: Screenshot[] = [
  {
    id: 1,
    title: "Connect with Verified Mentors",
    subtitle: "IITians • Doctors • Experts",
    icon: <Users className="w-16 h-16 text-white" />,
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    features: ["Verified profiles", "Instant booking", "Secure payments"]
  },
  {
    id: 2,
    title: "10+ Expert Categories",
    subtitle: "Find Your Perfect Mentor",
    icon: <Sparkles className="w-16 h-16 text-white" />,
    gradient: "from-orange-500 via-red-500 to-pink-600",
    features: ["JEE/NEET Prep", "College Counselling", "Career Guidance"]
  },
  {
    id: 3,
    title: "Become a Mentor",
    subtitle: "Share Knowledge & Earn",
    icon: <Star className="w-16 h-16 text-white" />,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    features: ["Flexible hours", "Set your rate", "Grow your impact"]
  },
  {
    id: 4,
    title: "College Counselling",
    subtitle: "IIT • NIT • AIIMS Guidance",
    icon: <GraduationCap className="w-16 h-16 text-white" />,
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
    features: ["College predictor", "Branch selection", "Admission help"]
  },
  {
    id: 5,
    title: "JEE & NEET Preparation",
    subtitle: "Learn from Toppers",
    icon: <BookOpen className="w-16 h-16 text-white" />,
    gradient: "from-amber-500 via-orange-500 to-red-600",
    features: ["Study strategy", "Doubt solving", "Mock analysis"]
  },
  {
    id: 6,
    title: "Mental Wellness",
    subtitle: "Personal Growth Support",
    icon: <Heart className="w-16 h-16 text-white" />,
    gradient: "from-pink-500 via-rose-500 to-red-600",
    features: ["Stress management", "Counselling", "Life coaching"]
  },
  {
    id: 7,
    title: "Trusted by Students",
    subtitle: "Real Mentors. Real Impact.",
    icon: <Check className="w-16 h-16 text-white" />,
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    features: ["Verified mentors", "Quality sessions", "Quick response"]
  },
  {
    id: 8,
    title: "24/7 AI Support",
    subtitle: "Instant Help Anytime",
    icon: <MessageCircle className="w-16 h-16 text-white" />,
    gradient: "from-cyan-500 via-blue-500 to-indigo-600",
    features: ["Smart chatbot", "Quick answers", "Always available"]
  }
];

const deviceSpecs = {
  phone: { width: 1080, height: 2400, label: "Phone", displayWidth: 270, displayHeight: 600 },
  tablet7: { width: 1200, height: 1920, label: "7\" Tablet", displayWidth: 300, displayHeight: 480 },
  tablet10: { width: 1600, height: 2560, label: "10\" Tablet", displayWidth: 320, displayHeight: 512 }
};

const PlayStoreScreenshots = () => {
  const [activeDevice, setActiveDevice] = useState<DeviceType>("phone");
  const [downloading, setDownloading] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateScreenshot = async (screenshot: Screenshot, device: DeviceType): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    const specs = deviceSpecs[device];
    canvas.width = specs.width;
    canvas.height = specs.height;

    // Create gradient background
    const gradientColors = screenshot.gradient.split(" ").filter(c => c.startsWith("from-") || c.startsWith("via-") || c.startsWith("to-"));
    const colorMap: Record<string, string> = {
      "from-violet-600": "#7c3aed", "via-purple-600": "#9333ea", "to-indigo-700": "#4338ca",
      "from-orange-500": "#f97316", "via-red-500": "#ef4444", "to-pink-600": "#db2777",
      "from-emerald-500": "#10b981", "via-teal-500": "#14b8a6", "to-cyan-600": "#0891b2",
      "from-blue-600": "#2563eb", "via-indigo-600": "#4f46e5", "to-purple-700": "#7e22ce",
      "from-amber-500": "#f59e0b", "via-orange-500-2": "#f97316", "to-red-600": "#dc2626",
      "from-pink-500": "#ec4899", "via-rose-500": "#f43f5e", "to-rose-600": "#e11d48",
      "from-green-500": "#22c55e", "via-emerald-500-2": "#10b981", "to-teal-600": "#0d9488",
      "from-cyan-500": "#06b6d4", "via-blue-500": "#3b82f6", "to-indigo-600": "#4f46e5"
    };

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colorMap[gradientColors[0]] || "#7c3aed");
    gradient.addColorStop(0.5, colorMap[gradientColors[1]] || "#9333ea");
    gradient.addColorStop(1, colorMap[gradientColors[2]] || "#4338ca");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add subtle pattern overlay
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.fillRect(0, i, canvas.width, 20);
    }

    // Add decorative circles
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.15, canvas.width * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.85, canvas.width * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // MentSol Logo/Brand
    const logoSize = Math.min(canvas.width * 0.12, 120);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.roundRect(canvas.width * 0.5 - logoSize/2, canvas.height * 0.08, logoSize, logoSize, logoSize * 0.2);
    ctx.fill();
    
    ctx.font = `bold ${logoSize * 0.5}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("M", canvas.width * 0.5, canvas.height * 0.08 + logoSize * 0.7);

    // Main icon circle
    const iconSize = Math.min(canvas.width * 0.25, 280);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.5, canvas.height * 0.35, iconSize, 0, Math.PI * 2);
    ctx.fill();

    // Icon placeholder (we'll draw a simple representation)
    ctx.fillStyle = "#ffffff";
    ctx.font = `${iconSize * 0.6}px system-ui`;
    ctx.textAlign = "center";
    const iconEmojis = ["👥", "✨", "⭐", "🎓", "📚", "❤️", "✓", "💬"];
    ctx.fillText(iconEmojis[screenshot.id - 1], canvas.width * 0.5, canvas.height * 0.35 + iconSize * 0.2);

    // Title
    const titleSize = Math.min(canvas.width * 0.07, 72);
    ctx.font = `bold ${titleSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    
    // Word wrap for title
    const words = screenshot.title.split(" ");
    let lines: string[] = [];
    let currentLine = "";
    const maxWidth = canvas.width * 0.85;
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const titleY = canvas.height * 0.55;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width * 0.5, titleY + i * titleSize * 1.2);
    });

    // Subtitle
    const subtitleSize = Math.min(canvas.width * 0.04, 40);
    ctx.font = `${subtitleSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(screenshot.subtitle, canvas.width * 0.5, titleY + lines.length * titleSize * 1.2 + subtitleSize * 1.5);

    // Feature pills
    const pillY = canvas.height * 0.75;
    const pillHeight = Math.min(canvas.width * 0.08, 56);
    const pillSpacing = pillHeight * 1.4;
    const pillFontSize = Math.min(canvas.width * 0.032, 28);

    screenshot.features.forEach((feature, i) => {
      const pillWidth = ctx.measureText(feature).width + pillHeight;
      const x = canvas.width * 0.5 - pillWidth / 2;
      const y = pillY + i * pillSpacing;

      // Pill background
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.roundRect(x, y, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();

      // Checkmark
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(x + pillHeight / 2, y + pillHeight / 2, pillHeight * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${pillFontSize}px system-ui`;
      ctx.fillText("✓", x + pillHeight / 2, y + pillHeight / 2 + pillFontSize * 0.35);

      // Feature text
      ctx.font = `${pillFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(feature, x + pillHeight, y + pillHeight / 2 + pillFontSize * 0.35);
      ctx.textAlign = "center";
    });

    // App name at bottom
    const appNameSize = Math.min(canvas.width * 0.05, 48);
    ctx.font = `bold ${appNameSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("MentSol", canvas.width * 0.5, canvas.height * 0.95);

    return canvas.toDataURL("image/png");
  };

  const downloadScreenshot = async (screenshot: Screenshot, device: DeviceType) => {
    setDownloading(screenshot.id);
    try {
      const dataUrl = await generateScreenshot(screenshot, device);
      const link = document.createElement("a");
      link.download = `mentsol-${device}-${screenshot.id}-${screenshot.title.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
      toast.success(`Downloaded screenshot ${screenshot.id}`);
    } catch (error) {
      toast.error("Failed to generate screenshot");
      console.error(error);
    }
    setDownloading(null);
  };

  const downloadAll = async (device: DeviceType) => {
    toast.info(`Generating ${screenshots.length} screenshots...`);
    for (const screenshot of screenshots) {
      await downloadScreenshot(screenshot, device);
      await new Promise(r => setTimeout(r, 300));
    }
    toast.success("All screenshots downloaded!");
  };

  const renderScreenshotPreview = (screenshot: Screenshot, device: DeviceType) => {
    const specs = deviceSpecs[device];
    
    return (
      <Card 
        key={screenshot.id} 
        className="overflow-hidden bg-card border-border/50 hover:border-primary/50 transition-all duration-300 group"
      >
        <div 
          className={`relative bg-gradient-to-br ${screenshot.gradient} p-6 flex flex-col items-center justify-center text-white`}
          style={{ 
            width: specs.displayWidth, 
            height: specs.displayHeight,
            aspectRatio: `${specs.width}/${specs.height}`
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="text-xl font-bold">M</span>
          </div>
          
          {/* Main icon */}
          <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mb-4 mt-8">
            {screenshot.icon}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-center leading-tight mb-1">{screenshot.title}</h3>
          <p className="text-sm text-white/80 mb-4">{screenshot.subtitle}</p>
          
          {/* Features */}
          <div className="flex flex-col gap-2 w-full px-2">
            {screenshot.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 text-xs">
                <Check className="w-3 h-3 text-green-300" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          {/* App name */}
          <p className="absolute bottom-3 text-xs text-white/50 font-medium">MentSol</p>
        </div>
        
        <div className="p-3 flex items-center justify-between bg-card">
          <span className="text-sm font-medium text-foreground">#{screenshot.id}</span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => downloadScreenshot(screenshot, device)}
            disabled={downloading === screenshot.id}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {downloading === screenshot.id ? "..." : "Download"}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Play Store Screenshots
          </h1>
          <p className="text-muted-foreground">
            Download professional screenshots for Phone, 7" Tablet, and 10" Tablet
          </p>
        </div>

        {/* Device Tabs */}
        <Tabs value={activeDevice} onValueChange={(v) => setActiveDevice(v as DeviceType)} className="w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="phone" className="gap-2">
                <Smartphone className="w-4 h-4" />
                Phone
              </TabsTrigger>
              <TabsTrigger value="tablet7" className="gap-2">
                <Tablet className="w-4 h-4" />
                7" Tab
              </TabsTrigger>
              <TabsTrigger value="tablet10" className="gap-2">
                <Monitor className="w-4 h-4" />
                10" Tab
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={() => downloadAll(activeDevice)} className="gap-2">
              <Download className="w-4 h-4" />
              Download All ({deviceSpecs[activeDevice].label})
            </Button>
          </div>

          {/* Specs Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm">
              <span className="font-medium">{deviceSpecs[activeDevice].label}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {deviceSpecs[activeDevice].width} × {deviceSpecs[activeDevice].height} px
              </span>
            </div>
          </div>

          {/* Screenshots Grid */}
          {(["phone", "tablet7", "tablet10"] as DeviceType[]).map((device) => (
            <TabsContent key={device} value={device} className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
                {screenshots.map((screenshot) => renderScreenshotPreview(screenshot, device))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">📱 Play Store Requirements</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Phone: 1080 × 2400 px (16:9 or taller)</li>
            <li>• 7-inch Tablet: 1200 × 1920 px</li>
            <li>• 10-inch Tablet: 1600 × 2560 px</li>
            <li>• Format: PNG (automatically applied)</li>
            <li>• Minimum 2 screenshots, up to 8 per device type</li>
          </ul>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PlayStoreScreenshots;
