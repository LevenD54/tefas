-- Supabase SQL Editor üzerinden bu kodu çalıştırarak tabloyu oluşturabilirsiniz.

CREATE TABLE IF NOT EXISTS public.tefas_funds (
    code TEXT PRIMARY KEY,       -- Fon Kodu (Örn: AFT, TCD)
    title TEXT,                  -- Fon Adı
    type TEXT,                   -- Fon Tipi
    price NUMERIC,               -- Fiyat
    daily_return NUMERIC,        -- Günlük Getiri
    weekly_return NUMERIC,       -- Haftalık Getiri
    monthly_return NUMERIC,      -- Aylık Getiri
    three_month_return NUMERIC,  -- 3 Aylık Getiri
    six_month_return NUMERIC,    -- 6 Aylık Getiri
    ytd_return NUMERIC,          -- Yılbaşı Getiri
    yearly_return NUMERIC,       -- Yıllık Getiri
    three_year_return NUMERIC,   -- 3 Yıllık Getiri
    fund_size NUMERIC,           -- Fon Toplam Değer
    investor_count INTEGER,      -- Yatırımcı Sayısı
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) -- Son Güncelleme
);

-- İsteğe bağlı: Güvenlik politikalarını (RLS) açmak isterseniz
ALTER TABLE public.tefas_funds ENABLE ROW LEVEL SECURITY;

-- Herkesin okumasına izin ver (Anon Key ile okuma için)
CREATE POLICY "Enable read access for all users" ON public.tefas_funds
FOR SELECT USING (true);

-- Sadece servis rolünün (backend) yazmasına izin ver (veya anon key'e geçici izin ver)
CREATE POLICY "Enable insert for authenticated users only" ON public.tefas_funds
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on email" ON public.tefas_funds
FOR UPDATE USING (true);
