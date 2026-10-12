import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface CalendarEventRequest {
  sessionId: string;
  mentorEmail: string;
  mentorTimezone: string;
  studentName: string;
  studentEmail: string;
  meetLink: string;
  scheduledAt: string;
  durationMinutes: number;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Google OAuth credentials");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get access token:", error);
    throw new Error("Failed to get access token");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: CalendarEventRequest = await req.json();
    const {
      sessionId,
      mentorEmail,
      mentorTimezone,
      studentName,
      studentEmail,
      meetLink,
      scheduledAt,
      durationMinutes,
    } = body;

    console.log("Creating calendar event for session:", sessionId);
    console.log("Mentor email:", mentorEmail);
    console.log("Mentor timezone:", mentorTimezone);
    console.log("Scheduled at:", scheduledAt);

    // Validate required fields
    if (!sessionId || !mentorEmail || !meetLink || !scheduledAt) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Calculate end time
    const startTime = new Date(scheduledAt);
    const endTime = new Date(startTime.getTime() + (durationMinutes || 15) * 60 * 1000);

    // Create calendar event payload
    const event = {
      summary: `MentSol Session with ${studentName || "Student"}`,
      description: `🎓 MentSol Mentoring Session\n\n` +
        `📅 Session Details:\n` +
        `• Student: ${studentName || "Student"}\n` +
        `• Email: ${studentEmail || "Not provided"}\n` +
        `• Duration: ${durationMinutes || 15} minutes\n\n` +
        `🔗 Join via Google Meet:\n${meetLink}\n\n` +
        `---\n` +
        `Session ID: ${sessionId}`,
      location: meetLink,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: mentorTimezone || "Asia/Kolkata",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: mentorTimezone || "Asia/Kolkata",
      },
      attendees: studentEmail ? [{ email: studentEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 30 },
          { method: "popup", minutes: 10 },
        ],
      },
      conferenceData: {
        entryPoints: [
          {
            entryPointType: "video",
            uri: meetLink,
            label: "Google Meet",
          },
        ],
      },
    };

    console.log("Creating calendar event with payload:", JSON.stringify(event, null, 2));

    // Create event in primary calendar
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      console.error("Failed to create calendar event:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create calendar event" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdEvent = await calendarResponse.json();
    console.log("Calendar event created successfully:", createdEvent.id);

    return new Response(
      JSON.stringify({
        success: true,
        eventId: createdEvent.id,
        htmlLink: createdEvent.htmlLink,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating calendar event:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
