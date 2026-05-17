import { createClient } from '@supabase/supabase-js'

// 1. تعريف المفاتيح السيادية لشبكة SNNS
const SUPABASE_URL = "https://coxcxznylmlpxhusynmj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveGN4em55bG1scHhodXN5bm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzQ4OTgsImV4cCI6MjA5NDQxMDg5OH0.dwc35-XacGc1gCPxuY6CCb7fZtmmTwXxFnHV_pQZSqg";

// 2. تفعيل المحرك اللحظي والأمني بالربط المباشر
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true, // الحفاظ على تسجيل دخول المستخدم ناعم وتلقائي
        autoRefreshToken: true
    }
});

// تصدير المحرك ليعمل في كامل صفحات الموقع (الهبوط، الشات، الآدمن)
(window as any).supabase = supabase;
