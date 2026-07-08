import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { trackOrderClick } from '../utils/tracker';

const ProductCard = ({ product }) => {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '2250769434390';
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
  // S'il y a plusieurs photos, on les fait défiler automatiquement toutes les 2.5 secondes
  const hasMultipleImages = product.images && product.images.length > 1;
  const displayImage = hasMultipleImages ? product.images[currentImgIndex] : product.imageUrl;

  useEffect(() => {
    if (!hasMultipleImages) return;
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % product.images.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [hasMultipleImages, product.images]);

  const handleWhatsAppClick = (e) => {
    e.preventDefault(); // Empêche le clic de rediriger vers la page détails
    trackOrderClick(product.id, product.nom);
    const productUrl = `${window.location.origin}/product/${product.id}`;
    const message = `Bonjour, je veux passer la commande de cet article.\n\nLien : ${productUrl}`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Link to={`/product/${product.id}`} className="group flex flex-col bg-white rounded-2xl shadow-[0_4px_20px_rgba(147,51,234,0.04)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] hover:-translate-y-1 transition-all duration-500 overflow-hidden border border-brand-light hover:border-brand-gold/30 relative">
      <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-brand-light to-white relative">
        {/* Cadre de luxe interne (inner frame) */}
        <div className="absolute inset-3 border border-brand-gold/40 rounded-lg pointer-events-none z-20 transition-all duration-500 group-hover:border-brand/60 group-hover:inset-2"></div>
        
        {/* Indicateurs de diaporama (si plusieurs photos) */}
        {hasMultipleImages && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            {product.images.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentImgIndex ? 'w-4 bg-brand' : 'w-1.5 bg-brand-light/70'}`} />
            ))}
          </div>
        )}

        {product.videoUrl ? (
          <video 
            src={product.videoUrl} 
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
            muted 
            autoPlay 
            loop 
            playsInline
          />
        ) : displayImage ? (
          <AnimatePresence initial={false}>
            <motion.img 
              key={displayImage}
              src={displayImage}
              alt={product.nom}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium">
            Pas d'image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Bouton d'assistance vocale flottant */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            import('../utils/voiceAssistant').then(({ speakText }) => {
              const formatPrice = (p) => p.toString();
              let textToSpeak = `Ceci est la perruque ${product.nom}. `;
              if (product.enPromo && product.prixPromo) {
                textToSpeak += `Son prix promo est de ${formatPrice(product.prixPromo)} francs CFA, au lieu de ${formatPrice(product.prix)} francs. `;
              } else {
                textToSpeak += `Son prix est de ${formatPrice(product.prix)} francs CFA. `;
              }
              textToSpeak += `Cliquez pour voir plus de détails.`;
              
              speakText(textToSpeak);
            });
          }}
          className="absolute bottom-3 right-3 z-30 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg text-brand hover:scale-110 hover:bg-brand hover:text-white transition-all duration-300"
          title="Écouter la description"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
        </button>
      </div>
      
      <div className="p-4 flex flex-col flex-grow bg-white z-10 relative">
        <h3 className="font-bold text-gray-800 mb-1 text-sm md:text-base leading-tight line-clamp-2">{product.nom}</h3>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div>
            {product.enPromo && product.prixPromo ? (
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 line-through">{product.prix.toLocaleString('fr-FR')} F</span>
                <span className="font-black text-brand-dark text-base md:text-lg">{product.prixPromo.toLocaleString('fr-FR')} F</span>
              </div>
            ) : (
              <span className="font-black text-brand-dark text-base md:text-lg">{product.prix.toLocaleString('fr-FR')} F</span>
            )}
          </div>
          
          <button 
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center bg-[#25D366] hover:bg-[#128C7E] text-white p-2.5 md:p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
            aria-label="Commander sur WhatsApp"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825 0 6.938 3.112 6.938 6.937 0 3.825-3.113 6.938-6.938 6.938z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Badge Promo au-dessus de tout */}
      {product.enPromo && (
        <div className="absolute top-4 right-4 z-40 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg border border-red-400/50 flex items-center gap-1 shadow-red-500/30 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          PROMO
        </div>
      )}
    </Link>
  );
};

export default ProductCard;
