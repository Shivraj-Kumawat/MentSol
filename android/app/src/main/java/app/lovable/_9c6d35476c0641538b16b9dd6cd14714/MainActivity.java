package app.lovable._9c6d35476c0641538b16b9dd6cd14714;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * MainActivity with custom WebChromeClient for WebRTC permissions.
 * 
 * This handles the Android runtime permission flow for camera/microphone:
 * 1. WebView calls getUserMedia() for video call
 * 2. onPermissionRequest() is triggered
 * 3. We check/request Android runtime permissions (CAMERA, RECORD_AUDIO)
 * 4. After user grants, we grant the WebView permission request
 */
public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;
    private PermissionRequest pendingPermissionRequest;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        
        // Configure WebView for media playback
        WebView webView = this.bridge.getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            
            // Set custom WebChromeClient to handle WebRTC permission requests
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> handleWebRTCPermissionRequest(request));
                }
                
                @Override
                public void onPermissionRequestCanceled(PermissionRequest request) {
                    super.onPermissionRequestCanceled(request);
                    if (request == pendingPermissionRequest) {
                        pendingPermissionRequest = null;
                    }
                }
            });
        }
    }

    /**
     * Handle WebRTC permission requests from the WebView.
     * This maps WebView resource requests to Android runtime permissions.
     */
    private void handleWebRTCPermissionRequest(PermissionRequest request) {
        String[] resources = request.getResources();
        List<String> permissionsNeeded = new ArrayList<>();
        boolean needsCamera = false;
        boolean needsMicrophone = false;
        
        // Map WebView resources to Android permissions
        for (String resource : resources) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                needsCamera = true;
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) 
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsNeeded.add(Manifest.permission.CAMERA);
                }
            }
            if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                needsMicrophone = true;
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) 
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsNeeded.add(Manifest.permission.RECORD_AUDIO);
                }
                // Also add MODIFY_AUDIO_SETTINGS for better audio handling
                if (ContextCompat.checkSelfPermission(this, Manifest.permission.MODIFY_AUDIO_SETTINGS) 
                        != PackageManager.PERMISSION_GRANTED) {
                    permissionsNeeded.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);
                }
            }
        }
        
        // If all needed permissions are already granted, grant to WebView
        if (permissionsNeeded.isEmpty()) {
            request.grant(request.getResources());
            return;
        }
        
        // Store the pending request and ask Android for permissions
        pendingPermissionRequest = request;
        ActivityCompat.requestPermissions(
            this,
            permissionsNeeded.toArray(new String[0]),
            PERMISSION_REQUEST_CODE
        );
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, 
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == PERMISSION_REQUEST_CODE && pendingPermissionRequest != null) {
            // Check if critical permissions (camera/mic) were granted
            boolean cameraGranted = true;
            boolean micGranted = true;
            
            for (int i = 0; i < permissions.length; i++) {
                if (Manifest.permission.CAMERA.equals(permissions[i])) {
                    cameraGranted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                }
                if (Manifest.permission.RECORD_AUDIO.equals(permissions[i])) {
                    micGranted = grantResults[i] == PackageManager.PERMISSION_GRANTED;
                }
            }
            
            // Grant or deny WebView based on Android permission result
            if (cameraGranted && micGranted) {
                pendingPermissionRequest.grant(pendingPermissionRequest.getResources());
            } else {
                pendingPermissionRequest.deny();
            }
            
            pendingPermissionRequest = null;
        }
    }
}
