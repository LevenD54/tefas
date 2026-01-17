export interface Fund {
  code: string;
  title: string;
  type: string;
  price: number;
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  threeMonthReturn: number;
  sixMonthReturn: number;
  ytdReturn: number; // Yılbaşından Bugüne (Year to Date)
  yearlyReturn: number;
  threeYearReturn: number;
  fundSize: number;
  investorCount: number;
}

export enum FundType {
  ALL = "Tümü",
  EQUITY = "Hisse Senedi",
  GOLD = "Altın",
  BOND = "Borçlanma Araçları",
  MIXED = "Karma & Değişken"
}

export type SortField = 'code' | 'price' | 'dailyReturn' | 'weeklyReturn' | 'monthlyReturn' | 'threeMonthReturn' | 'sixMonthReturn' | 'ytdReturn' | 'yearlyReturn' | 'threeYearReturn';
export type SortDirection = 'asc' | 'desc';