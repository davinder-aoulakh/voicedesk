import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWithinBusinessHours(scheduledAt, businessHours, timezone) {
  if (!businessHours || !scheduledAt) return true; // allow if no hours configured

  const date = new Date(scheduledAt);
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: timezone || 'Australia/Sydney',
    weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase();
  const hour    = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute  = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const timeNum = hour * 100 + minute; // e.g. 930 = 09:30

  const dayKey = weekday; // "monday", "tuesday" etc.
  const dayHours = businessHours[dayKey];
  if (!dayHours || !dayHours.open) return false; // closed that day

  const [openH, openM]   = (dayHours.open_time  || '09:00').split(':').map(Number);
  const [closeH, closeM] = (dayHours.close_time || '17:00').split(':').map(Number);
  const openNum  = openH  * 100 + openM;
  const closeNum = closeH * 100 + closeM;

  return timeNum >= openNum && timeNum < closeNum;
}

async function sendSms(accountSid, authToken, to, from, body) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });
  return res.json();
}

function getCurrentDateInTimezone(timezone) {
  const tz = timezone || 'Australia/Sydney';
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  return formatter.format(new Date());
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────

async function handleCreateBooking(tc, base44, business, agent, call) {
  const args = tc.function.arguments || {};
  const businessId = business?.id || 'unknown';
  const agentId    = agent?.id || null;

  // Build scheduled_at from preferred_date + preferred_time
  let scheduledAt = args.scheduled_at || '';
  if (!scheduledAt && args.preferred_date && args.preferred_time) {
    scheduledAt = `${args.preferred_date}T${args.preferred_time}:00`;
  }

  // Availability check
  if (scheduledAt && business?.business_hours) {
    const within = isWithinBusinessHours(scheduledAt, business.business_hours, business.timezone);
    if (!within) {
      return {
        toolCallId: tc.id,
        result: `Sorry, that time is outside our business hours. Please choose a time when we are open.`,
      };
    }
  }

  const booking = await base44.asServiceRole.entities.Booking.create({
    business_id:    businessId,
    agent_id:       agentId,
    customer_name:  args.customer_name  || '',
    customer_phone: args.customer_phone || call?.customer?.number || '',
    customer_email: args.customer_email || '',
    service:        args.service_requested || args.service || '',
    scheduled_at:   scheduledAt,
    notes:          args.notes || '',
    status:         'confirmed',
    source:         'ai_agent',
  });

  // Update call log
  if (call?.id) {
    const logs = await base44.asServiceRole.entities.CallLog.filter({ vapi_call_id: call.id });
    if (logs.length) {
      await base44.asServiceRole.entities.CallLog.update(logs[0].id, {
        booking_created: true, booking_id: booking.id,
      });
    }
  }

  // Send confirmation SMS (fire-and-forget, don't fail on SMS error)
  if (booking.customer_phone && business?.twilio_phone_number) {
    const dateStr2 = scheduledAt
      ? new Date(scheduledAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })
      : 'your requested time';
    const serviceName = args.service_requested || args.service || 'your appointment';
    const smsBody = `Hi ${args.customer_name}, your booking for ${serviceName} on ${dateStr2} with ${business.name} is confirmed! Reply STOP to unsubscribe.`;
    await sendSms(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN'),
      booking.customer_phone,
      business.twilio_phone_number,
      smsBody,
    ).catch(() => {});
  }

  const dateStr = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })
    : 'the requested time';

  return {
    toolCallId: tc.id,
    result: `Booking confirmed for ${args.customer_name} on ${dateStr}. We look forward to seeing you!`,
  };
}

async function handleLookupCustomer(tc, base44, business, call) {
  const args = tc.function.arguments || {};
  const phone = args.phone || call?.customer?.number || '';

  if (!phone) {
    return { toolCallId: tc.id, result: JSON.stringify({ customer_found: false }) };
  }

  const customers = await base44.asServiceRole.entities.Customer.filter({
    business_id: business?.id,
    phone,
  });

  if (!customers.length) {
    return {
      toolCallId: tc.id,
      result: JSON.stringify({ customer_found: false }),
    };
  }

  const c = customers[0];
  return {
    toolCallId: tc.id,
    result: JSON.stringify({
      customer_found:   true,
      customer_name:    c.name || '',
      total_bookings:   c.total_bookings || 0,
      last_service:     c.preferred_service || '',
      preferred_staff:  c.preferred_staff || '',
    }),
  };
}

async function handleGetCurrentDate(tc, business) {
  const dateStr = getCurrentDateInTimezone(business?.timezone);
  return {
    toolCallId: tc.id,
    result: `Today is ${dateStr}.`,
  };
}

async function handleSendGoogleMapLink(tc, base44, business, call) {
  const args   = tc.function.arguments || {};
  const toPhone = args.phone || call?.customer?.number || '';

  // Resolve address: from args, then primary location, then business
  let address = args.address || '';
  if (!address && business?.id) {
    const locations = await base44.asServiceRole.entities.Location.filter({
      business_id: business.id, is_primary: true,
    });
    address = locations[0]?.address || business.address || '';
  }

  if (!address || !toPhone) {
    return { toolCallId: tc.id, result: 'Sorry, I was unable to send the map link.' };
  }

  const mapUrl  = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const fromNum = business?.twilio_phone_number;
  if (fromNum) {
    await sendSms(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN'),
      toPhone,
      fromNum,
      `Here is our location: ${mapUrl}`,
    );
  }

  return { toolCallId: tc.id, result: 'Map link sent to your phone!' };
}

async function handleSendEcommerceLink(tc, base44, agent, business, call) {
  const args    = tc.function.arguments || {};
  const toPhone = args.phone || call?.customer?.number || '';

  // Try to get URL from agent config or args
  const url = args.url || agent?.ecommerce_url || '';
  const fromNum = business?.twilio_phone_number;

  if (!url || !toPhone) {
    return { toolCallId: tc.id, result: 'Sorry, I was unable to send the link.' };
  }

  if (fromNum) {
    await sendSms(
      Deno.env.get('TWILIO_ACCOUNT_SID'),
      Deno.env.get('TWILIO_AUTH_TOKEN'),
      toPhone,
      fromNum,
      `Here is the link you requested: ${url}`,
    );
  }

  return { toolCallId: tc.id, result: 'Link sent to your phone!' };
}

async function handleModifyBooking(tc, base44, business, call) {
  const args  = tc.function.arguments || {};
  const phone = call?.customer?.number || '';

  // Find most recent booking for this caller
  const bookings = await base44.asServiceRole.entities.Booking.filter({
    business_id:    business?.id,
    customer_phone: phone,
  }, '-scheduled_at', 1);

  if (!bookings.length) {
    return { toolCallId: tc.id, result: "I couldn't find an existing booking for your phone number." };
  }

  let newScheduledAt = args.scheduled_at || '';
  if (!newScheduledAt && args.preferred_date && args.preferred_time) {
    newScheduledAt = `${args.preferred_date}T${args.preferred_time}:00`;
  }

  if (!newScheduledAt) {
    return { toolCallId: tc.id, result: 'Please provide the new date and time for your booking.' };
  }

  // Availability check
  if (business?.business_hours) {
    const within = isWithinBusinessHours(newScheduledAt, business.business_hours, business.timezone);
    if (!within) {
      return {
        toolCallId: tc.id,
        result: `Sorry, that time is outside our business hours. Please choose a time when we are open.`,
      };
    }
  }

  await base44.asServiceRole.entities.Booking.update(bookings[0].id, {
    scheduled_at: newScheduledAt,
  });

  const dateStr = new Date(newScheduledAt).toLocaleString('en-AU', {
    dateStyle: 'medium', timeStyle: 'short',
  });

  return {
    toolCallId: tc.id,
    result: `Your booking has been moved to ${dateStr}. See you then!`,
  };
}

async function handleCancelBooking(tc, base44, business, call) {
  const phone = call?.customer?.number || '';

  const bookings = await base44.asServiceRole.entities.Booking.filter({
    business_id:    business?.id,
    customer_phone: phone,
    status:         'confirmed',
  }, '-scheduled_at', 1);

  if (!bookings.length) {
    return { toolCallId: tc.id, result: "I couldn't find a confirmed booking to cancel for your phone number." };
  }

  await base44.asServiceRole.entities.Booking.update(bookings[0].id, { status: 'cancelled' });

  const b = bookings[0];
  const dateStr = b.scheduled_at
    ? new Date(b.scheduled_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })
    : 'your upcoming appointment';

  return {
    toolCallId: tc.id,
    result: `Your booking for ${dateStr} has been cancelled. We hope to see you again soon!`,
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { message } = payload;
    if (!message) return Response.json({ received: true });

    const { type, call } = message;

    // Resolve business + agent from assistant ID
    let business = null;
    let agent    = null;

    if (call?.assistantId) {
      const agents = await base44.asServiceRole.entities.Agent.filter({ vapi_assistant_id: call.assistantId });
      if (agents.length) {
        agent = agents[0];
        const businesses = await base44.asServiceRole.entities.Business.filter({ id: agent.business_id });
        if (businesses.length) business = businesses[0];
      }
    }

    const businessId = business?.id || 'unknown';
    const agentId    = agent?.id    || null;

    // ── call-started ──────────────────────────────────────────────────────────
    if (type === 'call-started') {
      await base44.asServiceRole.entities.CallLog.create({
        business_id:   businessId,
        agent_id:      agentId,
        vapi_call_id:  call.id,
        caller_number: call.customer?.number || '',
        caller_name:   call.customer?.name   || '',
        direction:     'inbound',
        status:        'in_progress',
        started_at:    new Date().toISOString(),
      });
    }

    // ── call-ended ────────────────────────────────────────────────────────────
    if (type === 'call-ended') {
      const logs    = await base44.asServiceRole.entities.CallLog.filter({ vapi_call_id: call.id });
      const endedAt = new Date().toISOString();
      const duration = call.duration ? Math.round(call.duration) : null;
      const callerNumber = call.customer?.number || '';
      const callerName   = call.customer?.name   || '';

      // ── Upsert Customer ────────────────────────────────────────────────────
      let customerId = null;
      if (callerNumber && businessId !== 'unknown') {
        const existing = await base44.asServiceRole.entities.Customer.filter({
          business_id: businessId,
          phone: callerNumber,
        });
        if (existing.length) {
          const c = existing[0];
          await base44.asServiceRole.entities.Customer.update(c.id, {
            total_calls: (c.total_calls || 0) + 1,
            last_contact: endedAt,
          });
          customerId = c.id;
        } else {
          const newCustomer = await base44.asServiceRole.entities.Customer.create({
            business_id:  businessId,
            name:         callerName || 'Unknown',
            phone:        callerNumber,
            source:       'ai_agent',
            total_calls:  1,
            last_contact: endedAt,
          });
          customerId = newCustomer.id;
        }
      }

      const updateData = {
        status:           (call.endedReason === 'customer-ended-call' || call.endedReason === 'assistant-ended-call') ? 'completed' : 'missed',
        ended_at:         endedAt,
        duration_seconds: duration,
        transcript:       call.transcript    || '',
        recording_url:    call.recordingUrl  || '',
        summary:          call.summary       || '',
        cost_usd:         call.cost          || null,
        ...(customerId ? { customer_id: customerId } : {}),
      };

      if (logs.length) {
        await base44.asServiceRole.entities.CallLog.update(logs[0].id, updateData);
      } else {
        await base44.asServiceRole.entities.CallLog.create({
          business_id:   businessId,
          agent_id:      agentId,
          vapi_call_id:  call.id,
          caller_number: callerNumber,
          caller_name:   callerName,
          direction:     'inbound',
          started_at:    new Date(Date.now() - (duration || 0) * 1000).toISOString(),
          ...updateData,
        });
      }
    }

    // ── tool-calls ────────────────────────────────────────────────────────────
    if (type === 'tool-calls') {
      const toolCalls = message.toolCallList || [];
      const results   = [];

      for (const tc of toolCalls) {
        const fnName = tc.function?.name;

        if (fnName === 'createBooking') {
          results.push(await handleCreateBooking(tc, base44, business, agent, call));
        } else if (fnName === 'lookupCustomer') {
          results.push(await handleLookupCustomer(tc, base44, business, call));
        } else if (fnName === 'getCurrentDate') {
          results.push(await handleGetCurrentDate(tc, business));
        } else if (fnName === 'sendGoogleMapLink') {
          results.push(await handleSendGoogleMapLink(tc, base44, business, call));
        } else if (fnName === 'sendEcommerceLink') {
          results.push(await handleSendEcommerceLink(tc, base44, agent, business, call));
        } else if (fnName === 'modifyBooking') {
          results.push(await handleModifyBooking(tc, base44, business, call));
        } else if (fnName === 'cancelBooking') {
          results.push(await handleCancelBooking(tc, base44, business, call));
        }
      }

      if (results.length) {
        return Response.json({ results });
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});