import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bug, 
  Shield, 
  Eye, 
  RefreshCw, 
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Extend Window interface for lovable-fix v3
declare global {
  interface Window {
    LOVABLE_FIX?: {
      stripTokenFromUrl: (url: string) => string;
      scrubAll: () => void;
      removeBadAllowFeatures: (allowStr: string) => string;
      version?: string;
    };
    LOVABLE_FIX_TRUSTED_IFRAME_IDS?: string[];
  }
}

interface DebugSettings {
  tokenScrubbing: boolean;
  iframeSanitization: boolean;
}

const DebugSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<DebugSettings>({
    tokenScrubbing: true,
    iframeSanitization: true,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lovable-fix-settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load debug settings', e);
      }
    }
  }, []);

  const updateSetting = (key: keyof DebugSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('lovable-fix-settings', JSON.stringify(newSettings));

    // Show toast with reload instruction
    toast({
      title: "Setting Updated",
      description: "Please reload the page for changes to take effect.",
      action: (
        <Button size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Reload
        </Button>
      ),
    });
  };

  const resetToDefaults = () => {
    const defaults: DebugSettings = {
      tokenScrubbing: true,
      iframeSanitization: true,
    };
    setSettings(defaults);
    localStorage.setItem('lovable-fix-settings', JSON.stringify(defaults));
    
    toast({
      title: "Reset to Defaults",
      description: "Please reload the page for changes to take effect.",
    });
  };

  const clearAllData = () => {
    localStorage.removeItem('lovable-fix-settings');
    if (window.LOVABLE_FIX) {
      window.LOVABLE_FIX.scrubAll();
    }
    toast({
      title: "Data Cleared",
      description: "All debug settings and tokens have been cleared.",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/home", { replace: true })}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bug className="w-6 h-6 text-primary" />
                Debug Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Control Lovable Fix V3 features for debugging and development
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Bug className="w-3 h-3" />
              Developer Tools
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Warning Banner */}
        <Card className="mb-6 border-yellow-500/50 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <AlertTriangle className="w-5 h-5" />
              Developer Mode
            </CardTitle>
            <CardDescription>
              These settings control token scrubbing and iframe sanitization features.
              Changes require a page reload to take effect.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Token Scrubbing */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <CardTitle>Token Scrubbing</CardTitle>
                  <CardDescription>
                    Remove __lovable_token from URLs and iframe sources
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={settings.tokenScrubbing}
                onCheckedChange={(checked) => updateSetting('tokenScrubbing', checked)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Security features:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Removes __lovable_token from browser address bar on page load</li>
                <li>Strips tokens from iframe src attributes</li>
                <li>Prevents token exposure in URLs</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Iframe Sanitization */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Eye className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                </div>
                <div>
                  <CardTitle>Iframe Sanitization</CardTitle>
                  <CardDescription>
                    Clean iframe attributes to remove unsupported features and fix sandbox issues
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={settings.iframeSanitization}
                onCheckedChange={(checked) => updateSetting('iframeSanitization', checked)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Sanitization rules:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>Remove unsupported allow attributes (vr, battery, ambient-light-sensor)</li>
                <li>Fix dangerous sandbox combinations (allow-scripts + allow-same-origin)</li>
                <li>Automatically applied to existing and dynamically added iframes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            variant="destructive"
            onClick={clearAllData}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Clear All Data & Reload
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Developer Info</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              These settings are stored in localStorage and persist across sessions.
              To manually control features, use the browser console:
            </p>
            <code className="block bg-background p-3 rounded border text-xs">
              window.LOVABLE_FIX.stripTokenFromUrl(url)<br />
              window.LOVABLE_FIX.scrubAll()<br />
              window.LOVABLE_FIX.removeBadAllowFeatures(allowStr)<br />
              console.log(window.LOVABLE_FIX.version) // "3.0"
            </code>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DebugSettings;
