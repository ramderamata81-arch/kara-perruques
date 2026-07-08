import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const trackOrderClick = async (productId, productName) => {
  try {
    await addDoc(collection(db, 'order_clicks'), {
      productId,
      productName,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
  } catch (error) {
    console.error("Erreur de tracking", error);
  }
};
