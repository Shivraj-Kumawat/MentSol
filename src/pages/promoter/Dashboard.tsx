import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Copy, Share2, MousePointerClick, UserPlus, 
  Video, IndianRupee, Loader2, Check, Wallet, Clock,
  TrendingUp, ExternalLink, Users, Calendar, BookOpen
} from 'lucide-react';
import { generateShortRef, generatePromoCode } from '@/utils/referral';

interface Promoter {
  id: string;
  user_id: string;
  name: string | null;
  code: string;
  short_ref: string;
  upi_id: string | null;
  total_clicks: number;
  total_signups: number;
  total_sessions: number;
  total_earnings: number;
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  tx_id: string | null;
}

interface ReferralWithDetails {
  referral_id: string;
  referred_user_id: string;
  student_name: string | null;
  student_email: string | null;
  student_phone: string | null;
  student_category: string | null;
  sessions_count: number;
  commission_earned: number;
  total_booked_sessions: number;
  total_completed_sessions: number;
  total_session_amount: number;
  referral_date: string;
}

interface ReferralSession {
  referral_id: string;
  student_name: string | null;
  student_id: string;
  session_id: string;
  mentor_name: string | null;
  amount_paid: number;
  status: string;
  scheduled_at: string | null;
  commission_amount: number;
}

interface EarningsSummary {
  total_earnings: number;
  today_earnings: number;
  week_earnings: number;
  month_earnings: number;
  pending_sessions: number;
}

export default function PromoterDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [promoter, setPromoter] = useState<Promoter | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [referrals, setReferrals] = useState<ReferralWithDetails[]>([]);
  const [referralSessions, setReferralSessions] = useState<ReferralSession[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [savingUpi, setSavingUpi] = useState(false);
  const [requestingPayout, setRequestingPayout] = useState(false);

  const referralLink = promoter ? `${window.location.origin}/#/ref/${promoter.short_ref}` : '';

  useEffect(() => {
    if (!user) return;
    loadPromoterData();
  }, [user]);

  const loadPromoterData = async () => {
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
        setUpiId(existing.upi_id || '');
        
        // Load payouts
        const { data: payoutData } = await supabase
          .from('promoter_payouts')
          .select('*')
          .eq('promoter_id', existing.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        setPayouts((payoutData || []) as Payout[]);

        // Load referrals with full details using RPC
        const { data: referralData, error: referralError } = await supabase
          .rpc('get_promoter_referrals', { p_promoter_id: existing.id });

        if (referralError) {
          console.error('Error loading referrals:', referralError);
        } else {
          setReferrals((referralData || []) as ReferralWithDetails[]);
        }

        // Load earnings summary
        const { data: earningsData, error: earningsError } = await supabase
          .rpc('get_promoter_earnings_summary', { p_promoter_id: existing.id });

        if (earningsError) {
          console.error('Error loading earnings:', earningsError);
        } else if (earningsData && earningsData.length > 0) {
          setEarningsSummary(earningsData[0] as EarningsSummary);
        }

        // Load session details for referrals
        const { data: sessionData, error: sessionError } = await supabase
          .rpc('get_promoter_referral_sessions', { p_promoter_id: existing.id });

        if (sessionError) {
          console.error('Error loading referral sessions:', sessionError);
        } else {
          setReferralSessions((sessionData || []) as ReferralSession[]);
        }
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
    } catch (err: any) {
      console.error('Failed to load promoter data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load promoter dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Link Copied!', description: 'Share it with your network' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
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

  const handleSaveUpi = async () => {
    if (!promoter || !upiId.trim()) return;
    
    setSavingUpi(true);
    try {
      const { error } = await supabase
        .from('promoters')
        .update({ upi_id: upiId.trim() })
        .eq('id', promoter.id);

      if (error) throw error;
      
      setPromoter({ ...promoter, upi_id: upiId.trim() });
      toast({ title: 'UPI ID Saved', description: 'Your payout details have been updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save UPI ID', variant: 'destructive' });
    } finally {
      setSavingUpi(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!promoter || promoter.total_earnings < 100) {
      toast({ 
        title: 'Minimum Not Met', 
        description: 'Minimum payout amount is ₹100',
        variant: 'destructive' 
      });
      return;
    }

    if (!promoter.upi_id) {
      toast({ 
        title: 'UPI ID Required', 
        description: 'Please add your UPI ID before requesting payout',
        variant: 'destructive' 
      });
      return;
    }

    setRequestingPayout(true);
    try {
      const { error } = await supabase
        .from('promoter_payouts')
        .insert({
          promoter_id: promoter.id,
          amount: promoter.total_earnings,
          status: 'pending',
        });

      if (error) throw error;
      
      toast({ title: 'Payout Requested!', description: 'We will process your request within 5-7 business days' });
      loadPromoterData(); // Refresh data
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to request payout', variant: 'destructive' });
    } finally {
      setRequestingPayout(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="mb-4">Please login to access the Promoter Dashboard</p>
            <Button onClick={() => navigate('/auth')}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Promoter Dashboard</h1>
              <p className="text-xs text-muted-foreground">Track your referrals & earnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Earnings Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="glass border-green-500/20">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-xl font-bold text-green-500">₹{earningsSummary?.today_earnings?.toFixed(0) || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass border-blue-500/20">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">This Week</p>
              <p className="text-xl font-bold text-blue-500">₹{earningsSummary?.week_earnings?.toFixed(0) || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass border-purple-500/20">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">This Month</p>
              <p className="text-xl font-bold text-purple-500">₹{earningsSummary?.month_earnings?.toFixed(0) || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass border-amber-500/20">
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-xl font-bold text-amber-500">₹{promoter?.total_earnings?.toFixed(0) || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass">
            <CardContent className="pt-4 pb-4 text-center">
              <MousePointerClick className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{promoter?.total_clicks || 0}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 pb-4 text-center">
              <UserPlus className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{promoter?.total_signups || 0}</p>
              <p className="text-xs text-muted-foreground">Signups</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 pb-4 text-center">
              <Video className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{promoter?.total_sessions || 0}</p>
              <p className="text-xs text-muted-foreground">Completed Sessions</p>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-4 pb-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{earningsSummary?.pending_sessions || 0}</p>
              <p className="text-xs text-muted-foreground">Pending Sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link Card */}
        <Card className="glass border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Earn 10% commission on each paid session from your referrals (first 5 sessions per user)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Join MentSol for expert mentorship! ${referralLink}`)}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Code: <span className="font-mono font-bold">{promoter?.code}</span>
            </p>
          </CardContent>
        </Card>

        {/* Referred Users Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Referrals ({referrals.length})
            </CardTitle>
            <CardDescription>
              Users who signed up using your referral link
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No referrals yet</p>
                <p className="text-xs mt-1">Share your link to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div 
                    key={referral.referral_id} 
                    className="p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {referral.student_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {referral.student_email || 'No email'}
                        </p>
                        {referral.student_category && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {referral.student_category}
                          </Badge>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(referral.referral_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        {/* Status Badge */}
                        {referral.sessions_count >= 5 ? (
                          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                            🏆 5/5 Done
                          </Badge>
                        ) : referral.total_completed_sessions > 0 ? (
                          <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                            <Video className="h-3 w-3 mr-1" />
                            {referral.sessions_count}/5 completed
                          </Badge>
                        ) : referral.total_booked_sessions > 0 ? (
                          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                            Booked
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Registered
                          </Badge>
                        )}
                        {referral.total_booked_sessions > 0 && (
                          <div className="text-xs text-orange-500">
                            {referral.total_booked_sessions} booked
                          </div>
                        )}
                        {referral.total_session_amount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            ₹{referral.total_session_amount} spent
                          </div>
                        )}
                        {referral.commission_earned > 0 && (
                          <p className="text-sm font-semibold text-green-600">
                            ₹{referral.commission_earned.toFixed(2)} earned
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Details Section */}
        {referralSessions.length > 0 && (
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Session History ({referralSessions.length})
              </CardTitle>
              <CardDescription>
                Sessions booked by your referred users with commission details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referralSessions.map((session) => (
                  <div 
                    key={session.session_id} 
                    className="p-4 bg-muted/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {session.student_name || 'Unknown User'}
                          </p>
                          <Badge variant={session.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Mentor: {session.mentor_name || 'Unknown'}
                        </p>
                        {session.scheduled_at && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(session.scheduled_at).toLocaleDateString()} at {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-medium">₹{session.amount_paid || 0}</p>
                        {session.commission_amount > 0 ? (
                          <p className="text-sm font-semibold text-green-600">
                            +₹{session.commission_amount.toFixed(2)} earned
                          </p>
                        ) : session.status === 'confirmed' ? (
                          <p className="text-xs text-orange-500">Pending completion</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payout Section */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payouts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>UPI ID for Payouts</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="yourname@upi" 
                  value={upiId} 
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <Button onClick={handleSaveUpi} disabled={savingUpi || !upiId.trim()}>
                  {savingUpi ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Available Balance</p>
                <p className="text-2xl font-bold text-primary">₹{promoter?.total_earnings?.toFixed(2) || 0}</p>
                <p className="text-xs text-muted-foreground">Minimum payout: ₹100</p>
              </div>
              <Button 
                onClick={handleRequestPayout}
                disabled={requestingPayout || (promoter?.total_earnings || 0) < 100 || !promoter?.upi_id}
              >
                {requestingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Request Payout
              </Button>
            </div>

            {payouts.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recent Payouts</p>
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">₹{payout.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        payout.status === 'paid' ? 'default' : 
                        payout.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {payout.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {payout.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Commission Info */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-sm">How Commissions Work</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>• Share your unique referral link with your audience</li>
              <li>• When someone signs up using your link, they become your referral</li>
              <li>• You earn <strong>10% commission</strong> on each paid session they complete</li>
              <li>• Commission applies to the <strong>first 5 sessions</strong> per referred user</li>
              <li>• Request payouts once you reach ₹100 minimum balance</li>
              <li>• Payouts are processed within 5-7 business days via UPI</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
