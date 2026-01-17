import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// Initialize Supabase Client
// Note: In Vercel, ensure SUPABASE_URL and SUPABASE_KEY are set in Environment Variables.
// Fallback values are used here based on your prompt, but Env vars are recommended.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://tbiedjllogbhhtjvammb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(request) {
  const TEFAS_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";

  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const bodyText = await request.text();
    console.log("Fetching data from TEFAS...");

    // 1. Attempt to fetch fresh data from TEFAS
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

    if (tefasResponse.ok) {
      const data = await tefasResponse.json();
      
      if (data && data.data && Array.isArray(data.data)) {
        console.log(`TEFAS success. Got ${data.data.length} records. Updating DB...`);
        
        // Transform for DB
        const dbRows = data.data.map(item => ({
          code: item.FONKODU,
          title: item.FONUNADI,
          type: 'Yatırım Fonu',
          price: item.FIYAT,
          daily_return: item.GUNLUKGETIRI,
          weekly_return: item.HAFTALIKGETIRI,
          monthly_return: item.AYLIKGETIRI,
          three_month_return: item.UCAYLIKGETIRI,
          six_month_return: item.ALTIAYLIKGETIRI,
          ytd_return: item.YILBASI,
          yearly_return: item.YILLIKGETIRI,
          three_year_return: item.UCYILLIKGETIRI,
          fund_size: item.FONTOPLAMDEGER,
          investor_count: item.KISISAYISI,
          last_updated: new Date().toISOString()
        }));

        // Upsert to Supabase (Save fresh data)
        const { error: dbError } = await supabase
          .from('tefas_funds')
          .upsert(dbRows, { onConflict: 'code' });

        if (dbError) {
          console.error("Supabase Upsert Error:", dbError);
        }

        return new Response(JSON.stringify({ data: data.data, source: 'tefas-live' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn(`TEFAS Fetch Failed: ${tefasResponse.status}`);
    }

    // 2. Fallback: If TEFAS failed, fetch from Supabase
    console.log("Falling back to Supabase database...");
    const { data: dbData, error: fetchError } = await supabase
      .from('tefas_funds')
      .select('*');

    if (fetchError) {
      throw new Error(`Database fetch failed: ${fetchError.message}`);
    }

    // Transform DB snake_case back to TEFAS UPPERCASE format for frontend compatibility
    const mappedData = dbData.map(row => ({
      FONKODU: row.code,
      FONUNADI: row.title,
      FIYAT: row.price,
      GUNLUKGETIRI: row.daily_return,
      HAFTALIKGETIRI: row.weekly_return,
      AYLIKGETIRI: row.monthly_return,
      UCAYLIKGETIRI: row.three_month_return,
      ALTIAYLIKGETIRI: row.six_month_return,
      YILBASI: row.ytd_return,
      YILLIKGETIRI: row.yearly_return,
      UCYILLIKGETIRI: row.three_year_return,
      FONTOPLAMDEGER: row.fund_size,
      KISISAYISI: row.investor_count
    }));

    return new Response(JSON.stringify({ data: mappedData, source: 'database-fallback' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Handler Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}