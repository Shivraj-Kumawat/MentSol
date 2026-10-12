import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteSignupRequest {
  contact: string;
  contactType: 'phone' | 'email';
  firstName: string;
  lastName: string;
  password: string;
  role?: 'student' | 'mentor';
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contact, contactType, firstName, lastName, password, role = 'student' }: CompleteSignupRequest = await req.json();

    console.log('Completing signup for:', contact, 'type:', contactType);

    if (!contact || !contactType || !firstName || !lastName || !password) {
      throw new Error('Contact, contact type, first name, last name, and password are required');
    }

    // Enhanced password validation
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    // Check for complexity requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if OTP was verified for this contact
    const { data: otpRecords, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('contact', contact)
      .eq('type', contactType)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (otpError || !otpRecords || otpRecords.length === 0) {
      throw new Error(`${contactType === 'phone' ? 'Phone number' : 'Email'} not verified. Please verify first.`);
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users.some((u) => 
      contactType === 'phone' ? u.phone === contact : u.email === contact
    );

    if (userExists) {
      throw new Error(`${contactType === 'phone' ? 'Phone number' : 'Email'} already registered. Please use the Login option instead.`);
    }

    // Create the user
    const fullName = `${firstName} ${lastName}`;
    const userPayload: any = {
      password,
      user_metadata: {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        role: role,
      },
    };

    if (contactType === 'phone') {
      userPayload.phone = contact;
      userPayload.phone_confirm = true;
    } else {
      userPayload.email = contact;
      userPayload.email_confirm = true;
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser(userPayload);

    if (authError) {
      console.error('Error creating user:', authError);
      
      // Handle duplicate contact error from Supabase Auth
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('already exists') ||
          authError.message?.includes('duplicate')) {
        throw new Error(`${contactType === 'phone' ? 'Phone number' : 'Email'} already registered. Please use the Login option instead.`);
      }
      
      throw new Error(authError.message || 'Failed to create account');
    }

    console.log('User created successfully:', authData.user?.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully',
        user: {
          id: authData.user?.id,
          ...(contactType === 'phone' ? { phone: authData.user?.phone } : { email: authData.user?.email }),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in complete-signup function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
};

serve(handler);
