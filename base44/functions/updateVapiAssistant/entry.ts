import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { assistant_id, name, voice_id, system_prompt, greeting_message } = await req.json();

    if (!assistant_id) return Response.json({ error: 'assistant_id required' }, { status: 400 });

    const VAPI_KEY = Deno.env.get('VAPI_API_KEY');

    const body = {};
    if (name) body.name = name;
    if (voice_id) body.voice = { provider: '11labs', voiceId: voice_id };
    if (system_prompt) body.model = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: system_prompt }],
    };
    if (greeting_message) body.firstMessage = greeting_message;

    const res = await fetch(`https://api.vapi.ai/assistant/${assistant_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.message || 'VAPI update error' }, { status: 400 });

    return Response.json({ success: true, assistant: data });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});