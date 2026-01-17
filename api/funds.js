export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const TEFAS_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";

  // Handle CORS for the frontend
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse the body from the frontend request
    const bodyText = await request.text();

    // Forward the request to TEFAS server-side
    const tefasResponse = await fetch(TEFAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.tefas.gov.tr/FonKarsilastirma.aspx',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: bodyText
    });

    if (!tefasResponse.ok) {
      throw new Error(`TEFAS responded with ${tefasResponse.status}`);
    }

    const data = await tefasResponse.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 's-maxage=600, stale-while-revalidate=300' // Cache at Vercel edge for 10 mins
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}