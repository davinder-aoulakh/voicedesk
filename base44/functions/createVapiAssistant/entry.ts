import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      business_id,
      name,
      voice_id,
      system_prompt,
      greeting_message,
      temperature,
      max_duration_seconds,
      silence_timeout_seconds,
      voice_speed,
      personality_traits,
      tone_of_voice,
      response_style,
      custom_instructions,
    } = await req.json();

    const VAPI_KEY = Deno.env.get('VAPI_API_KEY');

    // Build personality-enhanced system prompt
    const personalityPrefix = [
      name && `Your name is ${name}.`,
      personality_traits?.length && `Your personality traits are: ${personality_traits.join(', ')}.`,
      tone_of_voice && `Your tone of voice is ${tone_of_voice}.`,
      response_style && `Provide ${response_style} responses.`,
      custom_instructions,
    ].filter(Boolean).join(' ');

    const finalSystemPrompt = personalityPrefix
      ? `${personalityPrefix}\n\n${system_prompt || 'You are a helpful AI receptionist.'}`
      : (system_prompt || 'You are a helpful AI receptionist.');

    const createBookingTool = {
      type: 'function',
      function: {
        name: 'createBooking',
        description: 'Create a booking for the customer',
        parameters: {
          type: 'object',
          properties: {
            customer_name:    { type: 'string',  description: 'Full name of the customer' },
            customer_phone:   { type: 'string',  description: 'Phone number' },
            service_requested:{ type: 'string',  description: 'Service they want to book' },
            preferred_staff:  { type: 'string',  description: 'Preferred staff member if any' },
            preferred_date:   { type: 'string',  description: 'Preferred date in YYYY-MM-DD format' },
            preferred_time:   { type: 'string',  description: 'Preferred time in HH:MM format' },
            party_size:       { type: 'integer', description: 'Number of people for restaurant bookings' },
            notes:            { type: 'string',  description: 'Any special notes' },
          },
          required: ['customer_name', 'customer_phone', 'service_requested', 'preferred_date', 'preferred_time'],
        },
      },
    };

    const body = {
      name: name || 'AI Receptionist',
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: finalSystemPrompt }],
        temperature: temperature ?? 0.5,
        tools: [createBookingTool],
      },
      voice: {
        provider: '11labs',
        voiceId: voice_id || 'aria',
        speed: voice_speed ?? 1.0,
      },
      firstMessage: greeting_message || `Hi! You've reached us. How can I help you today?`,
      endCallMessage: 'Thank you for calling. Have a great day!',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
      },
      ...(max_duration_seconds && { maxDurationSeconds: max_duration_seconds }),
      ...(silence_timeout_seconds && { silenceTimeoutSeconds: silence_timeout_seconds }),
    };

    const res = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.message || 'VAPI error', details: data }, { status: 400 });
    }

    return Response.json({ assistant_id: data.id, assistant: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});