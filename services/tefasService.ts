import { Fund, FundType } from '../types';

/**
 * TEFAS API CONFIGURATION
 */
const TEFAS_API_URL = "https://www.tefas.gov.tr/api/DB/BindComparisonFundReturns";
// Using a public CORS proxy. If this is deployed to a backend capable environment, 
// you should replace this with your own server-side proxy.
const PROXY_URL = "https://corsproxy.io/?"; 

export const fetchFunds = async (type: FundType = FundType.ALL): Promise<Fund[]> => {
  try {
    // Prepare dates
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const dateToString = (d: Date) => d.toISOString().split('T')[0];

    // Payload structure required by TEFAS ASP.NET backend
    const payload = {
      calismatipi: "2", // 2 usually means 'Returns' based comparison
      fontip: "YAT",    // 'YAT' = Yatırım Fonları
      sfontip: mapFundTypeToCode(type),
      bastar: dateToString(thirtyDaysAgo),
      bittar: dateToString(today),
      kurucukod: ""
    };

    console.log("Fetching from TEFAS via Proxy...", payload);

    const response = await fetch(PROXY_URL + encodeURIComponent(TEFAS_API_URL), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: new URLSearchParams(payload as any)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    if (result && result.data && Array.isArray(result.data)) {
       return parseTefasResponse(result.data);
    } else {
       console.warn("TEFAS response format unexpected:", result);
       return [];
    }

  } catch (error) {
    console.error("TEFAS Fetch Error:", error);
    // Re-throw to be handled by the UI (showing error state instead of mock data)
    throw error;
  }
};

// Helper: Map UI Enum to TEFAS 'sfontip' codes
// These codes are estimates based on common TEFAS parameters. 
// "TUM" is safest.
const mapFundTypeToCode = (type: FundType): string => {
  switch (type) {
    case FundType.EQUITY: return "HYF"; // Hisse Senedi (Guess, often needs specific filter)
    case FundType.GOLD: return "ALT";   // Altın
    case FundType.BOND: return "BGT";   // Borçlanma
    default: return "TUM";              // Tümü
  }
};

// Helper: Parse real API response into our App's format
const parseTefasResponse = (items: any[]): Fund[] => {
    return items.map((item: any) => ({
        code: item.FONKODU,
        title: item.FONUNADI,
        type: 'Yatırım Fonu', // The API might not return the friendly type name directly in this endpoint
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