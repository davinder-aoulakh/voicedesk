import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { voice_id, text } = await req.json();
    if (!voice_id) return Response.json({ error: 'voice_id is required' }, { status: 400 });

    const previewText = text || `Hi! I'm your AI assistant. How can I help you today?`;
    const apiKey = Deno.env.get('VAPI_API_KEY');

    // Use ElevenLabs TTS directly via VAPI's proxy or ElevenLabs API
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: previewText,
        model_id: 'eleven_turbo_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs error:', err);
      return Response.json({ error: 'Voice preview unavailable' }, { status: 502 });
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return Response.json({ audio_base64: base64Audio, content_type: 'audio/mpeg' });
  } catch (error) {
    console.error('previewVoice error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});