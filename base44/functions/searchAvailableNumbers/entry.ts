import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const SUPPORTED_COUNTRIES = {
  AU: { name: 'Australia',    flag: '🇦🇺', type: 'Local' },
  US: { name: 'United States',flag: '🇺🇸', type: 'Local' },
  GB: { name: 'United Kingdom',flag: '🇬🇧', type: 'Local' },
  NZ: { name: 'New Zealand',  flag: '🇳🇿', type: 'Local' },
  CA: { name: 'Canada',       flag: '🇨🇦', type: 'Local' },
  IE: { name: 'Ireland',      flag: '🇮🇪', type: 'Local' },
  DE: { name: 'Germany',      flag: '🇩🇪', type: 'Local' },
  FR: { name: 'France',       flag: '🇫🇷', type: 'Local' },
  NL: { name: 'Netherlands',  flag: '🇳🇱', type: 'Local' },
  SE: { name: 'Sweden',       flag: '🇸🇪', type: 'Local' },
  NO: { name: 'Norway',       flag: '🇳🇴', type: 'Local' },
  DK: { name: 'Denmark',      flag: '🇩🇰', type: 'Local' },
  FI: { name: 'Finland',      flag: '🇫🇮', type: 'Local' },
  CH: { name: 'Switzerland',  flag: '🇨🇭', type: 'Local' },
  AT: { name: 'Austria',      flag: '🇦🇹', type: 'Local' },
  BE: { name: 'Belgium',      flag: '🇧🇪', type: 'Local' },
  PT: { name: 'Portugal',     flag: '🇵🇹', type: 'Local' },
  ES: { name: 'Spain',        flag: '🇪🇸', type: 'Local' },
  IT: { name: 'Italy',        flag: '🇮🇹', type: 'Local' },
  PL: { name: 'Poland',       flag: '🇵🇱', type: 'Local' },
  SG: { name: 'Singapore',    flag: '🇸🇬', type: 'Local' },
  HK: { name: 'Hong Kong',    flag: '🇭🇰', type: 'Local' },
  JP: { name: 'Japan',        flag: '🇯🇵', type: 'Local' },
  ZA: { name: 'South Africa', flag: '🇿🇦', type: 'Local' },
  IN: { name: 'India',        flag: '🇮🇳', type: 'Local' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { country_code = 'AU', page = 0, page_size = 10 } = await req.json();

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken  = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      return Response.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    const upperCode = country_code.toUpperCase();
    if (!SUPPORTED_COUNTRIES[upperCode]) {
      return Response.json({ error: `Country code '${upperCode}' is not supported` }, { status: 400 });
    }

    const limit = Math.min(page_size || 10, 30);
    const params = new URLSearchParams({
      VoiceEnabled: 'true',
      SmsEnabled:   'true',
      Limit:        String(limit),
    });

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/${upperCode}/Local.json?${params}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.message || 'Twilio API error', details: data }, { status: 400 });
    }

    const numbers = (data.available_phone_numbers || []).map(n => ({
      phone_number:  n.phone_number,
      friendly_name: n.friendly_name,
      region:        n.locality || n.region || n.iso_country || '',
      capabilities: {
        voice: n.capabilities?.voice === true,
        sms:   n.capabilities?.SMS === true || n.capabilities?.sms === true,
      },
      monthly_cost: '$2.00',
      country_code: upperCode,
      country_name: SUPPORTED_COUNTRIES[upperCode].name,
      country_flag: SUPPORTED_COUNTRIES[upperCode].flag,
    }));

    return Response.json({
      numbers,
      total_count: numbers.length,
      country_code: upperCode,
      country_info: SUPPORTED_COUNTRIES[upperCode],
      supported_countries: Object.entries(SUPPORTED_COUNTRIES).map(([code, info]) => ({
        code,
        ...info,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});