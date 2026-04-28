import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COUNTRY_AREA_CODES = {
  AU: { countryCode: 'AU', type: 'local' },
  US: { countryCode: 'US', type: 'local' },
  GB: { countryCode: 'GB', type: 'local' },
  NZ: { countryCode: 'NZ', type: 'local' },
  CA: { countryCode: 'CA', type: 'local' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { business_id, country = 'AU', phone_number: requestedNumber } = await req.json();

    const ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const credentials = btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`);
    const countryConfig = COUNTRY_AREA_CODES[country] || COUNTRY_AREA_CODES['AU'];

    let phoneNumber;

    if (requestedNumber) {
      // Use the specific number the user selected
      phoneNumber = requestedNumber;
    } else {
      // Auto-select: search for first available number
      const searchRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/AvailablePhoneNumbers/${countryConfig.countryCode}/Local.json?VoiceEnabled=true&SmsEnabled=true&Limit=5`,
        { headers: { 'Authorization': `Basic ${credentials}` } }
      );
      const searchData = await searchRes.json();
      if (!searchRes.ok || !searchData.available_phone_numbers?.length) {
        return Response.json({ error: 'No available numbers found', details: searchData }, { status: 400 });
      }
      phoneNumber = searchData.available_phone_numbers[0].phone_number;
    }

    // Purchase the number
    const purchaseRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ PhoneNumber: phoneNumber }).toString(),
      }
    );

    const purchaseData = await purchaseRes.json();
    if (!purchaseRes.ok) {
      return Response.json({ error: purchaseData.message || 'Purchase failed', details: purchaseData }, { status: 400 });
    }

    return Response.json({
      phone_number: purchaseData.phone_number,
      phone_sid: purchaseData.sid,
      friendly_name: purchaseData.friendly_name,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});