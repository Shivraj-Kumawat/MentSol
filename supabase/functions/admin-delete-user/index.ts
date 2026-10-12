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
     const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
     
     // Get the caller's JWT token
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       return new Response(
         JSON.stringify({ error: 'Authorization header required' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Verify the caller's token
     const token = authHeader.replace('Bearer ', '');
     const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
     const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser(token);
     
     if (authError || !caller) {
       console.error('Auth error:', authError);
       return new Response(
         JSON.stringify({ error: 'Invalid or expired token' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Create admin client for operations
     const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
       auth: {
         autoRefreshToken: false,
         persistSession: false
       }
     });
     
     // Verify caller is admin using has_role function
     const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
       _user_id: caller.id,
       _role: 'admin'
     });
     
     if (roleError || !isAdmin) {
       console.error('Role check failed:', roleError, 'isAdmin:', isAdmin);
       return new Response(
         JSON.stringify({ error: 'Admin access required' }),
         { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Get the user ID to delete from request body
     const { userId } = await req.json();
     
     if (!userId) {
       return new Response(
         JSON.stringify({ error: 'userId is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     console.log('Admin', caller.id, 'deleting user:', userId);
     
     // Get mentor ID if user is a mentor
     const { data: mentorData } = await supabaseAdmin
       .from('mentors')
       .select('id')
       .eq('user_id', userId)
       .single();
     
     const mentorId = mentorData?.id;
     console.log('Mentor ID (if any):', mentorId);
     
     // Get promoter ID if user is a promoter
     const { data: promoterData } = await supabaseAdmin
       .from('promoters')
       .select('id')
       .eq('user_id', userId)
       .single();
     
     const promoterId = promoterData?.id;
     console.log('Promoter ID (if any):', promoterId);
     
     // Delete in correct order to respect foreign key constraints
     const deletionLog: string[] = [];
     
     // 1. Delete chat messages where user is sender
     const { error: chatErr } = await supabaseAdmin
       .from('chat_messages')
       .delete()
       .eq('sender_id', userId);
     if (!chatErr) deletionLog.push('chat_messages');
     
     // 2. Delete announcement recipients
     const { error: annRecErr } = await supabaseAdmin
       .from('announcement_recipients')
       .delete()
       .eq('user_id', userId);
     if (!annRecErr) deletionLog.push('announcement_recipients');
     
     // 3. Delete notifications
     const { error: notifErr } = await supabaseAdmin
       .from('notifications')
       .delete()
       .eq('user_id', userId);
     if (!notifErr) deletionLog.push('notifications');
     
     // 4. Delete notification preferences
     const { error: notifPrefErr } = await supabaseAdmin
       .from('notification_preferences')
       .delete()
       .eq('user_id', userId);
     if (!notifPrefErr) deletionLog.push('notification_preferences');
     
     // 5. Delete support tickets
     const { error: ticketErr } = await supabaseAdmin
       .from('support_tickets')
       .delete()
       .eq('user_id', userId);
     if (!ticketErr) deletionLog.push('support_tickets');
     
     // 6. Delete user referrals (as referrer and as referred)
     await supabaseAdmin.from('user_referrals').delete().eq('referrer_id', userId);
     await supabaseAdmin.from('user_referrals').delete().eq('referred_user_id', userId);
     deletionLog.push('user_referrals');
     
     // 7. Delete reviews given by this user (as student)
     await supabaseAdmin.from('reviews').delete().eq('student_id', userId);
     deletionLog.push('reviews (as student)');
     
     // 8. Handle conversations - delete where user is student
     await supabaseAdmin.from('conversations').delete().eq('student_id', userId);
     deletionLog.push('conversations (as student)');
     
     // If user is a mentor, delete mentor-related data
     if (mentorId) {
       console.log('Deleting mentor data for mentor_id:', mentorId);
       
       // Delete reviews received by this mentor
       await supabaseAdmin.from('reviews').delete().eq('mentor_id', mentorId);
       deletionLog.push('reviews (as mentor)');
       
       // Delete conversations where user is mentor
       await supabaseAdmin.from('conversations').delete().eq('mentor_id', mentorId);
       deletionLog.push('conversations (as mentor)');
       
       // Delete mentor availability
       await supabaseAdmin.from('mentor_availability').delete().eq('mentor_id', mentorId);
       deletionLog.push('mentor_availability');
       
       // Delete mentor category prices
       await supabaseAdmin.from('mentor_category_prices').delete().eq('mentor_id', mentorId);
       deletionLog.push('mentor_category_prices');
       
       // Delete mentor price requests
       await supabaseAdmin.from('mentor_price_requests').delete().eq('mentor_id', mentorId);
       deletionLog.push('mentor_price_requests');
       
       // Get sessions for this mentor to delete related records
       const { data: mentorSessions } = await supabaseAdmin
         .from('sessions')
         .select('id')
         .eq('mentor_id', mentorId);
       
       if (mentorSessions && mentorSessions.length > 0) {
         const sessionIds = mentorSessions.map(s => s.id);
         
         // Delete payments for these sessions
         await supabaseAdmin
           .from('payments')
           .delete()
           .in('session_id', sessionIds);
         deletionLog.push('payments (mentor sessions)');
         
         // Delete moderation logs for these sessions
         await supabaseAdmin
           .from('moderation_logs')
           .delete()
           .in('session_id', sessionIds);
         deletionLog.push('moderation_logs');
       }
       
       // Delete sessions where user is mentor
       await supabaseAdmin.from('sessions').delete().eq('mentor_id', mentorId);
       deletionLog.push('sessions (as mentor)');
       
       // Delete mentor profile
       await supabaseAdmin.from('mentors').delete().eq('id', mentorId);
       deletionLog.push('mentors');
     }
     
     // Handle student sessions
     const { data: studentSessions } = await supabaseAdmin
       .from('sessions')
       .select('id')
       .eq('student_id', userId);
     
     if (studentSessions && studentSessions.length > 0) {
       const sessionIds = studentSessions.map(s => s.id);
       
       // Delete payments for student sessions
       await supabaseAdmin.from('payments').delete().in('session_id', sessionIds);
       deletionLog.push('payments (student sessions)');
       
       // Delete reviews for student sessions
       await supabaseAdmin.from('reviews').delete().in('session_id', sessionIds);
       deletionLog.push('reviews (student sessions)');
     }
     
     // Delete sessions where user is student
     await supabaseAdmin.from('sessions').delete().eq('student_id', userId);
     deletionLog.push('sessions (as student)');
     
     // If user is a promoter, delete promoter-related data
     if (promoterId) {
       console.log('Deleting promoter data for promoter_id:', promoterId);
       
       // Delete referral clicks
       await supabaseAdmin.from('referral_clicks').delete().eq('promoter_id', promoterId);
       deletionLog.push('referral_clicks');
       
       // Delete referrals
       await supabaseAdmin.from('referrals').delete().eq('promoter_id', promoterId);
       deletionLog.push('referrals');
       
       // Delete promoter payouts
       await supabaseAdmin.from('promoter_payouts').delete().eq('promoter_id', promoterId);
       deletionLog.push('promoter_payouts');
       
       // Delete promoter
       await supabaseAdmin.from('promoters').delete().eq('id', promoterId);
       deletionLog.push('promoters');
     }
     
     // Delete user roles
     await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
     deletionLog.push('user_roles');
     
     // Delete profile
     await supabaseAdmin.from('profiles').delete().eq('id', userId);
     deletionLog.push('profiles');
     
     // Delete avatar from storage if exists
     try {
       const { data: files } = await supabaseAdmin
         .storage
         .from('avatars')
         .list(userId);
       
       if (files && files.length > 0) {
         const filePaths = files.map(file => `${userId}/${file.name}`);
         await supabaseAdmin.storage.from('avatars').remove(filePaths);
         deletionLog.push('avatar files');
       }
     } catch (storageError) {
       console.error('Error deleting avatar:', storageError);
     }
     
     // Delete mentor documents from storage if exists
     try {
       const { data: docs } = await supabaseAdmin
         .storage
         .from('mentor-documents')
         .list(userId);
       
       if (docs && docs.length > 0) {
         const docPaths = docs.map(doc => `${userId}/${doc.name}`);
         await supabaseAdmin.storage.from('mentor-documents').remove(docPaths);
         deletionLog.push('mentor document files');
       }
     } catch (storageError) {
       console.error('Error deleting mentor documents:', storageError);
     }
     
     // Finally, delete the user from auth.users
     const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
     
     if (deleteUserError) {
       console.error('Error deleting auth user:', deleteUserError);
       return new Response(
         JSON.stringify({ 
           error: 'Failed to delete auth user',
           details: deleteUserError.message,
           deletedRecords: deletionLog
         }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     deletionLog.push('auth.users');
     console.log('Successfully deleted user:', userId, 'Deleted records:', deletionLog);
     
     return new Response(
       JSON.stringify({ 
         success: true, 
         message: 'User and all associated data deleted successfully',
         deletedRecords: deletionLog
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
     
   } catch (error) {
     console.error('Unexpected error:', error);
     return new Response(
       JSON.stringify({ error: 'An unexpected error occurred' }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });