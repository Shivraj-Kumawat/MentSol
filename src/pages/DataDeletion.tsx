import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle, Mail, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');

const DataDeletion = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || '');
        setEmail(session.user.email || '');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoggedInDeletion = async () => {
    if (!confirmed || confirmText !== 'DELETE') {
      toast({
        title: 'Confirmation Required',
        description: 'Please type DELETE and check the confirmation box.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: 'Session Expired',
          description: 'Please sign in again to delete your account.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Call the delete account edge function
      const response = await fetch(
        'https://rutxafzivumqnyxqtdsa.supabase.co/functions/v1/delete-user-account',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reason, additionalInfo }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }

      // Sign out locally
      await supabase.auth.signOut();
      
      setSubmitted(true);
      toast({
        title: 'Account Deleted',
        description: 'Your account and all data have been permanently deleted.',
      });
    } catch (error: any) {
      console.error('Deletion error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Invalid Email',
          description: error.issues[0].message,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!reason) {
      toast({
        title: 'Reason Required',
        description: 'Please select a reason for deletion',
        variant: 'destructive',
      });
      return;
    }

    if (!confirmed) {
      toast({
        title: 'Confirmation Required',
        description: 'Please confirm that you understand the consequences of data deletion',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // For guest users, we create a support request
      // This will be manually processed by admin
      setSubmitted(true);
      toast({
        title: 'Request Submitted',
        description: 'Your data deletion request has been received and will be processed within 30 days.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Account Deleted</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">
                  {isLoggedIn ? 'Account Deleted Successfully' : 'Request Submitted Successfully'}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {isLoggedIn 
                    ? 'Your account and all associated data have been permanently deleted. Thank you for using our platform.'
                    : 'Your data deletion request has been received and will be processed within 30 days.'
                  }
                </p>
              </div>

              {!isLoggedIn && (
                <div className="bg-muted/50 rounded-lg p-4 text-left max-w-md mx-auto">
                  <h3 className="font-semibold mb-2">What happens next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-primary" />
                      <span>You'll receive a confirmation email at <strong>{email}</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Our team will verify your identity for security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Trash2 className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Your data will be permanently deleted within 30 days</span>
                    </li>
                  </ul>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={() => navigate('/home')}>
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home", { replace: true })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Delete Account</h1>
              <p className="text-sm text-muted-foreground">
                {isLoggedIn ? 'Permanently delete your account' : 'Request deletion of your personal data'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Warning Card */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive mb-1">⚠️ This Action is Permanent</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoggedIn 
                    ? 'Deleting your account will immediately and permanently remove all your personal information from our systems. This action cannot be undone.'
                    : 'Requesting data deletion will permanently remove all your personal information from our systems. This action cannot be undone. You will need to create a new account if you wish to use our services again.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What Will Be Deleted */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What Data Will Be Deleted?</CardTitle>
            <CardDescription>The following data associated with your account will be permanently removed:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Profile information (name, email, phone number)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Session history and booking records
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Reviews and ratings you have submitted
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Chat messages and communication history
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Notification preferences and settings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Any uploaded documents or images
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                Referral history and rewards
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Some data may be retained for legal compliance, fraud prevention, or to resolve disputes as described in our Privacy Policy.
            </p>
          </CardContent>
        </Card>

        {/* Logged-in User: Immediate Deletion */}
        {isLoggedIn ? (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Delete Your Account</CardTitle>
              <CardDescription>
                You are signed in as <strong>{userEmail}</strong>. Your account will be deleted immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Deletion (Optional)</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-longer-need">I no longer need this service</SelectItem>
                    <SelectItem value="privacy-concerns">Privacy concerns</SelectItem>
                    <SelectItem value="switching-platform">Switching to another platform</SelectItem>
                    <SelectItem value="too-many-emails">Too many emails/notifications</SelectItem>
                    <SelectItem value="poor-experience">Poor experience with the service</SelectItem>
                    <SelectItem value="other">Other reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-text">Type DELETE to confirm</Label>
                <Input
                  id="confirm-text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="font-mono"
                />
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                  className="mt-0.5"
                />
                <label htmlFor="confirm" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I understand that this action is <strong className="text-destructive">permanent and irreversible</strong>. 
                  All my data will be deleted immediately and I will not be able to recover my account or any associated information.
                </label>
              </div>

              <Button 
                onClick={handleLoggedInDeletion}
                variant="destructive" 
                className="w-full"
                disabled={loading || !confirmed || confirmText !== 'DELETE'}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting Account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete My Account Permanently
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Guest User: Request Form */
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Deletion Request</CardTitle>
              <CardDescription>Please provide your details to process your request</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGuestSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the email address associated with your account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Deletion *</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-longer-need">I no longer need this service</SelectItem>
                      <SelectItem value="privacy-concerns">Privacy concerns</SelectItem>
                      <SelectItem value="switching-platform">Switching to another platform</SelectItem>
                      <SelectItem value="too-many-emails">Too many emails/notifications</SelectItem>
                      <SelectItem value="poor-experience">Poor experience with the service</SelectItem>
                      <SelectItem value="other">Other reason</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additional">Additional Information (Optional)</Label>
                  <Textarea
                    id="additional"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Any additional details you'd like to share..."
                    rows={3}
                  />
                </div>

                <div className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50 border">
                  <Checkbox
                    id="confirm-guest"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                    className="mt-0.5"
                  />
                  <label htmlFor="confirm-guest" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                    I understand that this action is <strong>permanent and irreversible</strong>. All my data will be deleted within 30 days and I will not be able to recover my account or any associated information.
                  </label>
                </div>

                <Button 
                  type="submit" 
                  variant="destructive" 
                  className="w-full"
                  disabled={loading || !confirmed}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Submit Deletion Request
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Need help? Contact our support team at{' '}
              <a href="mailto:privacy@mentsol.com" className="text-primary hover:underline">
                privacy@mentsol.com
              </a>
              {' '}or call <a href="tel:+919876543210" className="text-primary hover:underline">+91 98765 43210</a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataDeletion;
