import { supabase } from '../supabase';

/**
 * دالة إرسال طلب المتابعة أو الحظر السيادي
 * @param actionType 'follow' | 'block'
 * @param targetUserId UUID of the target user
 * @param showToast Function to display feedback
 */
export async function handleUserAction(
    actionType: 'follow' | 'block', 
    targetUserId: string,
    showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'royal') => void
) {
    try {
        // 1. جلب معرف حسابك الحالي من سوبابيز (UUID)
        const { data: { user: myUser } } = await supabase.auth.getUser();
        if (!myUser) {
            showToast("فضلاً سجل دخولك أولاً يا قائد", 'info');
            return;
        }
        const myId = myUser.id;

        // 2. التحقق من أن معرف الشخص الآخر هو UUID صالح وليس نصاً عشوائياً
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(targetUserId)) {
            console.error("❌ المعرف المستهدف ليس من نوع UUID صالح لـ Supabase:", targetUserId);
            showToast("عذراً، هذا المستخدم مسجل بنظام قديم، يحتاج لتسجيل الدخول مجدداً عبر قوقل لتفعيل حسابه السيادي.", 'error');
            return;
        }

        // 3. تنفيذ الإجراء المختار في قاعدة البيانات
        if (actionType === 'follow') {
            const { error } = await supabase
                .from('user_follows')
                .insert({ follower_id: myId, following_id: targetUserId });

            if (!error) {
                showToast("👑 تم إرسال طلب المتابعة بنجاح!", 'royal');
            } else {
                if (error.code === '23505') {
                    showToast("أنت تتابع هذا الملك بالفعل! 🏰", 'info');
                } else {
                    console.error("فشل طلب المتابعة:", error.message);
                    showToast("فشل طلب المتابعة: " + error.message, 'error');
                }
            }
        }
        
        if (actionType === 'block') {
            const { error } = await supabase
                .from('user_blocks')
                .insert({ blocker_id: myId, blocked_id: targetUserId });

            if (!error) {
                showToast("🚫 تم حظر المستخدم بنجاح.", 'success');
            } else {
                if (error.code === '23505') {
                    showToast("هذا المستخدم محظور مسبقاً.", 'info');
                } else {
                    console.error("فشل الحظر:", error.message);
                    showToast("فشل الحظر: " + error.message, 'error');
                }
            }
        }
    } catch (err: any) {
        console.error("User action failed:", err);
        showToast("حدث خطأ غير متوقع: " + err.message, 'error');
    }
}
