import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import OrderButton from './OrderButton';
import ShareButton from './ShareButton';
import VoiceAssistantButton from './VoiceAssistantButton';
import { motion } from 'framer-motion';

// Carousel swipeable natif fluide pour plusieurs photos
const ImageCarousel = ({ images, videoUrl }) => {
  const [current, setCurrent] = useState(0);
  const carouselRef = React.useRef(null);
  
  const optimizeMediaUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    if (url.includes('/upload/q_')) return url;
    return url.replace('/upload/', '/upload/q_auto,f_auto,w_1080/'); // Plus grande qualité pour la page détaillée
  };

  const optimizedVideoUrl = optimizeMediaUrl(videoUrl);
  const optimizedImages = images ? images.map(optimizeMediaUrl) : [];

  const allMedia = optimizedVideoUrl ? [{ type: 'video', url: optimizedVideoUrl }] : optimizedImages.map(url => ({ type: 'image', url }));
  const total = allMedia.length;

  const handleScroll = (e) => {
    if (!carouselRef.current) return;
    const scrollPosition = e.target.scrollLeft;
    const itemWidth = e.target.clientWidth;
    const newIndex = Math.round(scrollPosition / itemWidth);
    if (newIndex !== current) {
      setCurrent(newIndex);
    }
  };

  const scrollTo = (index) => {
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.clientWidth;
    carouselRef.current.scrollTo({ left: itemWidth * index, behavior: 'smooth' });
    setCurrent(index);
  };

  if (total === 0) return (
    <div className="w-full aspect-square flex items-center justify-center text-gray-400 bg-brand-light">Pas d'image</div>
  );

  return (
    <div className="relative w-full bg-brand-light flex flex-col group">
      {/* Zone de défilement native */}
      <div 
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex w-full overflow-x-auto snap-x snap-mandatory aspect-square md:aspect-auto md:h-[480px] scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allMedia.map((media, index) => (
          <div key={index} className="w-full flex-shrink-0 snap-center relative">
            {media.type === 'video' ? (
              <video src={media.url} className="w-full h-full object-cover" controls autoPlay muted loop playsInline />
            ) : (
              <img src={media.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
            )}
          </div>
        ))}
      </div>

      {/* Flèches navigation (seulement si plusieurs, cachées sur mobile, visibles au survol sur PC) */}
      {total > 1 && (
        <>
          <button 
            onClick={() => scrollTo((current - 1 + total) % total)} 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md transition-all opacity-0 md:group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft size={20} className="text-brand-dark" />
          </button>
          <button 
            onClick={() => scrollTo((current + 1) % total)} 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-1.5 shadow-md transition-all opacity-0 md:group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight size={20} className="text-brand-dark" />
          </button>
        </>
      )}

      {/* Points indicateurs */}
      {total > 1 && (
        <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {allMedia.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`rounded-full transition-all duration-300 shadow-sm ${i === current ? 'w-5 h-2 bg-brand' : 'w-2 h-2 bg-white/80'}`}
            />
          ))}
        </div>
      )}

      {/* Miniatures en bas (si plusieurs) */}
      {total > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto bg-white [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {allMedia.map((m, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-brand' : 'border-transparent opacity-60'}`}
            >
              {m.type === 'video'
                ? <video src={m.url} className="w-full h-full object-cover" muted />
                : <img src={m.url} alt={`mini ${i}`} className="w-full h-full object-cover" />
              }
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-xl">Produit introuvable.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-brand hover:underline">
          Retour au catalogue
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-4xl mx-auto"
    >
      <button 
        onClick={() => navigate('/')} 
        className="flex items-center text-gray-600 hover:text-brand mb-6 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au catalogue
      </button>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden md:flex border border-brand-light">
        {/* Carousel Photos */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="md:w-1/2 overflow-hidden"
        >
          <ImageCarousel 
            images={product.images && product.images.length > 0 ? product.images : (product.imageUrl ? [product.imageUrl] : [])}
            videoUrl={product.videoUrl}
          />
        </motion.div>

        {/* Content Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="p-8 md:p-12 md:w-1/2 flex flex-col justify-between"
        >
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
              {product.nom}
            </h1>
            <div className="flex flex-col gap-2 mb-6">
              {product.enPromo && product.prixPromo ? (
                <div className="flex items-center gap-4">
                  <p className="text-3xl md:text-4xl font-black text-brand-dark">{product.prixPromo.toLocaleString('fr-FR')} F CFA</p>
                  <div className="flex flex-col">
                    <p className="text-lg text-gray-400 line-through">{product.prix.toLocaleString('fr-FR')} F</p>
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">PROMO</span>
                  </div>
                </div>
              ) : (
                <p className="text-3xl md:text-4xl font-black text-brand-dark">{product.prix.toLocaleString('fr-FR')} F CFA</p>
              )}
            </div>
            
            <div className="prose prose-purple text-gray-600 mb-10 text-lg leading-relaxed">
              {product.description ? (
                <p className="whitespace-pre-line">{product.description}</p>
              ) : (
                <p className="italic opacity-70">Aucune description disponible.</p>
              )}
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="space-y-4 mt-auto"
          >
            <VoiceAssistantButton product={product} />
            <OrderButton product={product} />
            <ShareButton product={product} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProductDetail;
