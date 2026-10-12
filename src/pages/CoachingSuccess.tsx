import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home } from "lucide-react";
import { motion } from "framer-motion";

const CoachingSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="max-w-md w-full text-center space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex"
        >
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Application Submitted Successfully ✅
          </h1>
          <p className="text-muted-foreground text-base">
            We've received your request.
          </p>
        </div>

        <div className="bg-muted/50 rounded-xl p-5 space-y-2">
          <p className="text-sm text-foreground leading-relaxed">
            Our team is reviewing your details. We'll notify you soon once everything is ready.
          </p>
          <p className="text-xs text-muted-foreground">
            You will receive an update via email.
          </p>
        </div>

        <Button variant="outline" className="gap-2" onClick={() => navigate("/", { replace: true })}>
          <Home className="w-4 h-4" />
          Back to Home
        </Button>
      </motion.div>
    </div>
  );
};

export default CoachingSuccess;
