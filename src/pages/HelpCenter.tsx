import { useState } from "react";
import { ArrowLeft, Phone, Mail, Bug, Ticket, Send, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const HelpCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = async () => {
    if (!user) {
      toast.error("Please log in to submit a ticket");
      navigate("/auth");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        category,
      });

      if (error) throw error;

      setSubmitted(true);
      setSubject("");
      setMessage("");
      setCategory("general");
      toast.success("Ticket submitted successfully!");
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

        <h1 className="text-3xl font-bold text-foreground mb-2">Help Center</h1>
        <p className="text-muted-foreground mb-8">
          Need assistance? Get in touch with our team
        </p>

        <div className="space-y-4">
          {/* Submit a Ticket Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Ticket className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Submit a Ticket</h3>
                    {user && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/my-tickets")}
                      >
                        View My Tickets
                      </Button>
                    )}
                  </div>

                  {submitted ? (
                    <div className="text-center py-6">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h4 className="font-medium mb-2">Ticket Submitted!</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        We'll get back to you within 24 hours
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          onClick={() => setSubmitted(false)}
                        >
                          Submit Another
                        </Button>
                        <Button onClick={() => navigate("/my-tickets")}>
                          View My Tickets
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger id="category" className="mt-1.5">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Query</SelectItem>
                            <SelectItem value="payment">Payment Issue</SelectItem>
                            <SelectItem value="session">Session Problem</SelectItem>
                            <SelectItem value="mentor">Mentor Query</SelectItem>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Brief description of your issue"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Describe your issue in detail..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          rows={4}
                          className="mt-1.5"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitTicket}
                        disabled={submitting || !subject.trim() || !message.trim()}
                        className="w-full"
                      >
                        {submitting ? (
                          "Submitting..."
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-3">Contact Numbers</h3>
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
                  <h3 className="font-semibold text-lg mb-3">Email Support</h3>
                  <p className="text-muted-foreground mb-2">
                    Send us your queries and we'll get back to you within 24 hours
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

          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-muted">
                  <Bug className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Developer Tools</h3>
                  <p className="text-muted-foreground mb-3">
                    Access debug settings and run automated security tests
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/debug-settings')}
                      className="gap-2"
                    >
                      <Bug className="h-4 w-4" />
                      Debug Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/security-tests')}
                      className="gap-2"
                    >
                      <Bug className="h-4 w-4" />
                      Security Tests
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
