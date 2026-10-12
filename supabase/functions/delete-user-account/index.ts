import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the user's JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token. Please sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;
    console.log('Processing account deletion for user:', userId);
    
    // Create admin client for deletion operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Get mentor ID if user is a mentor (for cascading deletes)
    const { data: mentorData } = await supabaseAdmin
      .from('mentors')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    const mentorId = mentorData?.id;
    console.log('Mentor ID (if any):', mentorId);
    
    // Step 1: Delete chat messages where user is sender
    await supabaseAdmin.from('chat_messages').delete().eq('sender_id', userId);
    console.log('Deleted chat_messages');

    // Step 2: Delete conversations where user is student
    await supabaseAdmin.from('conversations').delete().eq('student_id', userId);
    console.log('Deleted conversations as student');

    // Step 3: Delete announcement recipients
    await supabaseAdmin.from('announcement_recipients').delete().eq('user_id', userId);

    // Step 4: Delete notifications & preferences
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    await supabaseAdmin.from('notification_preferences').delete().eq('user_id', userId);

    // Step 5: Delete user referrals
    await supabaseAdmin.from('user_referrals').delete().eq('referrer_id', userId);
    await supabaseAdmin.from('user_referrals').delete().eq('referred_user_id', userId);

    // Step 6: Delete support tickets
    await supabaseAdmin.from('support_tickets').delete().eq('user_id', userId);

    // Step 7: Delete reviews given by user
    await supabaseAdmin.from('reviews').delete().eq('student_id', userId);

    // Step 8: Nullify referrals.last_commission_session_id pointing to user's sessions
    // This prevents FK violation when deleting sessions
    const { data: userSessions } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('student_id', userId);

    if (userSessions && userSessions.length > 0) {
      const sessionIds = userSessions.map(s => s.id);
      // Nullify referral FK references to these sessions
      for (const sid of sessionIds) {
        await supabaseAdmin
          .from('referrals')
          .update({ last_commission_session_id: null })
          .eq('last_commission_session_id', sid);
      }
      // Delete payments for user's sessions
      await supabaseAdmin.from('payments').delete().in('session_id', sessionIds);
      // Delete moderation logs for user's sessions
      await supabaseAdmin.from('moderation_logs').delete().in('session_id', sessionIds);
    }

    // Step 9: Delete sessions where user is student
    await supabaseAdmin.from('sessions').delete().eq('student_id', userId);
    console.log('Deleted sessions as student');

    // If user is a mentor, delete mentor-related data
    if (mentorId) {
      console.log('User is a mentor, deleting mentor data...');

      // Delete reviews received by this mentor
      await supabaseAdmin.from('reviews').delete().eq('mentor_id', mentorId);

      // Delete conversations where user is mentor
      await supabaseAdmin.from('conversations').delete().eq('mentor_id', mentorId);

      // Get mentor's sessions to clean up FKs
      const { data: mentorSessions } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('mentor_id', mentorId);

      if (mentorSessions && mentorSessions.length > 0) {
        const mSessionIds = mentorSessions.map(s => s.id);
        for (const sid of mSessionIds) {
          await supabaseAdmin
            .from('referrals')
            .update({ last_commission_session_id: null })
            .eq('last_commission_session_id', sid);
        }
        await supabaseAdmin.from('payments').delete().in('session_id', mSessionIds);
        await supabaseAdmin.from('moderation_logs').delete().in('session_id', mSessionIds);
      }

      // Delete mentor's sessions
      await supabaseAdmin.from('sessions').delete().eq('mentor_id', mentorId);

      // Delete mentor availability (now safe - no sessions referencing slots)
      await supabaseAdmin.from('mentor_availability').delete().eq('mentor_id', mentorId);

      // Delete mentor category prices
      await supabaseAdmin.from('mentor_category_prices').delete().eq('mentor_id', mentorId);

      // Delete mentor price requests
      await supabaseAdmin.from('mentor_price_requests').delete().eq('mentor_id', mentorId);

      // Delete mentor profile
      const { error: mentorError } = await supabaseAdmin
        .from('mentors')
        .delete()
        .eq('id', mentorId);

      if (mentorError) {
        console.error('Error deleting mentor:', mentorError);
      }
    }
    
    // Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError);
    }
    
    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (profileError) {
      console.error('Error deleting profile:', profileError);
    }
    
    // Delete avatar from storage if exists
    try {
      const { data: files } = await supabaseAdmin
        .storage
        .from('avatars')
        .list(userId);
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`);
        await supabaseAdmin.storage.from('avatars').remove(filePaths);
        console.log('Deleted avatar files:', filePaths);
      }
    } catch (storageError) {
      console.error('Error deleting avatar:', storageError);
    }
    
    // Finally, delete the user from auth.users
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to delete account. Please contact support.',
          details: deleteUserError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Successfully deleted user account:', userId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Your account and all associated data have been permanently deleted.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

