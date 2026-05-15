import { 
  doc, 
  runTransaction, 
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

/**
 * Handles the sovereign gift purchase process.
 * Deducts gold points from the user's royal wallet.
 */
export async function handleGiftPurchase(userId: string, giftPrice: number): Promise<boolean> {
  const walletRef = doc(db, 'wallets', userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) {
        // If wallet doesn't exist, check if we should create it or fail
        // For this system, we'll assume a wallet must be initialized
        throw new Error('Royal wallet not found! Please initialize your sovereign account.');
      }

      const currentBalance = walletDoc.data().balance;

      if (currentBalance >= giftPrice) {
        const newBalance = currentBalance - giftPrice;
        
        transaction.update(walletRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });

        return true;
      } else {
         return false;
      }
    });

    if (!result) {
      alert("رصيدك غير كافٍ! اشحن محفظتك الذهبية لتتمكن من إرسال الهدايا الملكية.");
    } else {
      console.log('تمت العملية بنجاح ملكي! ✨');
    }

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `wallets/${userId}`);
    return false;
  }
}
