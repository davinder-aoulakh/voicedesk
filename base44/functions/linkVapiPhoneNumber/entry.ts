/**
 * linkVapiPhoneNumber
 * 
 * Links a provisioned Twilio phone number to a VAPI assistant so that
 * inbound calls on that number are answered by the AI agent.
 *
 * Flow:
 *  1. Import the Twilio number into VAPI (creates a VAPI PhoneNumber resource)
 *  2. Attach the VAPI assistant to that phone number
 *  3. Persist the VAPI phone number ID back to the Business record
 *
 * Payload:
 *  { business_id, assistant_id, twilio_phone_number, twilio_phone_sid }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, assistant_id, twilio_phone_number, twilio_phone_sid } = await req.json();

    if (!business_id || !assistant_id || !twilio_phone_number || !twilio_phone_sid) {
      return Response.json(
        { error: 'Missing required fields: business_id, assistant_id, twilio_phone_number, twilio_phone_sid' },
        { status: 400 }
      );
    }

    const VAPI_KEY = Deno.env.get('VAPI_API_KEY');
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    // Step 1: Import the Twilio number into VAPI
    const importRes = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'twilio',
        number: twilio_phone_number,
        twilioAccountSid: TWILIO_ACCOUNT_SID,
        twilioAuthToken: TWILIO_AUTH_TOKEN,
        // Attach the assistant immediately on import
        assistantId: assistant_id,
      }),
    });

    const importData = await importRes.json();

    if (!importRes.ok) {
      // If phone number already imported, fetch it and patch instead
      if (importData.message?.includes('already') || importRes.status === 409) {
        return await patchExistingVapiPhone(VAPI_KEY, twilio_phone_number, assistant_id, business_id, base44);
      }
      return Response.json(
        { error: importData.message || 'Failed to import phone number into VAPI', details: importData },
        { status: 400 }
      );
    }

    const vapiPhoneId = importData.id;

    // Step 2: Persist VAPI phone number ID to Business record
    await base44.asServiceRole.entities.Business.update(business_id, {
      vapi_phone_number_id: vapiPhoneId,
    });

    return Response.json({
      success: true,
      vapi_phone_number_id: vapiPhoneId,
      phone_number: twilio_phone_number,
      assistant_id,
      vapi_phone: importData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * If the number was already imported into VAPI, find it by number and patch the assistantId.
 */
async function patchExistingVapiPhone(VAPI_KEY, phoneNumber, assistantId, businessId, base44) {
  // List all VAPI phone numbers and find the matching one
  const listRes = await fetch('https://api.vapi.ai/phone-number?limit=100', {
    headers: { 'Authorization': `Bearer ${VAPI_KEY}` },
  });
  const listData = await listRes.json();

  const existing = (Array.isArray(listData) ? listData : listData.results || [])
    .find(p => p.number === phoneNumber);

  if (!existing) {
    return Response.json({ error: 'Phone number not found in VAPI' }, { status: 404 });
  }

  // Patch to attach assistant
  const patchRes = await fetch(`https://api.vapi.ai/phone-number/${existing.id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${VAPI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assistantId }),
  });

  const patchData = await patchRes.json();
  if (!patchRes.ok) {
    return Response.json({ error: patchData.message || 'Failed to patch VAPI phone number', details: patchData }, { status: 400 });
  }

  await base44.asServiceRole.entities.Business.update(businessId, {
    vapi_phone_number_id: existing.id,
  });

  return Response.json({
    success: true,
    vapi_phone_number_id: existing.id,
    phone_number: phoneNumber,
    assistant_id: assistantId,
    vapi_phone: patchData,
  });
}