import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, LogOut, Edit, Clock, Activity, FileText, Shield, DollarSign, Trash2, ChevronRight, Gift, Copy, Users, Percent, Check, AlertTriangle, Save, X, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ProfileProgress } from '@/components/ProfileProgress';
import { AchievementBadges } from '@/components/AchievementBadges';
import { ActivityTimeline, createTimelineEvent } from '@/components/ActivityTimeline';
import { Progress } from '@/components/ui/progress';

interface ReferralStats {
  total_referrals: number;
  successful_referrals: number;
  free_sessions_earned: number;
  current_discount_percent: number;
  free_sessions_used: number;
  free_sessions_available: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [sessionStarted, setSessionStarted] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Store session start time (when the access token was issued)
      if (session.user.created_at) {
        setSessionStarted(new Date(session.user.created_at));
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch user role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id);

      const role = roles?.[0]?.role || 'student';
      setUserRole(role);

      // Fetch session stats
      const { data: sessions } = await supabase
        .from('sessions')
        .select('id, status')
        .eq('student_id', session.user.id)
        .eq('status', 'completed');

      setTotalSessions(sessions?.length || 0);

      // Fetch average rating (from reviews given to mentors)
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('student_id', session.user.id);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        setAvgRating(avgRating);
      }

      // Fetch referral stats only for students
      if (role === 'student') {
        const { data: referralData } = await supabase
          .rpc('calculate_referral_discount', { user_id: session.user.id });

        if (referralData && referralData.length > 0) {
          setReferralStats(referralData[0] as ReferralStats);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!profile?.referral_code) return;
    
    const referralLink = `${window.location.origin}?ref=${profile.referral_code}`;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "Share this link with your friends to earn discounts.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out.",
      });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
    } else {
      setEditName(profile?.full_name || '');
      setEditPhone(profile?.phone || '');
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName, phone: editPhone })
        .eq('id', session.user.id);

      if (error) throw error;

      setProfile((prev: any) => ({ ...prev, full_name: editName, phone: editPhone }));
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your information has been saved." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPG, PNG, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB.", variant: "destructive" });
      return;
    }

    try {
      setUploadingAvatar(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${session.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      toast({ title: "Photo updated", description: "Your profile photo has been updated." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home", { replace: true })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground">Manage your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Profile Completion */}
        <ProfileProgress
          sections={[
            { label: "Basic Information", completed: !!(profile?.full_name && profile?.email) },
            { label: "Phone Number", completed: !!profile?.phone },
            { label: "Avatar", completed: !!profile?.avatar_url },
            { label: "First Session", completed: totalSessions > 0 },
          ]}
        />

        {/* Profile Header Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  {profile?.avatar_url && (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name || 'Profile'} 
                      className="w-full h-full object-cover"
                    />
                  )}
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile?.full_name || 'User'}</h2>
                <p className="text-sm text-muted-foreground mt-1">Member since {new Date(profile?.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Section - Students Only */}
        {userRole === 'student' && (
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-amber-500" />
                Refer & Earn Free Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share your referral link with friends. When they book a session, you earn <span className="font-bold text-amber-500">10% off</span> your next session!
              </p>

              {profile?.referral_code && (
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-background/60 border border-amber-500/20 font-mono text-sm truncate">
                    {`${window.location.origin}?ref=${profile.referral_code}`}
                  </div>
                  <Button 
                    onClick={copyReferralLink}
                    variant="outline" 
                    size="icon"
                    className="shrink-0 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background/60 border border-border text-center">
                  <Users className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-xl font-bold">{referralStats?.successful_referrals || 0}</p>
                  <p className="text-xs text-muted-foreground">Friends Joined</p>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border text-center">
                  <Percent className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xl font-bold">{referralStats?.current_discount_percent || 0}%</p>
                  <p className="text-xs text-muted-foreground">Current Discount</p>
                </div>
                <div className="p-3 rounded-xl bg-background/60 border border-border text-center">
                  <Gift className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold">{referralStats?.free_sessions_available || 0}</p>
                  <p className="text-xs text-muted-foreground">Free Sessions</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to next free session</span>
                  <span className="font-medium">{(referralStats?.successful_referrals || 0) % 10}/10 referrals</span>
                </div>
                <Progress 
                  value={((referralStats?.successful_referrals || 0) % 10) * 10} 
                  className="h-2 bg-muted"
                />
                <p className="text-xs text-muted-foreground text-center">
                  {10 - ((referralStats?.successful_referrals || 0) % 10)} more friends needed for a free session!
                </p>
              </div>

              <div className="p-3 rounded-lg bg-background/40 border border-dashed border-amber-500/30">
                <p className="text-xs font-medium mb-2">How it works:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 1 friend books = 10% off your next session</li>
                  <li>• 5 friends = 50% off</li>
                  <li>• 10 friends = 1 FREE session!</li>
                  <li>• Rewards keep stacking with more referrals</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Personal Information</span>
              <Button variant="ghost" size="icon" onClick={handleEditToggle}>
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                {isEditing ? (
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter your name" />
                ) : (
                  <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{profile?.email || 'Not set'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                {isEditing ? (
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Enter your phone" />
                ) : (
                  <p className="font-medium">{profile?.phone || 'Not set'}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleEditToggle} disabled={saving} className="flex-1">
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievement Badges */}
        <AchievementBadges 
          totalSessions={totalSessions}
          rating={avgRating}
        />

        {/* Activity Timeline */}
        <ActivityTimeline
          events={[
            createTimelineEvent(
              "joined",
              "joined",
              "Joined Gurucul",
              "Welcome to the mentorship platform!",
              new Date(profile?.created_at)
            ),
            ...(totalSessions > 0 ? [
              createTimelineEvent(
                "first_session",
                "session",
                "First Session Completed",
                "Completed your first mentorship session",
                new Date()
              )
            ] : [])
          ]}
        />

        {/* Account Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{profile?.login_count || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Logins</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <p className="text-2xl font-bold text-accent">{profile?.status || 'Active'}</p>
                <p className="text-xs text-muted-foreground mt-1">Account Status</p>
              </div>
            </div>

            {/* Session Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Logged in since</p>
                  <p className="font-medium">
                    {profile?.last_login_at 
                      ? formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true })
                      : 'Just now'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Last Activity</p>
                  <p className="font-medium">
                    {profile?.last_login_at 
                      ? new Date(profile.last_login_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })
                      : 'Active now'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
              All your sessions, reviews, messages, and personal information will be erased.
            </p>
            <div className="p-3 rounded-lg bg-background/80 border border-destructive/20">
              <p className="text-xs text-muted-foreground">
                <strong>Warning:</strong> Once deleted, you will lose access to:
              </p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                <li>All your booking history and session records</li>
                <li>Your reviews and ratings</li>
                <li>Chat messages and conversations</li>
                <li>Referral rewards and discounts</li>
              </ul>
            </div>
            <Link to="/data-deletion">
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Account
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Legal Section */}
        <Card>
          <CardHeader>
            <CardTitle>Legal & Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/terms" className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">Terms & Conditions</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link to="/privacy-policy" className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-accent" />
                </div>
                <span className="font-medium">Privacy Policy</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link to="/refund-policy" className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-secondary" />
                </div>
                <span className="font-medium">Refund Policy</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>

            <Link to="/data-deletion" className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 hover:bg-destructive/10 transition-colors border border-destructive/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <span className="font-medium text-destructive">Delete My Data</span>
                  <p className="text-xs text-muted-foreground">Request account deletion</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-destructive" />
            </Link>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 text-destructive hover:bg-destructive/10 border-destructive/20"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
