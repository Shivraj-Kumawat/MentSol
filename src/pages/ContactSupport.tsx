import { ArrowLeft, Phone, Mail, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ContactSupport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/home", { replace: true })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Support</h1>
        <p className="text-muted-foreground mb-8">
          We're here to help! Reach out to us through any of the following channels
        </p>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Call Us</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-foreground">Laukik Thakare</p>
                      <a 
                        href="tel:+919699938263" 
                        className="text-primary hover:underline"
                      >
                        +91 9699938263
                      </a>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Shivraj Kumawat</p>
                      <a 
                        href="tel:+918209114342" 
                        className="text-primary hover:underline"
                      >
                        +91 8209114342
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Email Us</h3>
                  <p className="text-muted-foreground mb-2">
                    For detailed queries or feedback
                  </p>
                  <a 
                    href="mailto:mentsol123@gmail.com" 
                    className="text-primary hover:underline font-medium"
                  >
                    mentsol123@gmail.com
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Support Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Sunday: 9:00 AM - 9:00 PM IST
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    We typically respond within 24 hours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
