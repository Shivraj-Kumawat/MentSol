import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Settings as SettingsIcon, DollarSign, Shield, Zap, Mail, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description: string;
  updated_at: string;
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>({});

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;

      setSettings(data || []);

      // Create a map for easy access
      const map: Record<string, any> = {};
      data?.forEach(setting => {
        const value = setting.setting_value as any;
        map[setting.setting_key] = value?.value !== undefined ? value.value : value;
      });
      setSettingsMap(map);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load platform settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettingsMap({ ...settingsMap, [key]: value });
  };

  const saveSetting = async (key: string) => {
    try {
      setSaving(true);
      const value = settingsMap[key];

      // Log to history
      const setting = settings.find(s => s.setting_key === key);
      const { data: { user } } = await supabase.auth.getUser();

      if (setting && user) {
        const oldValue = setting.setting_value as any;
        await supabase.from('settings_history').insert({
          setting_key: key,
          old_value: oldValue,
          new_value: { value },
          changed_by: user.id,
        });
      }

      // Update setting
      const { error } = await supabase
        .from('platform_settings')
        .update({
          setting_value: { value },
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('setting_key', key);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Setting updated successfully',
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: 'Error',
        description: 'Failed to save setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update all settings
      for (const key in settingsMap) {
        const setting = settings.find(s => s.setting_key === key);
        const oldValue = setting?.setting_value as any;
        const oldValueExtracted = oldValue?.value !== undefined ? oldValue.value : oldValue;
        
        if (setting && oldValueExtracted !== settingsMap[key]) {
          // Log to history
          await supabase.from('settings_history').insert({
            setting_key: key,
            old_value: oldValue,
            new_value: { value: settingsMap[key] },
            changed_by: user.id,
          });

          // Update setting
          await supabase
            .from('platform_settings')
            .update({
              setting_value: { value: settingsMap[key] },
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            })
            .eq('setting_key', key);
        }
      }

      toast({
        title: 'Success',
        description: 'All settings saved successfully',
      });

      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({ 
    label, 
    settingKey, 
    type = 'number',
    suffix = '',
    min = 0 
  }: { 
    label: string; 
    settingKey: string; 
    type?: 'number' | 'text'; 
    suffix?: string;
    min?: number;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">
          {settings.find(s => s.setting_key === settingKey)?.description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          min={min}
          value={settingsMap[settingKey] || ''}
          onChange={(e) => updateSetting(settingKey, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-32"
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        <Button size="sm" onClick={() => saveSetting(settingKey)} disabled={saving}>
          <Save className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const ToggleRow = ({ label, settingKey }: { label: string; settingKey: string }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground mt-1">
          {settings.find(s => s.setting_key === settingKey)?.description}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={settingsMap[settingKey] || false}
          onCheckedChange={(checked) => {
            updateSetting(settingKey, checked);
            saveSetting(settingKey);
          }}
          disabled={saving}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-teal-glow/5 to-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Platform Settings</h1>
            <p className="text-muted-foreground">Configure system-wide settings and policies</p>
          </div>
          <Button onClick={saveAllSettings} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save All Changes
          </Button>
        </div>

        <Tabs defaultValue="commission" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="commission">
              <DollarSign className="mr-2 h-4 w-4" />
              Commission
            </TabsTrigger>
            <TabsTrigger value="policies">
              <Shield className="mr-2 h-4 w-4" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="features">
              <Zap className="mr-2 h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="general">
              <Info className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commission">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Commission & Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingRow
                  label="Platform Commission"
                  settingKey="platform_commission_percentage"
                  suffix="%"
                />
                <Separator />
                <SettingRow
                  label="Minimum Session Rate"
                  settingKey="minimum_session_rate"
                  suffix="₹ / 15min"
                />
                <Separator />
                <SettingRow
                  label="30 Minute Session Price"
                  settingKey="session_price_30m"
                  suffix="₹"
                />
                <Separator />
                <SettingRow
                  label="1 Hour Session Price"
                  settingKey="session_price_60m"
                  suffix="₹"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Session Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingRow
                  label="Maximum Reschedules"
                  settingKey="maximum_reschedules_allowed"
                  suffix="times"
                />
                <Separator />
                <SettingRow
                  label="Cancellation Window"
                  settingKey="cancellation_window_hours"
                  suffix="hours"
                />
                <Separator />
                <SettingRow
                  label="Late Cancellation Penalty"
                  settingKey="late_cancellation_penalty_percentage"
                  suffix="%"
                />
                <Separator />
                <SettingRow
                  label="Max Session Duration"
                  settingKey="max_session_duration_minutes"
                  suffix="minutes"
                />
                <Separator />
                <ToggleRow
                  label="Auto Refund Enabled"
                  settingKey="auto_refund_enabled"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Feature Toggles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <ToggleRow
                  label="Maintenance Mode"
                  settingKey="maintenance_mode"
                />
                <Separator />
                <ToggleRow
                  label="Instant Mentor Feature"
                  settingKey="instant_mentor_enabled"
                />
                <Separator />
                <ToggleRow
                  label="Require Mentor Approval"
                  settingKey="new_mentor_approval_required"
                />
                <Separator />
                <ToggleRow
                  label="1-Day Session Reminder"
                  settingKey="session_reminder_1day"
                />
                <Separator />
                <ToggleRow
                  label="1-Hour Session Reminder"
                  settingKey="session_reminder_1hour"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <ToggleRow
                  label="Welcome Email"
                  settingKey="welcome_email_enabled"
                />
                <Separator />
                <ToggleRow
                  label="Booking Confirmation Email"
                  settingKey="booking_confirmation_email"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingRow
                  label="Platform Name"
                  settingKey="platform_name"
                  type="text"
                />
                <Separator />
                <SettingRow
                  label="Support Email"
                  settingKey="support_email"
                  type="text"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}