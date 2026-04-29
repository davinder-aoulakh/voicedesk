/**
 * activateVapiAgent
 *
 * Atomically links a provisioned Twilio phone number to a VAPI assistant
 * and marks the agent as active. Replaces the separate linkVapiPhoneNumber call.
 *
 * Payload: { business_id, assistant_id, phone_number, phone_sid }
 *
 * Steps:
 *  1. POST to VAPI /phone-number to import the Twilio number with assistantId attached
 *  2. On 409 (already imported), list VAPI numbers and PATCH the existing one
 *  3. Persist vapi_phone_number_id to Business
 *  4. Update Agent status to 'active'
 *  5. Return { success, vapi_phone_number_id, phone_number, assistant_id, agent_status }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, assistant_id, phone_number, phone_sid } = await req.json();

    if (!business_id || !assistant_id || !phone_number) {
      return Response.json(
        { error: 'Missing required fields: business_id, assistant_id, phone_number' },
        { status: 400 }
      );
    }

    const VAPI_KEY = Deno.env.get('VAPI_API_KEY');
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    // Step 1: Import Twilio number into VAPI with assistant attached
    const importRes = await fetch('https://api.vapi.ai/phone-number', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'twilio',
        number: phone_number,
        twilioAccountSid: TWILIO_ACCOUNT_SID,
        twilioAuthToken: TWILIO_AUTH_TOKEN,
        assistantId: assistant_id,
      }),
    });

    const importData = await importRes.json();
    let vapiPhoneId;

    if (!importRes.ok) {
      // Step 2: Handle 409 — number already imported, find and patch it
      if (importRes.status === 409 || importData.message?.toLowerCase().includes('already')) {
        const listRes = await fetch('https://api.vapi.ai/phone-number?limit=100', {
          headers: { 'Authorization': `Bearer ${VAPI_KEY}` },
        });
        const listData = await listRes.json();
        const existing = (Array.isArray(listData) ? listData : listData.results || [])
          .find(p => p.number === phone_number);

        if (!existing) {
          return Response.json({ error: 'Phone number not found in VAPI after 409' }, { status: 404 });
        }

        const patchRes = await fetch(`https://api.vapi.ai/phone-number/${existing.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${VAPI_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assistantId: assistant_id }),
        });

        const patchData = await patchRes.json();
        if (!patchRes.ok) {
          return Response.json({ error: patchData.message || 'Failed to patch VAPI phone number' }, { status: 400 });
        }

        vapiPhoneId = existing.id;
      } else {
        return Response.json(
          { error: importData.message || 'Failed to import phone number into VAPI', details: importData },
          { status: 400 }
        );
      }
    } else {
      vapiPhoneId = importData.id;
    }

    // Step 3: Persist vapi_phone_number_id to Business
    await base44.asServiceRole.entities.Business.update(business_id, {
      vapi_phone_number_id: vapiPhoneId,
    });

    // Step 4: Update Agent status to 'active'
    const agents = await base44.asServiceRole.entities.Agent.filter({ business_id });
    if (agents.length) {
      await base44.asServiceRole.entities.Agent.update(agents[0].id, { status: 'active' });
    }

    // Step 5: Return success
    return Response.json({
      success: true,
      vapi_phone_number_id: vapiPhoneId,
      phone_number,
      assistant_id,
      agent_status: 'active',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});