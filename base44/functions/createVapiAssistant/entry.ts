import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, name, voice_id, system_prompt, greeting_message } = await req.json();

    const VAPI_KEY = Deno.env.get('VAPI_API_KEY');

    const body = {
      name: name || 'AI Receptionist',
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system_prompt || 'You are a helpful AI receptionist.' }],
      },
      voice: {
        provider: '11labs',
        voiceId: voice_id || 'aria',
      },
      firstMessage: greeting_message || `Hi! You've reached us. How can I help you today?`,
      endCallMessage: 'Thank you for calling. Have a great day!',
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en',
      },
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