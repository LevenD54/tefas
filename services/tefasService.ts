import { createClient } from '@supabase/supabase-js';
import { Fund, FundType } from '../types';

// --- CONFIGURATION ---
const SUPABASE_URL = "https://tbiedjllogbhhtjvammb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiaWVkamxsb2diaGh0anZhbW1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTk0MjIsImV4cCI6MjA4MzYzNTQyMn0.Ie8jIagJRegLTydzM7TicXWyLapKAYGQ8hh-oHI-dmA";

const API_ROUTE_URL = "/api/funds";
const TEFAS_API_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";
const PROXY_URL = "https://corsproxy.io/?";

// Initialize Supabase Client for direct fallback
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchFunds = async (type: FundType = FundType.ALL): Promise<{ data: Fund[], source: 'api' | 'proxy' | 'database' }> => {
  console.log(`[TEFAS Service] Requesting data for: ${type}`);
  const errors: string[] = [];

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const dateToString = (d: Date) => d.toISOString().split('T')[0];

  const payload = {
    calismatipi: "2",
    fontip: "YAT",
    sfontip: mapFundTypeToCode(type),
    bastar: dateToString(thirtyDaysAgo),
    bittar: dateToString(today),
    kurucukod: ""
  };

  // --- STAGE 1: Try Vercel API Route (Backend Proxy) ---
  try {
    console.log("Attempt 1: Vercel API Route...");
    const response = await fetch(API_ROUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload as any)
    });

    if (response.ok) {
      const result = await response.json();
      if (result && result.data) {
        return { data: parseTefasResponse(result.data), source: 'api' };
      }
    }
    errors.push(`API Route Failed: ${response.status} ${response.statusText}`);
  } catch (e: any) {
    console.warn("API Route failed:", e);
    errors.push(`API Route Error: ${e.message}`);
  }

  // --- STAGE 2: Try CORS Proxy (Client-side Proxy) ---
  try {
    console.log("Attempt 2: CORS Proxy...");
    const targetUrl = PROXY_URL + encodeURIComponent(TEFAS_API_URL);
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams(payload as any)
    });

    if (response.ok) {
      const text = await response.text();
      // Basic check if we got HTML (error page) instead of JSON
      if (text.trim().startsWith('<')) {
        throw new Error("Proxy returned HTML instead of JSON");
      }
      
      const result = JSON.parse(text);
      if (result && result.data) {
        return { data: parseTefasResponse(result.data), source: 'proxy' };
      }
    }
    errors.push(`Proxy Failed: ${response.status}`);
  } catch (e: any) {
    console.warn("Proxy failed:", e);
    errors.push(`Proxy Error: ${e.message}`);
  }

  // --- STAGE 3: Try Direct Supabase Database Read ---
  try {
    console.log("Attempt 3: Direct Supabase Read...");
    // Direct select from DB. Note: This assumes the data was populated at some point.
    // If the filters are complex, we might just get ALL and filter in JS, or keep it simple.
    // Here we get everything to ensure we show something.
    const { data: dbData, error } = await supabase
      .from('tefas_funds')
      .select('*');

    if (error) throw error;
    
    if (dbData && dbData.length > 0) {
      // Convert DB columns (snake_case) to our App format
      const mappedData = dbData.map(row => ({
        code: row.code,
        title: row.title,
        type: 'Yatırım Fonu',
        price: row.price,
        dailyReturn: row.daily_return,
        weeklyReturn: row.weekly_return,
        monthlyReturn: row.monthly_return,
        threeMonthReturn: row.three_month_return,
        sixMonthReturn: row.six_month_return,
        ytdReturn: row.ytd_return,
        yearlyReturn: row.yearly_return,
        threeYearReturn: row.three_year_return,
        fundSize: row.fund_size,
        investorCount: row.investor_count
      }));
      
      return { data: mappedData, source: 'database' };
    }
    errors.push("Database returned no records.");

  } catch (e: any) {
    console.warn("Database failed:", e);
    errors.push(`Database Error: ${e.message}`);
  }

  // If all failed
  throw new Error(`Bağlantı yöntemlerinin hepsi başarısız oldu:\n${errors.join('\n')}`);
};

export const getLastDbUpdate = (): Date | null => {
  return new Date();
};

// --- HELPERS ---

const mapFundTypeToCode = (type: FundType): string => {
  switch (type) {
    case FundType.EQUITY: return "HYF"; 
    case FundType.GOLD: return "ALT";   
    case FundType.BOND: return "BGT";   
    default: return "TUM";              
  }
};

const parseTefasResponse = (items: any[]): Fund[] => {
    return items.map((item: any) => ({
        code: item.FONKODU,
        title: item.FONUNADI,
        type: 'Yatırım Fonu', 
        price: item.FIYAT,
        dailyReturn: item.GUNLUKGETIRI || 0,
        weeklyReturn: item.HAFTALIKGETIRI || 0, 
        monthlyReturn: item.AYLIKGETIRI || 0,
        threeMonthReturn: item.UCAYLIKGETIRI || 0,
        sixMonthReturn: item.ALTIAYLIKGETIRI || 0,
        ytdReturn: item.YILBASI || 0,
        yearlyReturn: item.YILLIKGETIRI || 0,
        threeYearReturn: item.UCYILLIKGETIRI || 0, 
        fundSize: item.FONTOPLAMDEGER || 0,
        investorCount: item.KISISAYISI || 0
    })) as Fund[];
};