import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MentorRouteProps {
  children: ReactNode;
}

export const MentorRoute = ({ children }: MentorRouteProps) => {
  // ALL HOOKS FIRST - consistent order
  const { session, loading, ensureValidSession } = useAuth();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const checkMentorAccess = async () => {
      // Wait for auth loading to complete
      if (loading) return;

      if (!session?.user?.id) {
        if (isMountedRef.current) {
          setReady(true);
        }
        return;
      }

      await ensureValidSession();

      const { data: hasRole } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "mentor",
      });

      if (!hasRole) {
        if (isMountedRef.current) {
          setReady(true);
        }
        return;
      }

      const { data: mentor } = await supabase
        .from("mentors")
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (isMountedRef.current) {
        if (mentor?.status === "approved" || mentor?.status === "pending_request") {
          setAllowed(true);
        }
        setReady(true);
      }
    };

    checkMentorAccess();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [session?.user?.id, loading, ensureValidSession]);

  // NEVER redirect during loading or before ready
  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking mentor access...</div>
      </div>
    );
  }

  // Only redirect after fully ready
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
