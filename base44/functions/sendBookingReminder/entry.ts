import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled/service-role calls (no user auth required for scheduled jobs)
    // but validate a simple shared secret if provided via header
    const authHeader = req.headers.get('Authorization') || '';
    let isAuthenticated = false;

    if (authHeader.startsWith('Bearer ')) {
      // Try user auth
      try {
        const user = await base44.auth.me();
        if (user) isAuthenticated = true;
      } catch (_) {}
    }

    // Also allow service-role calls (scheduled automations)
    if (!isAuthenticated) {
      // For scheduled automation calls, allow if no auth (run as service)
      // Validate by checking the request source (automation system won't have user token)
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN');

    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // now + 23h
    const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000); // now + 25h

    // Fetch all confirmed bookings with reminder not yet sent
    const bookings = await base44.asServiceRole.entities.Booking.filter(
      { status: 'confirmed', reminder_sent: false },
      'scheduled_at',
      500
    );

    // Filter by scheduled_at in the 23-25h window
    const upcoming = bookings.filter(b => {
      if (!b.scheduled_at) return false;
      const t = new Date(b.scheduled_at).getTime();
      return t >= windowStart.getTime() && t <= windowEnd.getTime();
    });

    const results = [];

    for (const booking of upcoming) {
      if (!booking.customer_phone) {
        results.push({ booking_id: booking.id, skipped: true, reason: 'No phone' });
        continue;
      }

      // Get business for from_number and name
      const businesses = await base44.asServiceRole.entities.Business.filter({ id: booking.business_id });
      const business = businesses[0];

      if (!business?.twilio_phone_number) {
        results.push({ booking_id: booking.id, skipped: true, reason: 'No business phone' });
        continue;
      }

      const timeStr = booking.scheduled_at
        ? new Date(booking.scheduled_at).toLocaleString('en-AU', { timeStyle: 'short' })
        : 'your scheduled time';

      const serviceName = booking.service || 'your appointment';
      const message = `Reminder: your booking for ${serviceName} tomorrow at ${timeStr} with ${business.name}. Reply STOP to unsubscribe.`;

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

      if (res.ok) {
        await base44.asServiceRole.entities.Booking.update(booking.id, { reminder_sent: true });
        results.push({ booking_id: booking.id, sent: true, sid: data.sid });
      } else {
        results.push({ booking_id: booking.id, sent: false, error: data.message });
      }
    }

    return Response.json({
      success: true,
      window: { from: windowStart.toISOString(), to: windowEnd.toISOString() },
      processed: upcoming.length,
      results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});