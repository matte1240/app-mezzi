import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

export async function createCalendarEvent({
  title,
  start,
  end,
  description,
}: {
  title: string;
  start: Date;
  end: Date;
  description?: string;
}) {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!clientEmail || !privateKey || !calendarId) {
    console.warn('Google Calendar credentials not set. Skipping event creation.');
    return null;
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: title,
        description,
        start: {
          date: start.toISOString().split('T')[0], // All-day event
        },
        end: {
          date: end.toISOString().split('T')[0], // All-day event (exclusive)
        },
      },
    });

    return event.data;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
}
