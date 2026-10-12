import { useEffect } from 'react';
import html2canvas from 'html2canvas';

interface CaptureRequest {
  type: 'PS_CAPTURE_REQUEST';
  device: { width: number; height: number };
  filename: string;
}

export const PlayStoreCaptureListener = () => {
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type !== 'PS_CAPTURE_REQUEST') return;

      const { device, filename } = event.data as CaptureRequest;

      try {
        // Wait for images and layout to settle
        await new Promise(resolve => setTimeout(resolve, 500));

        const root = document.getElementById('root') || document.body;
        
        const canvas = await html2canvas(root, {
          backgroundColor: '#ffffff',
          useCORS: true,
          scale: 2,
          width: device.width,
          height: device.height,
          windowWidth: device.width,
          windowHeight: device.height,
          logging: false,
        });

        const dataUrl = canvas.toDataURL('image/png');

        window.parent.postMessage({
          type: 'PS_CAPTURE_RESULT',
          ok: true,
          dataUrl,
          filename,
        }, '*');
      } catch (error) {
        console.error('Screenshot capture failed:', error);
        window.parent.postMessage({
          type: 'PS_CAPTURE_RESULT',
          ok: false,
          error: error instanceof Error ? error.message : 'Capture failed',
          filename,
        }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return null;
};
