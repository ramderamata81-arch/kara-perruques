import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from './ProductCard';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15
    }
  }
};

const ProductGrid = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch products where publishAt <= now
    const now = new Date();
    
    // Create query
    const q = query(
      collection(db, 'products'),
      where('publishAt', '<=', now),
      orderBy('publishAt', 'desc')
    );

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (products.length === 0) {
    const handleSimulation = async () => {
      setLoading(true);
      const pastDate = new Date(Date.now() - 60000); // 1 minute dans le passé pour être sûr
      const fakeProducts = [
        {
          nom: "Perruque Brésilienne Lisse 24\"",
          prix: 45000,
          description: "Cheveux 100% humains, texture lisse et soyeuse. Idéale pour un look élégant au quotidien.",
          imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop",
          publishAt: pastDate
        },
        {
          nom: "Carré Plongeant Bouclé 12\"",
          prix: 35000,
          description: "Coupe courte très tendance. Boucles bien définies qui durent toute la journée.",
          imageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=600&auto=format&fit=crop",
          publishAt: pastDate
        },
        {
          nom: "Perruque Kinky Curly 18\"",
          prix: 55000,
          description: "Volume incroyable ! Texture Kinky Curly authentique. Densité 180%.",
          imageUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=600&auto=format&fit=crop",
          publishAt: pastDate
        },
        {
          nom: "Frontal Lace Ondulée 20\"",
          prix: 60000,
          description: "Lace HD indétectable. Ondulations sublimes parfaites pour les grandes occasions.",
          imageUrl: "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?q=80&w=600&auto=format&fit=crop",
          publishAt: pastDate
        }
      ];

      try {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        for (const p of fakeProducts) {
          await addDoc(collection(db, 'products'), {
            ...p,
            createdAt: serverTimestamp()
          });
        }
        setLoading(false); // Arrêter le chargement après le succès
      } catch (e) {
        console.error("Erreur de simulation", e);
        alert("Erreur lors de la simulation");
        setLoading(false);
      }
    };

    return (
      <div className="text-center py-20 px-4 bg-white rounded-3xl shadow-sm border border-brand-light">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Votre boutique est vide</h3>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">Voulez-vous lancer une simulation pour voir à quoi ressemblera votre site avec des perruques ?</p>
        <button 
          onClick={handleSimulation}
          className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
          Lancer la simulation (Ajouter de faux produits)
        </button>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notre Collection</h2>
          <p className="text-gray-500 mt-2">Découvrez nos perruques de qualité premium.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {products.map((product, index) => (
          <motion.div 
            key={product.id} 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.15, // Stagger effect based on index
              type: "spring", 
              stiffness: 100, 
              damping: 15 
            }}
            className="h-full"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
