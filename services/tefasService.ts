import { Fund, FundType } from '../types';

/**
 * TEFAS API CONFIGURATION
 */
const TEFAS_API_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";

// Primary Proxy
const PROXY_URL = "https://corsproxy.io/?"; 

export const fetchFunds = async (type: FundType = FundType.ALL): Promise<Fund[]> => {
  console.log(`[TEFAS Service] Starting fetch request for type: ${type}`);
  
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

    const targetUrl = PROXY_URL + encodeURIComponent(TEFAS_API_URL);
    console.log(`[TEFAS Service] Fetching from: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams(payload as any)
    });

    console.log(`[TEFAS Service] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Sunucu Hatası: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    console.log(`[TEFAS Service] Response length: ${text.length} chars`);

    // Check if response is HTML (Common proxy error page)
    if (text.trim().startsWith('<')) {
      console.error("[TEFAS Service] Received HTML instead of JSON. Proxy might be blocked or returning an error page.");
      console.error("Preview:", text.substring(0, 200));
      throw new Error("Proxy servisi HTML hata sayfası döndürdü. (Muhtemelen erişim engellendi)");
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("[TEFAS Service] JSON Parse Error:", e);
      throw new Error("TEFAS'tan gelen veri JSON formatında değil.");
    }

    if (result && result.data && Array.isArray(result.data)) {
       const parsed = parseTefasResponse(result.data);
       console.log(`[TEFAS Service] Successfully parsed ${parsed.length} funds.`);
       return parsed;
    } else {
       console.warn("[TEFAS Service] Unexpected JSON structure:", result);
       // TEFAS sometimes returns empty data if no funds match, but structure should be there.
       if (result.data === null) return []; 
       throw new Error("TEFAS verisi beklendiği gibi değil (Veri yapısı bozuk).");
    }

  } catch (error: any) {
    console.error("[TEFAS Service] General Error:", error);
    throw new Error(error.message || "Bilinmeyen bir iletişim hatası oluştu.");
  }
};

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