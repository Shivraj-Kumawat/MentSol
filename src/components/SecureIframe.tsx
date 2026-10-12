import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecureIframeProps {
  src: string;
  title: string;
  allowCamera?: boolean;
  allowMicrophone?: boolean;
  allowFullscreen?: boolean;
  allowAutoplay?: boolean;
  allowClipboardRead?: boolean;
  allowClipboardWrite?: boolean;
  className?: string;
  sandbox?: string;
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * SecureIframe - A secure iframe component with proper permission handling
 * 
 * Features:
 * - Supports modern iframe permissions (camera, microphone, fullscreen, autoplay, clipboard)
 * - Configurable sandbox for security isolation
 * - Referrer policy for privacy protection
 * - URL validation and error handling
 * - Loading states and lazy loading
 */
export const SecureIframe = ({
  src,
  title,
  allowCamera = false,
  allowMicrophone = false,
  allowFullscreen = false,
  allowAutoplay = false,
  allowClipboardRead = false,
  allowClipboardWrite = false,
  className = '',
  sandbox = "allow-scripts allow-forms allow-popups allow-modals",
  referrerPolicy = "strict-origin-when-cross-origin",
  onLoad,
  onError,
}: SecureIframeProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate URL
    try {
      const url = new URL(src);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Only HTTP and HTTPS protocols are allowed');
      }
    } catch (err) {
      const errorMsg = 'Invalid iframe source URL';
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    }
  }, [src, onError]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    const errorMsg = 'Failed to load iframe content';
    setError(errorMsg);
    setIsLoading(false);
    onError?.(new Error(errorMsg));
  };

  // Build allow attribute with only supported permissions
  const allowedFeatures: string[] = [];
  if (allowCamera) allowedFeatures.push('camera');
  if (allowMicrophone) allowedFeatures.push('microphone');
  if (allowFullscreen) allowedFeatures.push('fullscreen');
  if (allowAutoplay) allowedFeatures.push('autoplay');
  if (allowClipboardRead) allowedFeatures.push('clipboard-read');
  if (allowClipboardWrite) allowedFeatures.push('clipboard-write');

  const allowAttribute = allowedFeatures.length > 0 ? allowedFeatures.join('; ') : undefined;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={src}
        title={title}
        allow={allowAttribute}
        sandbox={sandbox}
        referrerPolicy={referrerPolicy}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full border-0 rounded-lg ${isLoading ? 'invisible' : 'visible'}`}
        loading="lazy"
      />
    </div>
  );
};

/**
 * VideoCallIframe - Specialized iframe for video calls with camera and microphone
 */
export const VideoCallIframe = ({
  src,
  title = "Video Call",
  className = "w-full h-full min-h-[500px]",
  onLoad,
  onError,
}: Omit<SecureIframeProps, 'allowCamera' | 'allowMicrophone' | 'allowFullscreen' | 'allowAutoplay' | 'allowClipboardRead' | 'allowClipboardWrite'>) => {
  return (
    <SecureIframe
      src={src}
      title={title}
      allowCamera={true}
      allowMicrophone={true}
      allowFullscreen={true}
      allowAutoplay={true}
      allowClipboardRead={true}
      sandbox="allow-scripts allow-forms"
      referrerPolicy="strict-origin-when-cross-origin"
      className={className}
      onLoad={onLoad}
      onError={onError}
    />
  );
};
