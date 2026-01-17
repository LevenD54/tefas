import { Fund, FundType } from '../types';

/**
 * TEFAS API CONFIGURATION
 */
// 1. Priority: Vercel Serverless Function (Created in api/funds.js)
const API_ROUTE_URL = "/api/funds";
// 2. Fallback: CORS Proxy (Only used if running locally without Vercel CLI)
const TEFAS_API_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";
const PROXY_URL = "https://corsproxy.io/?"; 

const DB_KEY = 'TEFAS_FUNDS_DB';
const DB_TIMESTAMP_KEY = 'TEFAS_DB_LAST_UPDATE';

export const fetchFunds = async (type: FundType = FundType.ALL): Promise<{ data: Fund[], source: 'api' | 'cache' }> => {
  console.log(`[TEFAS Service] Requesting data for: ${type}`);
  
  try {
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

    // --- STRATEGY 1: Try Vercel API Route (Best for Production) ---
    try {
      console.log("[TEFAS Service] Attempting Vercel API Route...");
      const response = await fetch(API_ROUTE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(payload as any)
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.data) {
          const parsed = parseTefasResponse(result.data);
          saveToDatabase(parsed); // Save to LocalStorage
          return { data: parsed, source: 'api' };
        }
      } else {
        console.warn(`[TEFAS Service] API Route failed: ${response.status}`);
      }
    } catch (e) {
      console.warn("[TEFAS Service] API Route unavailable (likely local dev). Switching to Proxy.");
    }

    // --- STRATEGY 2: Try CORS Proxy (Fallback) ---
    console.log("[TEFAS Service] Attempting CORS Proxy...");
    const targetUrl = PROXY_URL + encodeURIComponent(TEFAS_API_URL);
    const proxyResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams(payload as any)
    });

    if (proxyResponse.ok) {
        const text = await proxyResponse.text();
        // Validate JSON to avoid HTML error pages
        if (text.trim().startsWith('<')) throw new Error("Proxy blocked.");
        
        const result = JSON.parse(text);
        if (result && result.data) {
           const parsed = parseTefasResponse(result.data);
           saveToDatabase(parsed);
           return { data: parsed, source: 'api' };
        }
    }

    throw new Error("Tüm bağlantı yöntemleri başarısız oldu.");

  } catch (error) {
    console.error("[TEFAS Service] Live fetch failed:", error);
    
    // --- STRATEGY 3: Load from "Database" (LocalStorage) ---
    const cached = loadFromDatabase();
    if (cached.length > 0) {
      console.log("[TEFAS Service] Serving from Local Database cache.");
      return { data: cached, source: 'cache' };
    }

    throw error;
  }
};

// --- DATABASE FUNCTIONS (LocalStorage) ---

const saveToDatabase = (data: Fund[]) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    localStorage.setItem(DB_TIMESTAMP_KEY, new Date().toISOString());
  } catch (e) {
    console.error("Database Save Failed (Quota exceeded?)", e);
  }
};

const loadFromDatabase = (): Fund[] => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const getLastDbUpdate = (): Date | null => {
  const ts = localStorage.getItem(DB_TIMESTAMP_KEY);
  return ts ? new Date(ts) : null;
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