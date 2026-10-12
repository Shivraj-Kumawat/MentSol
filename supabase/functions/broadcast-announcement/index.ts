import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { announcementId } = await req.json();

    if (!announcementId) {
      return new Response(
        JSON.stringify({ error: 'announcementId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Broadcasting announcement:', announcementId);

    // Get the announcement details
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (announcementError || !announcement) {
      console.error('Error fetching announcement:', announcementError);
      return new Response(
        JSON.stringify({ error: 'Announcement not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get target users based on audience
    let targetUsers: { id: string }[] = [];

    if (announcement.target_audience === 'all') {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id');
      targetUsers = allUsers || [];
    } else if (announcement.target_audience === 'students') {
      const { data: students } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');
      targetUsers = (students || []).map(s => ({ id: s.user_id }));
    } else if (announcement.target_audience === 'mentors') {
      const { data: mentors } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'mentor');
      targetUsers = (mentors || []).map(m => ({ id: m.user_id }));
    } else if (announcement.target_audience === 'admins') {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      targetUsers = (admins || []).map(a => ({ id: a.user_id }));
    }

    console.log(`Broadcasting to ${targetUsers.length} users`);

    // Create notifications if enabled
    if (announcement.send_as_notification && targetUsers.length > 0) {
      const notifications = targetUsers.map(user => ({
        user_id: user.id,
        type: 'announcement',
        title: announcement.title,
        message: announcement.message,
        metadata: {
          announcement_id: announcementId,
          announcement_type: announcement.announcement_type,
        },
      }));

      // Batch insert notifications (in chunks of 100)
      const chunkSize = 100;
      for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error: notifError } = await supabase
          .from('notifications')
          .insert(chunk);

        if (notifError) {
          console.error('Error inserting notifications chunk:', notifError);
        }
      }
    }

    // Create recipient records for tracking
    const recipients = targetUsers.map(user => ({
      announcement_id: announcementId,
      user_id: user.id,
      delivered_at: new Date().toISOString(),
    }));

    // Batch insert recipients (in chunks of 100)
    const chunkSize = 100;
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize);
      const { error: recipientError } = await supabase
        .from('announcement_recipients')
        .insert(chunk);

      if (recipientError) {
        console.error('Error inserting recipients chunk:', recipientError);
      }
    }

    // Update announcement status
    const { error: updateError } = await supabase
      .from('announcements')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', announcementId);

    if (updateError) {
      console.error('Error updating announcement status:', updateError);
    }

    console.log('Announcement broadcast completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        recipientCount: targetUsers.length,
        message: `Announcement sent to ${targetUsers.length} users`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in broadcast-announcement function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});