import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.83.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive mapping from old flat format to new hierarchical format
const categoryMapping: Record<string, string> = {
  // Exam Preparation - JEE
  'JEE - IITian': 'Exam Preparation > JEE > IITian',
  'JEE - NITian': 'Exam Preparation > JEE > NITian',
  'JEE - Expert': 'Exam Preparation > JEE > Expert (99+ Percentile)',
  'JEE Expert': 'Exam Preparation > JEE > Expert (99+ Percentile)',
  'JEE Coach': 'Exam Preparation > JEE > JEE Coach',
  'JEE': 'Exam Preparation > JEE > Expert (99+ Percentile)',
  
  // Exam Preparation - NEET
  'NEET - AIIMS': 'Exam Preparation > NEET > AIIMS Graduate',
  'NEET - GMC': 'Exam Preparation > NEET > Government Medical College',
  'NEET - Expert': 'Exam Preparation > NEET > Expert (650+ Score)',
  'NEET Expert': 'Exam Preparation > NEET > Expert (650+ Score)',
  'NEET Coach': 'Exam Preparation > NEET > NEET Coach',
  'NEET': 'Exam Preparation > NEET > Expert (650+ Score)',
  
  // Exam Preparation - Other Exams
  'MHT-CET': 'Exam Preparation > MHT-CET > Top Percentile Scorer',
  '10th Board': 'Exam Preparation > 10th Board > 95%+ Scorer',
  '12th Board': 'Exam Preparation > 12th Board > 90%+ Scorer',
  'SSC/CGL': 'Exam Preparation > JEE > Expert (99+ Percentile)', // Default mapping
  'JAM': 'Exam Preparation > JEE Advanced > IIT Graduate',
  'CA': 'Exam Preparation > 12th Board > Commerce Stream Expert',
  'CAT': 'Exam Preparation > 12th Board > Commerce Stream Expert',
  'UPSC/State PCS': 'Exam Preparation > 12th Board > 90%+ Scorer',
  'GATE': 'Exam Preparation > JEE Advanced > IIT Graduate',
  
  // College Counselling
  'Engineering College Counselling': 'College Counselling > Engineering > Private Engineering Counsellor',
  'Medical College Counselling': 'College Counselling > Medical > MBBS Counsellor',
  'MBA College Counselling': 'College Counselling > MBA > MBA Expert',
  'General College Guidance': 'College Counselling > Engineering > Branch Selection Expert',
  'IIT/NIT/IIIT Counselling': 'College Counselling > Engineering > IIT Counsellor',
  'Engineering Counselling': 'College Counselling > Engineering > Private Engineering Counsellor',
  'AIIMS/Top GMC Counselling': 'College Counselling > Medical > AIIMS Counsellor',
  'GMC Counselling': 'College Counselling > Medical > MBBS Counsellor',
  'Private Medical Counselling': 'College Counselling > Medical > MBBS Counsellor',
  'Foreign MBBS Counselling': 'College Counselling > Medical > MBBS Counsellor',
  
  // Addiction Counselling -> Mental Health > Addiction Recovery
  'Smoking Cessation': 'Mental Health > Addiction Recovery > Addiction Counselor',
  'Alcohol Addiction': 'Mental Health > Addiction Recovery > Addiction Counselor',
  'Drug Addiction': 'Mental Health > Addiction Recovery > Addiction Counselor',
  'Gaming Addiction': 'Mental Health > Addiction Recovery > Recovery Coach',
  'Social Media Addiction': 'Mental Health > Addiction Recovery > Recovery Coach',
  'Drug Addiction Counseling': 'Mental Health > Addiction Recovery > Addiction Counselor',
  'Alcohol Addiction Counseling': 'Mental Health > Addiction Recovery > Addiction Counselor',
  'Tobacco Addiction Counseling': 'Mental Health > Addiction Recovery > Addiction Counselor',
  'Phone Addiction Counseling': 'Mental Health > Addiction Recovery > Recovery Coach',
  'Social Media Addiction Counseling': 'Mental Health > Addiction Recovery > Recovery Coach',
  'Porn Addiction Counseling': 'Mental Health > Addiction Recovery > Recovery Coach',
  
  // Mental Health
  'Stress Management': 'Mental Health > Stress Management > Stress Coach',
  'Anxiety & Depression': 'Mental Health > Counseling > Therapist',
  'Relationship Issues': 'Mental Health > Counseling > Counselor',
  'Self-Confidence': 'Mental Health > Counseling > Life Coach',
  'Academic Pressure': 'Mental Health > Stress Management > Stress Coach',
  'Life Coaching': 'Mental Health > Counseling > Life Coach',
  'Psychiatric Counseling': 'Mental Health > Counseling > Licensed Psychologist',
  'Depression Support': 'Mental Health > Counseling > Therapist',
  
  // Astrology
  'Vedic Astrology': 'Astrology > Vedic Astrology > Vedic Astrologer',
  'Tarot Reading': 'Astrology > Vedic Astrology > Numerologist',
  'Numerology': 'Astrology > Vedic Astrology > Numerologist',
  'Palmistry': 'Astrology > Vedic Astrology > Vedic Astrologer',
  'Vastu Consultation': 'Astrology > Vedic Astrology > Vedic Astrologer',
  'Kundali Matching': 'Astrology > Vedic Astrology > Horoscope Expert',
  'Vastu Shastra': 'Astrology > Vedic Astrology > Vedic Astrologer',
  'Gemstone Consultation': 'Astrology > Vedic Astrology > Vedic Astrologer',
  
  // Financial Planning
  'Investment Planning': 'Financial Planning > Investment > Financial Advisor',
  'Tax Planning': 'Financial Planning > Tax Planning > Tax Consultant',
  'Insurance Advisory': 'Financial Planning > Investment > Financial Advisor',
  'Retirement Planning': 'Financial Planning > Investment > Financial Advisor',
  'Debt Management': 'Financial Planning > Education Loans > Loan Advisor',
  'Stock Market Investment': 'Financial Planning > Investment > Stock Market Expert',
  'Mutual Funds & SIP': 'Financial Planning > Investment > Mutual Fund Advisor',
  'Real Estate Investment': 'Financial Planning > Investment > Financial Advisor',
  'Tax Planning & CA Services': 'Financial Planning > Tax Planning > CA Professional',
  'Loan Consultation': 'Financial Planning > Education Loans > Loan Advisor',
  'Complete Financial Planning': 'Financial Planning > Investment > Financial Advisor',
  
  // Sports Mentorship
  'Cricket': 'Sports Mentorship > Cricket > Cricket Coach',
  'Football': 'Sports Mentorship > Football > Football Coach',
  'Basketball': 'Sports Mentorship > Basketball > Basketball Coach',
  'Badminton': 'Sports Mentorship > Badminton > Badminton Coach',
  'Tennis': 'Sports Mentorship > Tennis > Tennis Coach',
  'Swimming': 'Sports Mentorship > Cricket > Cricket Coach', // Default
  'Athletics': 'Sports Mentorship > Cricket > Cricket Coach', // Default
  'Yoga & Fitness': 'Mental Health > Stress Management > Yoga Instructor',
  'Cricket Coach': 'Sports Mentorship > Cricket > Cricket Coach',
  'Ranji Trophy': 'Sports Mentorship > Cricket > Ranji Player',
  'Football Coach': 'Sports Mentorship > Football > Football Coach',
  'ISL': 'Sports Mentorship > Football > ISL Player',
  'Indian Super League': 'Sports Mentorship > Football > ISL Player',
  'Badminton Coach': 'Sports Mentorship > Badminton > Badminton Coach',
  'Tennis Coach': 'Sports Mentorship > Tennis > Tennis Coach',
  
  // Content Creation
  'YouTube': 'Content Creation > YouTube > 10K-100K Subscribers',
  'Instagram': 'Content Creation > Instagram > Reels Creator',
  'LinkedIn': 'Content Creation > LinkedIn > Thought Leader',
  'Twitter/X': 'Content Creation > Instagram > Reels Creator', // Default
  
  // Electronic Accessories
  'Smartphones': 'Electronic Accessories > Smartphones > Android Expert',
  'Laptops': 'Electronic Accessories > Laptops & Computers > Laptop Specialist',
  'Tablets': 'Electronic Accessories > Smartphones > Android Expert',
  'Smartwatches': 'Electronic Accessories > Smartphones > Budget Phone Expert',
  'Audio Devices': 'Electronic Accessories > Audio Equipment > Headphone Expert',
  'Gaming Consoles': 'Electronic Accessories > Laptops & Computers > Gaming PC Expert',
  'Laptop Buying Guide': 'Electronic Accessories > Laptops & Computers > Laptop Specialist',
  'Mobile & Smartphone Guide': 'Electronic Accessories > Smartphones > Android Expert',
  'Headphones & Audio': 'Electronic Accessories > Audio Equipment > Headphone Expert',
  'Gaming Accessories': 'Electronic Accessories > Laptops & Computers > Gaming PC Expert',
  
  // Career & Life Skills
  'Career Guidance': 'Mental Health > Counseling > Life Coach',
  'Interview Preparation': 'Mental Health > Counseling > Life Coach',
  'Resume Building': 'Mental Health > Counseling > Life Coach',
  'Communication Skills': 'Mental Health > Counseling > Life Coach',
  'Leadership Development': 'Mental Health > Counseling > Life Coach',
  'Time Management': 'Mental Health > Stress Management > Stress Coach',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all mentors
    const { data: mentors, error: fetchError } = await supabase
      .from('mentors')
      .select('id, mentor_types');

    if (fetchError) {
      throw fetchError;
    }

    if (!mentors || mentors.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No mentors found to migrate',
          migrated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let migratedCount = 0;
    let skippedCount = 0;
    const migrationDetails: Array<{id: string, old: string[], new: string[]}> = [];

    // Process each mentor
    for (const mentor of mentors) {
      const oldTypes = mentor.mentor_types || [];
      
      // Check if already migrated (contains ' > ' separator)
      const alreadyMigrated = oldTypes.some((type: string) => type.includes(' > '));
      
      if (alreadyMigrated) {
        skippedCount++;
        continue;
      }

      // Map old types to new hierarchical format
      const newTypes: string[] = [];
      const unmappedTypes: string[] = [];

      for (const oldType of oldTypes) {
        const mappedType = categoryMapping[oldType];
        if (mappedType) {
          // Avoid duplicates
          if (!newTypes.includes(mappedType)) {
            newTypes.push(mappedType);
          }
        } else {
          unmappedTypes.push(oldType);
          console.warn(`No mapping found for: ${oldType}`);
        }
      }

      // If we have new types, update the mentor
      if (newTypes.length > 0) {
        const { error: updateError } = await supabase
          .from('mentors')
          .update({ mentor_types: newTypes })
          .eq('id', mentor.id);

        if (updateError) {
          console.error(`Error updating mentor ${mentor.id}:`, updateError);
        } else {
          migratedCount++;
          migrationDetails.push({
            id: mentor.id,
            old: oldTypes,
            new: newTypes
          });
        }
      } else {
        skippedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Migration completed',
        totalMentors: mentors.length,
        migrated: migratedCount,
        skipped: skippedCount,
        details: migrationDetails.slice(0, 10), // Return first 10 for debugging
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
