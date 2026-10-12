import { ShieldX, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FloatingOrbs } from "@/components/FloatingOrbs";
import { EntranceAnimation } from "@/components/motion/EntranceAnimation";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Very subtle background orbs */}
      <div className="absolute inset-0 opacity-30">
        <FloatingOrbs variant="minimal" />
      </div>
      
      <EntranceAnimation direction="scale" className="relative z-10">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10 calm-entrance">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Unauthorized Access
          </h1>
          
          <p className="text-muted-foreground mb-8">
            You do not have permission to access this page.
          </p>
          
          <Button
            onClick={() => navigate("/home", { replace: true })}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        </div>
      </EntranceAnimation>
    </div>
  );
};

export default Unauthorized;
