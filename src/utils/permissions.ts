/**
 * Permission utilities for camera and microphone access
 * Required for video calls in Capacitor native apps
 */

import { Capacitor } from '@capacitor/core';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface PermissionResult {
  granted: boolean;
  camera: PermissionStatus;
  microphone: PermissionStatus;
  errorMessage?: string;
}

/**
 * Check if running on native platform
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get current platform
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Check current permission status without triggering a prompt
 */
export const checkMediaPermissions = async (): Promise<PermissionResult> => {
  console.log('[Permissions] Checking permissions - Platform:', getPlatform(), 'Native:', isNativePlatform());

  // On native platforms, we can't reliably check without requesting
  // So we'll return 'prompt' to indicate we need to request
  if (isNativePlatform()) {
    console.log('[Permissions] Native platform - returning prompt status');
    return { 
      granted: false, 
      camera: 'prompt', 
      microphone: 'prompt' 
    };
  }

  // Check if permissions API is available (web only)
  if (!navigator.permissions || !navigator.permissions.query) {
    console.log('[Permissions] Permissions API not available, will need to request directly');
    return { 
      granted: false, 
      camera: 'unavailable', 
      microphone: 'unavailable' 
    };
  }

  try {
    const [cameraResult, micResult] = await Promise.all([
      navigator.permissions.query({ name: 'camera' as PermissionName }),
      navigator.permissions.query({ name: 'microphone' as PermissionName })
    ]);

    const cameraState = cameraResult.state as PermissionStatus;
    const micState = micResult.state as PermissionStatus;

    console.log('[Permissions] Current status - Camera:', cameraState, 'Microphone:', micState);

    return {
      granted: cameraState === 'granted' && micState === 'granted',
      camera: cameraState,
      microphone: micState
    };
  } catch (error) {
    console.warn('[Permissions] Error checking permissions:', error);
    return { 
      granted: false, 
      camera: 'unavailable', 
      microphone: 'unavailable' 
    };
  }
};

/**
 * Request camera and microphone permissions
 * This will trigger the native permission prompt if needed
 */
export const requestMediaPermissions = async (): Promise<PermissionResult> => {
  console.log('[Permissions] Requesting camera and microphone access...');
  console.log('[Permissions] Platform:', getPlatform());
  console.log('[Permissions] Is native:', isNativePlatform());

  // On native platforms, use the native permission flow
  // This triggers Android runtime permissions via our MainActivity.java
  if (isNativePlatform()) {
    console.log('[Permissions] Using native permission request flow');
    return requestNativePermissions();
  }

  // Web browser flow
  try {
    // First check current status
    const currentStatus = await checkMediaPermissions();
    
    // If already granted, return immediately
    if (currentStatus.granted) {
      console.log('[Permissions] Already granted');
      return currentStatus;
    }

    // If already denied on web, return with instructions
    if (currentStatus.camera === 'denied' || currentStatus.microphone === 'denied') {
      console.log('[Permissions] Previously denied, need settings change');
      return {
        granted: false,
        camera: currentStatus.camera,
        microphone: currentStatus.microphone,
        errorMessage: 'Permissions were previously denied. Please enable camera and microphone in your browser settings.'
      };
    }

    // Request permissions by calling getUserMedia
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    // Stop the stream immediately (we just needed to trigger the prompt)
    stream.getTracks().forEach(track => track.stop());
    
    console.log('[Permissions] Permissions granted successfully');
    return { 
      granted: true, 
      camera: 'granted', 
      microphone: 'granted' 
    };
  } catch (error: any) {
    console.error('[Permissions] Permission request failed:', error);
    
    let errorMessage = 'Could not access camera/microphone. ';
    let cameraStatus: PermissionStatus = 'denied';
    let micStatus: PermissionStatus = 'denied';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage += 'Please enable permissions in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera or microphone found on this device.';
      cameraStatus = 'unavailable';
      micStatus = 'unavailable';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera/microphone is already in use by another app.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera/microphone constraints could not be satisfied.';
    } else {
      errorMessage += error.message || 'Unknown error occurred.';
    }

    return { 
      granted: false, 
      camera: cameraStatus, 
      microphone: micStatus,
      errorMessage 
    };
  }
};

/**
 * Request permissions on native platforms
 * This triggers the native Android/iOS permission dialog via getUserMedia
 * which is handled by our custom MainActivity.java on Android
 */
export const requestNativePermissions = async (): Promise<PermissionResult> => {
  console.log('[Permissions] Requesting permissions on native platform...');
  console.log('[Permissions] Platform:', getPlatform());
  
  try {
    // On native, calling getUserMedia triggers the native permission dialog
    // Our MainActivity.java intercepts this and shows Android runtime permissions
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    
    // Stop the stream immediately - we just needed to trigger the permission request
    stream.getTracks().forEach(track => {
      console.log('[Permissions] Stopping track:', track.kind);
      track.stop();
    });
    
    console.log('[Permissions] Native permissions granted successfully');
    return { 
      granted: true, 
      camera: 'granted', 
      microphone: 'granted' 
    };
  } catch (error: any) {
    console.error('[Permissions] Native permission request failed:', error);
    console.error('[Permissions] Error name:', error.name);
    console.error('[Permissions] Error message:', error.message);
    
    let errorMessage = 'Permission denied. ';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Camera and microphone access was denied. Please enable permissions in Settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera or microphone found on this device.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera or microphone is already in use by another app.';
    } else {
      errorMessage += error.message || 'Please check your device settings.';
    }
    
    return { 
      granted: false, 
      camera: 'denied', 
      microphone: 'denied',
      errorMessage 
    };
  }
};

/**
 * Open device settings using native settings plugin
 */
export const openDeviceSettings = async (): Promise<boolean> => {
  console.log('[Permissions] Opening device settings - Platform:', getPlatform());
  
  if (isNativePlatform()) {
    try {
      const platform = getPlatform();
      
      if (platform === 'android') {
        console.log('[Permissions] Opening Android app settings...');
        await NativeSettings.openAndroid({
          option: AndroidSettings.ApplicationDetails
        });
        return true;
      } else if (platform === 'ios') {
        console.log('[Permissions] Opening iOS app settings...');
        await NativeSettings.openIOS({
          option: IOSSettings.App
        });
        return true;
      }
    } catch (error) {
      console.error('[Permissions] Failed to open settings:', error);
      return false;
    }
  }
  
  // On web, we can't open settings directly
  console.log('[Permissions] Cannot open settings programmatically on web');
  return false;
};
