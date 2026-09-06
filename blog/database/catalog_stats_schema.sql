-- ==============================================================================
-- סכמת מסד נתונים עבור סטטיסטיקות ולידים בקטלוג אנפי (Supabase)
-- ==============================================================================
-- הוראות הפעלה:
-- 1. היכנס ל-Dashboard של הפרויקט שלך ב-Supabase (פרויקט abqracafkjerlcemqnva)
-- 2. בתפריט הצד לחץ על "SQL Editor"
-- 3. לחץ על "New query", הדבק את כל הקוד שלהלן ולחץ "Run"
-- ==============================================================================

-- 1. טבלת אירועים וסטטיסטיקות (צפיות, הורדות קטלוג, לחיצות וואטסאפ)
CREATE TABLE IF NOT EXISTS public.catalog_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    device TEXT DEFAULT 'Desktop',
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- אינדקסים לביצועים מהירים בשאילתות לפי תאריך וסוג אירוע
CREATE INDEX IF NOT EXISTS idx_catalog_events_created_at ON public.catalog_events(created_at);
CREATE INDEX IF NOT EXISTS idx_catalog_events_type ON public.catalog_events(event_type);

-- הפעלת Row Level Security (RLS)
ALTER TABLE public.catalog_events ENABLE ROW LEVEL SECURITY;

-- מדיניות: מתן הרשאה לכל גולש (anon) לתעד אירוע
CREATE POLICY "Allow public insert to catalog_events" ON public.catalog_events
    FOR INSERT WITH CHECK (true);

-- מדיניות: מתן הרשאת קריאה עבור דף הסטטיסטיקות stats.html
CREATE POLICY "Allow public read to catalog_events" ON public.catalog_events
    FOR SELECT USING (true);


-- 2. טבלת לידים ופניות מטופס יצירת קשר בקטלוג
CREATE TABLE IF NOT EXISTS public.catalog_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    category TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- אינדקס לתאריכי יצירת לידים
CREATE INDEX IF NOT EXISTS idx_catalog_leads_created_at ON public.catalog_leads(created_at);

-- הפעלת Row Level Security (RLS)
ALTER TABLE public.catalog_leads ENABLE ROW LEVEL SECURITY;

-- מדיניות: מתן הרשאה לכל גולש להגיש טופס ליד
CREATE POLICY "Allow public insert to catalog_leads" ON public.catalog_leads
    FOR INSERT WITH CHECK (true);

-- מדיניות: קריאת לידים עבור ממשק הניהול / הסטטיסטיקות
CREATE POLICY "Allow public read to catalog_leads" ON public.catalog_leads
    FOR SELECT USING (true);
