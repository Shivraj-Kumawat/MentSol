import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminRouteProps {
  children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  // ALL HOOKS FIRST - consistent order
  const { session, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const checkAdminRole = async () => {
      // Wait for auth loading to complete
      if (loading) return;

      if (!session?.user?.id) {
        if (isMountedRef.current) {
          setReady(true);
        }
        return;
      }

      const { data } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });

      if (isMountedRef.current) {
        setIsAdmin(data === true);
        setReady(true);
      }
    };

    checkAdminRole();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [session?.user?.id, loading]);

  // NEVER redirect during loading or before ready
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Verifying access...</div>
      </div>
    );
  }

  // Only redirect after fully ready
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
