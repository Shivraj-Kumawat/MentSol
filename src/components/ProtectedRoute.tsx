import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect, useState, useRef } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // ALL HOOKS FIRST - consistent order
  const { session, loading, ensureValidSession } = useAuth();
  const [ready, setReady] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const validateSession = async () => {
      // Wait for auth loading to complete
      if (loading) return;
      
      if (session) {
        await ensureValidSession();
      }
      
      if (isMountedRef.current) {
        setReady(true);
      }
    };
    
    validateSession();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [session, loading, ensureValidSession]);

  // NEVER redirect during loading or before ready
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Only redirect after fully ready
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
