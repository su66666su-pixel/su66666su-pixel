import { supabase } from '../supabase';

/**
 * دالة توزيع العمولة الملكية للوكلاء المعتمدين
 * @param agentId معرف الوكيل (UID)
 * @param amount إجمالي مبلغ الاشتراك المدفوع
 */
export async function distributeCommission(agentId: string, amount: number) {
  try {
    const commissionRate = 0.15; // رفع العمولة إلى 15% للملوك
    const commissionAmount = amount * commissionRate;

    // ملاحظة: يفضل استخدام RPC في Supabase لتجنب تضارب البيانات (Race Conditions)
    // إذا كنت قد أنشأت دالة increment_wallet_balance في قاعدة البيانات
    const { error: rpcError } = await supabase.rpc('increment_agent_balance', {
      agent_uid: agentId,
      inc_amount: commissionAmount
    });

    // كخيار بديل إذا لم تتوفر دالة RPC:
    if (rpcError) {
      console.warn("RPC failed, falling back to standard update. Consider creating increment_agent_balance function.");
      
      // جلب الرصيد الحالي أولاً
      const { data: wallet, error: fetchError } = await supabase
        .from('agent_wallets')
        .select('balance')
        .eq('agent_id', agentId)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (wallet?.balance || 0) + commissionAmount;

      const { error: updateError } = await supabase
        .from('agent_wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (updateError) throw updateError;
    }

    // تسجيل المعاملة في سجل العمولات
    await supabase.from('coin_transactions').insert({
      user_id: agentId,
      amount: commissionAmount,
      transaction_type: 'agent_commission',
      description: `عمولة ملكية من اشتراك بقيمة ${amount} ر.س`
    });

    console.log(`✅ تم تحويل العمولة بنجاح: ${commissionAmount} ر.س إلى الوكيل ${agentId}`);
    return { success: true, amount: commissionAmount };

  } catch (err) {
    console.error("❌ فشل توزيع العمولة:", err);
    return { success: false, error: err };
  }
}
