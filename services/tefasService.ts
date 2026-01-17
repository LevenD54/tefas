import { Fund, FundType } from '../types';

/**
 * TEFAS API CONFIGURATION
 */
const API_ROUTE_URL = "/api/funds";

export const fetchFunds = async (type: FundType = FundType.ALL): Promise<{ data: Fund[], source: 'api' | 'cache' | 'database' }> => {
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

    const response = await fetch(API_ROUTE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload as any)
    });

    if (!response.ok) {
      let errorInfo = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) {
          errorInfo = `Stage: ${errorJson.stage} | Error: ${errorJson.error}`;
          if (errorJson.detail) errorInfo += ` | Detail: ${errorJson.detail}`;
        }
      } catch (e) {
        // If JSON parse fails, try text
        const text = await response.text();
        if (text) errorInfo += ` | Raw: ${text.substring(0, 100)}`;
      }
      throw new Error(errorInfo);
    }

    const result = await response.json();

    if (result && result.data) {
      const parsed = parseTefasResponse(result.data);
      return { 
        data: parsed, 
        source: result.source === 'tefas-live' ? 'api' : 'database' 
      };
    } else {
      throw new Error("API boş yanıt döndürdü.");
    }

  } catch (error: any) {
    console.error("[TEFAS Service] Error:", error);
    throw new Error(error.message || "Bilinmeyen hata");
  }
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