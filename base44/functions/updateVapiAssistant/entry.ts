import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOL_DEFINITIONS = {
  booking_manager: {
    type: 'function',
    function: {
      name: 'createBooking',
      description: 'Create a booking for the customer',
      parameters: {
        type: 'object',
        properties: {
          customer_name:     { type: 'string',  description: 'Full name of the customer' },
          customer_phone:    { type: 'string',  description: 'Phone number' },
          service_requested: { type: 'string',  description: 'Service they want to book' },
          preferred_staff:   { type: 'string',  description: 'Preferred staff member if any' },
          preferred_date:    { type: 'string',  description: 'Preferred date in YYYY-MM-DD format' },
          preferred_time:    { type: 'string',  description: 'Preferred time in HH:MM format' },
          party_size:        { type: 'integer', description: 'Number of people for restaurant bookings' },
          notes:             { type: 'string',  description: 'Any special notes' },
        },
        required: ['customer_name', 'customer_phone', 'service_requested', 'preferred_date', 'preferred_time'],
      },
    },
  },
  greetings: {
    type: 'function',
    function: {
      name: 'lookupCustomer',
      description: 'Look up a customer by phone number to personalise the greeting',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'The caller phone number' },
        },
        required: ['phone'],
      },
    },
  },
  tell_today_date: {
    type: 'function',
    function: {
      name: 'getCurrentDate',
      description: 'Get the current date and time',
      parameters: { type: 'object', properties: {} },
    },
  },
  send_google_map_link: {
    type: 'function',
    function: {
      name: 'sendGoogleMapLink',
      description: 'Send a Google Maps link to the caller via SMS',
      parameters: {
        type: 'object',
        properties: {
          phone:   { type: 'string', description: 'Recipient phone number' },
          address: { type: 'string', description: 'Business address to map' },
        },
        required: ['phone', 'address'],
      },
    },
  },
  send_ecommerce_link: {
    type: 'function',
    function: {
      name: 'sendEcommerceLink',
      description: 'Send an e-commerce or booking link to the caller via SMS',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Recipient phone number' },
          url:   { type: 'string', description: 'URL to send' },
        },
        required: ['phone', 'url'],
      },
    },
  },
  transfer_to_human: {
    type: 'transferCall',
    destinations: [
      {
        type: 'number',
        number: '',
        description: 'Transfer to a human agent',
      },
    ],
  },
};

// ─── System Prompt Assembly ───────────────────────────────────────────────────

function buildSystemPrompt({
  name,
  personality_traits,
  tone_of_voice,
  response_style,
  system_prompt,
  return_customer_greeting,
  recording_disclosure,
  custom_instructions,
  custom_pronunciations,
}) {
  const blocks = [];

  // 1. Personality block
  const personality = [
    name && `Your name is ${name}.`,
    personality_traits?.length && `Your personality traits are: ${personality_traits.join(', ')}.`,
    tone_of_voice && `Your tone of voice is ${tone_of_voice}.`,
    response_style && `Provide ${response_style} responses.`,
  ].filter(Boolean).join(' ');
  if (personality) blocks.push(personality);

  // 2. Core knowledge / instructions
  if (system_prompt) blocks.push(system_prompt);

  // 3. Return customer greeting logic
  if (return_customer_greeting) {
    blocks.push(
      `If you recognise the caller as a returning customer, greet them with: "${return_customer_greeting}"`
    );
  }

  // 4. Recording disclosure
  if (recording_disclosure) {
    blocks.push(`At the start of the call, inform the caller: "${recording_disclosure}"`);
  }

  // 5. Custom instructions
  if (custom_instructions) blocks.push(custom_instructions);

  // 6. Pronunciation rules
  if (custom_pronunciations?.length) {
    const rules = custom_pronunciations
      .map(p => `When you say "${p.word}" pronounce it as "${p.phonetic}".`)
      .join(' ');
    blocks.push(`Pronunciation rules: ${rules}`);
  }

  return blocks.join('\n\n');
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const {
      assistant_id,
      name,
      voice_id,
      greeting_message,
      system_prompt,
      temperature,
      max_duration_seconds,
      silence_timeout_seconds,
      voice_speed,
      personality_traits,
      tone_of_voice,
      response_style,
      custom_instructions,
      return_customer_greeting,
      recording_disclosure,
      enabled_tools,
      custom_pronunciations,
    } = payload;

    if (!assistant_id) return Response.json({ error: 'assistant_id required' }, { status: 400 });

    const VAPI_KEY = Deno.env.get('VAPI_API_KEY');

    // Build tools array from enabled_tools list
    const tools = (enabled_tools || [])
      .map(toolName => TOOL_DEFINITIONS[toolName])
      .filter(Boolean);

    // Always include createBooking
    if (!enabled_tools || !enabled_tools.includes('booking_manager')) {
      tools.unshift(TOOL_DEFINITIONS.booking_manager);
    }

    // Assemble final system prompt
    const finalSystemPrompt = buildSystemPrompt({
      name,
      personality_traits,
      tone_of_voice,
      response_style,
      system_prompt,
      return_customer_greeting,
      recording_disclosure,
      custom_instructions,
      custom_pronunciations,
    });

    const body = {
      name: name || undefined,
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        messages: [{ role: 'system', content: finalSystemPrompt }],
        temperature: temperature ?? 0.5,
        tools,
      },
      voice: {
        provider: '11labs',
        voiceId: voice_id || 'aria',
        speed: voice_speed ?? 1.0,
      },
      firstMessage: greeting_message || undefined,
      ...(max_duration_seconds && { maxDurationSeconds: max_duration_seconds }),
      ...(silence_timeout_seconds && { silenceTimeoutSeconds: silence_timeout_seconds }),
    };

    const res = await fetch(`https://api.vapi.ai/assistant/${assistant_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'VAPI update error', details: data }, { status: 400 });

    return Response.json({ success: true, assistant: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});