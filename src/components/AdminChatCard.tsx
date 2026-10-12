import { MessageCircle, Headphones, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDevicePerformance } from "@/hooks/useDevicePerformance";

interface AdminChatCardProps {
  className?: string;
}

export const AdminChatCard = ({ className }: AdminChatCardProps) => {
  const navigate = useNavigate();
  const { prefersReducedMotion } = useDevicePerformance();

  return (
    <Card 
      className={cn(
        "overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5",
        "transition-all duration-200 hover:shadow-premium hover:border-primary/30",
        "ripple-effect cursor-pointer",
        className
      )}
      onClick={() => navigate("/contact")}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          <div 
            className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent",
              "flex items-center justify-center shadow-md flex-shrink-0",
              !prefersReducedMotion && "animate-float-gentle"
            )}
          >
            <Headphones className="w-6 h-6 text-primary-foreground" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              Need Help?
              <MessageCircle className="w-4 h-4 text-primary" />
            </h4>
            <p className="text-sm text-muted-foreground">
              Chat with our support team
            </p>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminChatCard;
