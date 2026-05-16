import { createClient } from '@supabase/supabase-js'

// جلب المتغيرات سواء من السيرفر أو المحيط المحلي
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://coxcxznylmlpxhusynmj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY 

if (!supabaseKey) {
    console.error("⚠️ تنبيه السيادة: المفتاح الملكي لـ Supabase غير معرف في إعدادات الاستضافة بعد!");
}

export const supabase = createClient(supabaseUrl, supabaseKey || '')
