import React from 'react';
import { Share2 } from 'lucide-react';

const ShareButton = ({ product }) => {
  const handleShare = () => {
    const productUrl = window.location.href;
    const text = `Regarde cette perruque : ${product.nom}\n${productUrl}`;
    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button 
      onClick={handleShare}
      className="w-full bg-white hover:bg-brand-light border-2 border-brand-light text-brand-dark font-bold py-4 px-6 rounded-full shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
    >
      <Share2 size={20} />
      Partager
    </button>
  );
};

export default ShareButton;
