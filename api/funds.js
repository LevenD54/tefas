import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Credentials from environment or fallback to provided keys
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tbiedjllogbhhtjvammb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWVkamxsb2diaGh0anZhbW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTk0MjIsImV4cCI6MjA4MzYzNTQyMn0.Ie8jIagJRegLTydzM7TicXWyLapKAYGQ8hh-oHI-dmA";

export default async function handler(request) {
  // 1. Check Method
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed', detail: 'Only POST requests are accepted.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  let stage = 'INIT';
  let debugLog = [];

  try {
    // 2. Initialize Supabase
    stage = 'DB_INIT';
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // 3. Parse Request Body
    stage = 'PARSE_BODY';
    const bodyText = await request.text();
    
    // 4. Fetch from TEFAS
    stage = 'TEFAS_FETCH';
    const TEFAS_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";
    debugLog.push("Attempting to fetch from TEFAS...");

    let tefasData = null;

    try {
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
                tefasData = data.data;
                debugLog.push(`TEFAS success. Got ${tefasData.length} records.`);
            }
        } else {
            debugLog.push(`TEFAS Failed with Status: ${tefasResponse.status}`);
        }
    } catch (tefasError) {
        debugLog.push(`TEFAS Fetch Error: ${tefasError.message}`);
    }

    // 5. If TEFAS returned data, update Supabase
    if (tefasData) {
        stage = 'SUPABASE_UPSERT';
        const dbRows = tefasData.map(item => ({
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

        const { error: dbError } = await supabase
          .from('tefas_funds')
          .upsert(dbRows, { onConflict: 'code' });

        if (dbError) {
          debugLog.push(`Supabase Upsert Warning: ${dbError.message}`);
        } else {
          debugLog.push("Supabase updated successfully.");
        }

        return new Response(JSON.stringify({ 
          data: tefasData, 
          source: 'tefas-live',
          debug: debugLog 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 6. Fallback to Supabase Read
    stage = 'SUPABASE_FALLBACK';
    debugLog.push("Falling back to Supabase read...");
    
    const { data: dbData, error: fetchError } = await supabase
      .from('tefas_funds')
      .select('*');

    if (fetchError) {
      throw new Error(`Database fetch failed: ${fetchError.message} (Code: ${fetchError.code})`);
    }

    if (!dbData || dbData.length === 0) {
      throw new Error("Database is empty and TEFAS is unreachable.");
    }

    // Map DB columns back to TEFAS format for frontend compatibility
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

    return new Response(JSON.stringify({ 
      data: mappedData, 
      source: 'database-fallback',
      debug: debugLog
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Handler Error:", error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      stage: stage,
      debug: debugLog
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}