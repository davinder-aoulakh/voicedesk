import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to_number, from_number, message_body } = await req.json();

    if (!to_number || !from_number || !message_body) {
      return Response.json({ error: 'Missing required fields: to_number, from_number, message_body' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN');

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to_number, From: from_number, Body: message_body }).toString(),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.message || 'Twilio error', details: data }, { status: 400 });
    }

    return Response.json({ success: true, sid: data.sid, status: data.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});