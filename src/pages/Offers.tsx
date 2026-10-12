import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Share2, Copy, Check, MousePointerClick, UserPlus, Video, IndianRupee, Loader2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateShortRef, generatePromoCode } from '@/utils/referral';

interface Promoter {
  id: string;
  user_id: string;
  name: string | null;
  code: string;
  short_ref: string;
  total_clicks: number;
  total_signups: number;
  total_sessions: number;
  total_earnings: number;
}

export default function Offers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [promoter, setPromoter] = useState<Promoter | null>(null);

  const referralLink = promoter 
    ? `https://mentsol1.lovable.app/#/ref/${promoter.short_ref}` 
    : '';

  useEffect(() => {
    if (user) {
      loadOrCreatePromoter();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrCreatePromoter = async () => {
    if (!user) return;
    
    try {
      // Try to get existing promoter
      const { data: existing, error } = await supabase
        .from('promoters')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (existing) {
        setPromoter(existing as Promoter);
      } else {
        // Create new promoter profile
        const short_ref = generateShortRef();
        const code = generatePromoCode(user.email || 'USER');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const { data: newPromoter, error: insertError } = await supabase
          .from('promoters')
          .insert({
            user_id: user.id,
            name: profile?.full_name || user.email,
            code,
            short_ref,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPromoter(newPromoter as Promoter);
      }
    } catch (err) {
      console.error('Failed to load promoter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Share it with your network to earn commissions",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (!referralLink) return;
    if (navigator.share) {
      navigator.share({
        title: 'Join MentSol - Expert Mentorship Platform',
        text: 'Get expert guidance from verified mentors. Sign up using my referral link!',
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-glow">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Offers & Rewards</h1>
                <p className="text-xs text-muted-foreground">Earn by referring mentors & students</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Login Prompt for Guests */}
        {!user && (
          <Card className="glass border-2 border-primary/20">
            <CardContent className="py-8 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Become a Marketing Partner</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Login to get your unique referral link and start earning 10% commission on every paid session!
              </p>
              <Button onClick={() => navigate('/auth')}>Login to Get Started</Button>
            </CardContent>
          </Card>
        )}

        {/* Promoter Stats & Link (for logged in users) */}
        {user && (
          <>
            {loading ? (
              <Card className="glass">
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading your promoter profile...</p>
                </CardContent>
              </Card>
            ) : promoter ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="glass">
                    <CardContent className="pt-3 pb-3 text-center">
                      <MousePointerClick className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-xl font-bold">{promoter.total_clicks}</p>
                      <p className="text-xs text-muted-foreground">Clicks</p>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="pt-3 pb-3 text-center">
                      <UserPlus className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <p className="text-xl font-bold">{promoter.total_signups}</p>
                      <p className="text-xs text-muted-foreground">Signups</p>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="pt-3 pb-3 text-center">
                      <Video className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                      <p className="text-xl font-bold">{promoter.total_sessions}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </CardContent>
                  </Card>
                  <Card className="glass">
                    <CardContent className="pt-3 pb-3 text-center">
                      <IndianRupee className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-xl font-bold">₹{promoter.total_earnings.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Earned</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Referral Link Card */}
                <Card className="glass border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-1 flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Your Referral Link
                        </CardTitle>
                        <CardDescription>
                          Earn 10% on every paid session (first 5 per user)
                        </CardDescription>
                      </div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0">
                        10% Commission
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold mb-2">Your Unique Link</p>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-sm overflow-hidden text-ellipsis">
                          {referralLink}
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={handleCopyLink}
                          className="h-auto rounded-lg shrink-0"
                        >
                          {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Code: <span className="font-mono font-bold">{promoter.code}</span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        onClick={handleShareLink}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Link
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/promoter/dashboard')}
                      >
                        Full Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="glass">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Failed to load promoter profile. Please try again.</p>
                  <Button onClick={loadOrCreatePromoter} className="mt-4">Retry</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Available Offers Section */}
        <div>
          <h2 className="text-lg font-bold mb-3 px-1">Available Offers</h2>
          
          {/* Empty State */}
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Gift className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Active Offers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check back later for exciting deals and discounts!
              </p>
              <Button variant="outline" onClick={() => navigate('/home')}>
                Explore Mentors
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Terms & Conditions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm">Commission Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>• Share your unique referral link to earn commissions</li>
              <li>• You earn <strong>10% commission</strong> on each paid session from your referrals</li>
              <li>• Commission applies to the <strong>first 5 sessions</strong> per referred user</li>
              <li>• Commissions are credited after successful payment verification</li>
              <li>• Request payouts once you reach ₹100 minimum balance</li>
              <li>• Management reserves the right to modify commission structure</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
