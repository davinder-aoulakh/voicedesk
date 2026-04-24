import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { message } = payload;
    if (!message) return Response.json({ received: true });

    const { type, call } = message;

    // Find the business by phone number or assistant ID
    let business = null;
    let agent = null;

    if (call?.assistantId) {
      const agents = await base44.asServiceRole.entities.Agent.filter({ vapi_assistant_id: call.assistantId });
      if (agents.length) {
        agent = agents[0];
        const businesses = await base44.asServiceRole.entities.Business.filter({ id: agent.business_id });
        if (businesses.length) business = businesses[0];
      }
    }

    const businessId = business?.id || 'unknown';
    const agentId = agent?.id || null;

    if (type === 'call-started') {
      await base44.asServiceRole.entities.CallLog.create({
        business_id: businessId,
        agent_id: agentId,
        vapi_call_id: call.id,
        caller_number: call.customer?.number || '',
        caller_name: call.customer?.name || '',
        direction: 'inbound',
        status: 'in_progress',
        started_at: new Date().toISOString(),
      });
    }

    if (type === 'call-ended') {
      // Find the existing call log
      const logs = await base44.asServiceRole.entities.CallLog.filter({ vapi_call_id: call.id });
      
      const endedAt = new Date().toISOString();
      const duration = call.duration ? Math.round(call.duration) : null;
      const transcript = call.transcript || '';
      const recording = call.recordingUrl || '';
      const summary = call.summary || '';

      const updateData = {
        status: call.endedReason === 'customer-ended-call' || call.endedReason === 'assistant-ended-call' ? 'completed' : 'missed',
        ended_at: endedAt,
        duration_seconds: duration,
        transcript,
        recording_url: recording,
        summary,
        cost_usd: call.cost || null,
      };

      if (logs.length) {
        await base44.asServiceRole.entities.CallLog.update(logs[0].id, updateData);
      } else {
        await base44.asServiceRole.entities.CallLog.create({
          business_id: businessId,
          agent_id: agentId,
          vapi_call_id: call.id,
          caller_number: call.customer?.number || '',
          caller_name: call.customer?.name || '',
          direction: 'inbound',
          started_at: new Date(Date.now() - (duration || 0) * 1000).toISOString(),
          ...updateData,
        });
      }
    }

    // Handle tool calls — booking creation
    if (type === 'tool-calls') {
      const toolCalls = message.toolCallList || [];
      for (const tc of toolCalls) {
        if (tc.function?.name === 'createBooking') {
          const args = tc.function.arguments || {};
          const booking = await base44.asServiceRole.entities.Booking.create({
            business_id: businessId,
            agent_id: agentId,
            customer_name: args.customer_name || '',
            customer_phone: args.customer_phone || call?.customer?.number || '',
            service: args.service || '',
            scheduled_at: args.scheduled_at || '',
            status: 'confirmed',
            source: 'ai_agent',
          });

          // Mark call as having created a booking
          if (call?.id) {
            const logs = await base44.asServiceRole.entities.CallLog.filter({ vapi_call_id: call.id });
            if (logs.length) {
              await base44.asServiceRole.entities.CallLog.update(logs[0].id, { booking_created: true, booking_id: booking.id });
            }
          }

          return Response.json({
            results: [{ toolCallId: tc.id, result: `Booking confirmed for ${args.customer_name} on ${args.scheduled_at}` }]
          });
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});