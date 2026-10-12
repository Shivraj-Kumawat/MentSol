import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, CheckCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isDetailsOpen: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isDetailsOpen: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary] Error caught:', error);
    console.error('📋 [ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // DEFENSIVE: Detect Safari/iOS specific errors for debugging
    const errorMessage = error?.message || '';
    const isSafariError = errorMessage.includes("undefined is not an object") ||
                          errorMessage.includes("null is not an object") ||
                          errorMessage.includes("'length' of undefined") ||
                          errorMessage.includes("'length' of null");
    
    if (isSafariError) {
      console.warn('🍎 [ErrorBoundary] Safari/iOS compatibility error detected');
      // DEFENSIVE: Safe navigator access for logging
      if (typeof navigator !== 'undefined') {
        console.warn('🍎 [ErrorBoundary] User Agent:', navigator.userAgent);
      }
      console.warn('🍎 [ErrorBoundary] This is likely a .length or .map() access on undefined');
    }
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
    
    // Log to external service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Add your error logging service here (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    console.log('📊 [ErrorBoundary] Error logged for tracking');
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    window.location.href = '/home';
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 [ErrorBoundary] Retry attempt ${this.retryCount}/${this.maxRetries}`);
      this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
    } else {
      console.warn('⚠️ [ErrorBoundary] Max retries reached');
    }
  };

  private copyErrorDetails = () => {
    const errorDetails = `
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
`.trim();

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Oops! Something went wrong</h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Error Details Collapsible */}
            {this.state.error && (
              <Collapsible
                open={this.state.isDetailsOpen}
                onOpenChange={(open) => this.setState({ isDetailsOpen: open })}
              >
                <div className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      {this.state.isDetailsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {this.state.isDetailsOpen ? 'Hide' : 'Show'} Error Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-muted/50 p-4 rounded-lg text-left space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Stack Trace:</p>
                        <pre className="text-xs font-mono overflow-auto max-h-32 bg-background p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Component Stack:</p>
                          <pre className="text-xs font-mono overflow-auto max-h-32 bg-background p-2 rounded">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={this.copyErrorDetails}
                        className="gap-2 w-full"
                      >
                        {this.state.copied ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Error Details
                          </>
                        )}
                      </Button>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {this.retryCount < this.maxRetries && (
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again ({this.maxRetries - this.retryCount} left)
                </Button>
              )}
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleReset}>
                Go to Home
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
