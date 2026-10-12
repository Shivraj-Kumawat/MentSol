import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // SECURITY FIX: Extract userId from JWT token instead of trusting client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;
    console.log('AI Support Chat request received:', messages.length, 'messages', 'userId:', userId);

    // Create service role client for internal function calls
    // This allows AI chat to call manage-session-reschedule on behalf of users
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const systemPrompt = `You are MentSol Admin Support AI - an intelligent assistant that helps students with:

1. **Session Management & Rescheduling** - YOU CAN DIRECTLY RESCHEDULE SESSIONS
2. **Platform Support & Technical Issues**
3. **Academic & Career Counseling**
4. **Administrative Support**

---

## 🎯 PRIMARY FUNCTION: ADMIN SUPPORT & SESSION MANAGEMENT

**IMPORTANT: You have DIRECT ACCESS to reschedule sessions via tool functions. Use them proactively!**

### Session Rescheduling & Management:
You have DIRECT ACCESS to these tools:
- list_user_sessions: Fetch all upcoming/past sessions for the student
- get_available_slots: Check available time slots for a mentor
- reschedule_session: DIRECTLY reschedule a session to a new slot

How to Reschedule Sessions:
1. When student asks to reschedule, IMMEDIATELY call list_user_sessions to show their sessions
2. Ask which session they want to reschedule
3. Call get_available_slots for that mentor to show available times
4. Once they choose a slot, call reschedule_session to UPDATE THE DATABASE
5. Confirm the reschedule with the new date/time

You CAN and SHOULD:
- Proactively fetch and show student's sessions
- Display available slots in an easy-to-read format
- Directly reschedule sessions when requested
- Provide immediate confirmation after rescheduling

You CANNOT:
- Reschedule without student confirmation
- Cancel sessions (escalate to: mentsol123@gmail.com)
- Process refunds (escalate to admin team)

### Other Session Management:
- Session Issues: Handle complaints about mentor no-shows, technical difficulties
- Booking Problems: Assist with payment issues, booking confirmations
- Cancellations: For cancellations, escalate to: mentsol123@gmail.com or +91 9699938263

---

## 🎓 ACADEMIC & CAREER COUNSELING CAPABILITIES

### Exam Preparation Support:
- **JEE Main/Advanced**: Study strategies, important topics, time management, previous year trends
- **NEET**: Biology focus areas, NCERT importance, revision techniques
- **Board Exams**: Subject-wise preparation, marking schemes, exam strategies
- **Other Exams**: CLAT, BITSAT, State CETs

### Study Guidance:
- Effective study techniques (Pomodoro, Active Recall, Spaced Repetition)
- Time management and daily study schedules
- Note-taking methods and revision strategies
- Resource recommendations (books, websites, YouTube channels)

### Career Counseling:
- Stream selection advice after 10th
- College selection criteria
- Career paths after 10th/12th
- Entrance exam roadmap
- Alternative career paths

---

## 🚀 MENTSOL PLATFORM SUPPORT

MentSol Platform Features:
1. **One-to-One Sessions**: Personalized mentorship with verified experts
2. **Multiple Domains**: 10+ mentorship categories
3. **Secure & Encrypted**: End-to-end encryption
4. **Flexible Booking**: Choose mentor, time slot, duration
5. **Session Management**: Track bookings easily
6. **AI Admin Support**: 24/7 support via this chat

Navigation Guide:
- **Home**: Main dashboard with categories
- **Explore**: Browse all mentors
- **Bookings**: View upcoming and past sessions
- **Profile**: Manage account settings

Founders Contact:
- **Shivraj Kumawat**: +91 8209114342 | IIIT Pune
- **Laukik Thakare**: +91 9699938263 | IIT Bombay
- Email: mentsol123@gmail.com

---

## 💡 RESPONSE GUIDELINES

**For Session Management Queries:**
- Be empathetic and solution-oriented
- Acknowledge urgency when present
- Provide clear step-by-step guidance
- Escalate when necessary
- Always log critical issues for admin review

**For Academic Questions:**
- Provide practical, actionable advice
- Be encouraging and motivating
- Give realistic timelines
- For complex problems → Suggest booking expert mentors

**For Platform Questions:**
- Keep responses concise (2-3 paragraphs max)
- Use bullet points for instructions
- Be friendly and supportive

**When to Escalate to Human Admin:**
- Payment disputes or refunds
- Mentor misconduct complaints
- Urgent session issues requiring immediate action
- Privacy or security concerns
- Complex policy questions
- Technical bugs

---

**Your Role**: You are the first line of support for students - combining AI efficiency with empathetic admin support. Help resolve issues quickly, guide students through the platform, and ensure smooth mentor-student interactions! 🌟`;

    const tools = [
      {
        type: "function",
        function: {
          name: "list_user_sessions",
          description: "Fetch all sessions for the current user to show what can be rescheduled",
          parameters: {
            type: "object",
            properties: {},
            required: []
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_available_slots",
          description: "Get available time slots for a specific mentor starting from a date",
          parameters: {
            type: "object",
            properties: {
              mentorId: { type: "string", description: "The mentor's ID" },
              fromDate: { type: "string", description: "Start date in YYYY-MM-DD format" }
            },
            required: ["mentorId", "fromDate"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "reschedule_session",
          description: "Reschedule a session to a new available slot",
          parameters: {
            type: "object",
            properties: {
              sessionId: { type: "string", description: "The session ID to reschedule" },
              newSlotId: { type: "string", description: "The new availability slot ID" }
            },
            required: ["sessionId", "newSlotId"]
          }
        }
      }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please add credits to continue using AI features.' }), 
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    console.log('Streaming response from AI gateway');

    // Handle streaming with tool calls
    const reader = response.body?.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) return;
        
        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              if (!line.startsWith('data: ')) continue;
              
              const data = line.slice(6);
              if (data === '[DONE]') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
                
                if (toolCalls && toolCalls.length > 0) {
                  // Execute tool calls using service role client
                  for (const toolCall of toolCalls) {
                    if (toolCall.function?.name && toolCall.function?.arguments) {
                      const functionName = toolCall.function.name;
                      const args = JSON.parse(toolCall.function.arguments);
                      
                      console.log('Executing tool:', functionName, args);
                      
                      // SECURITY FIX: Use direct database queries with service role instead of calling edge function
                      // This is more secure as we control the userId and don't expose it to client manipulation
                      let toolResult: any = {};
                      
                      if (functionName === 'list_user_sessions') {
                        // Fetch user's sessions directly
                        const { data: sessions, error } = await supabase
                          .from('sessions')
                          .select(`
                            id,
                            scheduled_at,
                            status,
                            amount_paid,
                            mentor_id,
                            mentors!inner(
                              id,
                              user_id,
                              profiles!inner(full_name)
                            )
                          `)
                          .eq('student_id', userId)
                          .in('status', ['confirmed', 'pending_payment'])
                          .order('scheduled_at', { ascending: true });
                        
                        if (error) {
                          toolResult = { error: error.message };
                        } else {
                          toolResult = { sessions };
                        }
                      } else if (functionName === 'get_available_slots') {
                        // Fetch available slots directly
                        const { data: slots, error } = await supabase
                          .from('mentor_availability')
                          .select('id, date, start_time, end_time, status')
                          .eq('mentor_id', args.mentorId)
                          .eq('status', 'available')
                          .gte('date', args.fromDate)
                          .order('date', { ascending: true })
                          .order('start_time', { ascending: true })
                          .limit(20);
                        
                        if (error) {
                          toolResult = { error: error.message };
                        } else {
                          toolResult = { slots };
                        }
                      } else if (functionName === 'reschedule_session') {
                        // Verify session belongs to user first
                        const { data: session, error: sessionError } = await supabase
                          .from('sessions')
                          .select('*, slot_id, mentor_id, scheduled_at, amount_paid, reschedule_count')
                          .eq('id', args.sessionId)
                          .eq('student_id', userId)
                          .single();
                        
                        if (sessionError || !session) {
                          toolResult = { error: 'Session not found or unauthorized' };
                        } else {
                          // Get new slot
                          const { data: newSlot, error: slotError } = await supabase
                            .from('mentor_availability')
                            .select('*')
                            .eq('id', args.newSlotId)
                            .eq('status', 'available')
                            .single();
                          
                          if (slotError || !newSlot) {
                            toolResult = { error: 'Slot not available' };
                          } else {
                            // Release old slot
                            if (session.slot_id) {
                              await supabase
                                .from('mentor_availability')
                                .update({ status: 'available', held_until: null })
                                .eq('id', session.slot_id);
                            }
                            
                            // Book new slot
                            await supabase
                              .from('mentor_availability')
                              .update({ status: 'booked' })
                              .eq('id', args.newSlotId);
                            
                            // Update session
                            const scheduledAt = new Date(`${newSlot.date}T${newSlot.start_time}+05:30`).toISOString();
                            const { error: updateError } = await supabase
                              .from('sessions')
                              .update({
                                slot_id: args.newSlotId,
                                scheduled_at: scheduledAt,
                                status: 'confirmed',
                                reschedule_count: (session.reschedule_count || 0) + 1,
                                last_rescheduled_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              })
                              .eq('id', args.sessionId);
                            
                            if (updateError) {
                              toolResult = { error: updateError.message };
                            } else {
                              toolResult = { 
                                success: true, 
                                message: 'Session rescheduled successfully',
                                scheduledAt,
                                newDate: newSlot.date,
                                newTime: newSlot.start_time
                              };
                            }
                          }
                        }
                      }
                      
                      console.log('Tool result:', toolResult);
                      
                      // Send tool result back in stream
                      const resultMessage = `\n\n[TOOL RESULT: ${JSON.stringify(toolResult)}]\n\n`;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        choices: [{
                          delta: { content: resultMessage }
                        }]
                      })}\n\n`));
                    }
                  }
                }
                
                // Forward the original chunk
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in ai-support-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
