import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Gift, Calendar, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type NotificationPreference = {
  id: string;
  user_id: string;
  receive_offers: boolean;
  receive_session_reminders: boolean;
  receive_system_updates: boolean;
};

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Try to get existing preferences
      let { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // If no preferences exist, create default ones
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: session.user.id,
            receive_offers: true,
            receive_session_reminders: true,
            receive_system_updates: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newPrefs;
      }

      if (error && error.code !== 'PGRST116') throw error;
      setPreferences(data);
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (field: keyof NotificationPreference, value: boolean) => {
    if (!preferences) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [field]: value })
        .eq('user_id', preferences.user_id);

      if (error) throw error;

      setPreferences({ ...preferences, [field]: value });
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preferences...</p>
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
              <h1 className="text-2xl font-bold">Notification Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Stay Updated</p>
                <p className="text-xs text-muted-foreground">
                  Choose which notifications you want to receive. You can change these settings anytime.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <div className="space-y-4">
          {/* Session Reminders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Session Reminders</CardTitle>
                    <CardDescription className="text-sm">
                      Get notified before your scheduled mentorship sessions
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={preferences?.receive_session_reminders ?? true}
                  onCheckedChange={(checked) => updatePreference('receive_session_reminders', checked)}
                  disabled={saving}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• 1 day before your session</p>
                <p>• 1 hour before your session starts</p>
              </div>
            </CardContent>
          </Card>

          {/* Special Offers */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Special Offers</CardTitle>
                    <CardDescription className="text-sm">
                      Receive exclusive deals and promotional offers
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={preferences?.receive_offers ?? true}
                  onCheckedChange={(checked) => updatePreference('receive_offers', checked)}
                  disabled={saving}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Limited time discounts on sessions</p>
                <p>• Early access to new mentors and features</p>
              </div>
            </CardContent>
          </Card>

          {/* System Updates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center">
                    <Info className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">System Updates</CardTitle>
                    <CardDescription className="text-sm">
                      Important updates about the platform and your account
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={preferences?.receive_system_updates ?? true}
                  onCheckedChange={(checked) => updatePreference('receive_system_updates', checked)}
                  disabled={saving}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Platform maintenance and updates</p>
                <p>• Important account notifications</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Note */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground text-center">
              Note: Critical notifications about your account security and booked sessions will always be sent, regardless of these settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSettings;
