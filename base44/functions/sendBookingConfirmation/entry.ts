import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    if (!booking.customer_phone) {
      return Response.json({ skipped: true, reason: 'No customer phone number' });
    }

    const businesses = await base44.asServiceRole.entities.Business.filter({ id: booking.business_id });
    const business = businesses[0];
    if (!business) return Response.json({ error: 'Business not found' }, { status: 404 });

    if (!business.twilio_phone_number) {
      return Response.json({ skipped: true, reason: 'Business has no provisioned phone number' });
    }

    const dateStr = booking.scheduled_at
      ? new Date(booking.scheduled_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })
      : 'your requested time';

    const serviceName = booking.service || 'your appointment';
    const message = `Hi ${booking.customer_name}, your booking for ${serviceName} on ${dateStr} with ${business.name} is confirmed! Reply STOP to unsubscribe.`;

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
        body: new URLSearchParams({
          To:   booking.customer_phone,
          From: business.twilio_phone_number,
          Body: message,
        }).toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data.message || 'SMS send failed', details: data }, { status: 400 });
    }

    return Response.json({ success: true, sid: data.sid, message_sent: message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});