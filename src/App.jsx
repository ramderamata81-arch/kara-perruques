import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Layouts & Components

// Public Pages
import HomePage from './components/HomePage';
import ProductGrid from './components/ProductGrid';
import ProductDetail from './components/ProductDetail';

// Admin Pages
import AdminLogin from './admin/AdminLogin';
import AdminDashboard from './admin/AdminDashboard';
import ProductForm from './admin/ProductForm';

import { motion } from 'framer-motion';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Si déjà connectée → on va direct au tableau de bord, pas besoin de se reconnecter
const AutoRedirectLogin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand"></div>
      </div>
    );
  }

  // Déjà connectée ? On va direct au tableau de bord !
  if (user) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminLogin />;
};

function App() {
  useEffect(() => {
    // Enregistrement d'une visite de façon silencieuse
    // On utilise sessionStorage pour ne pas compter le même visiteur plusieurs fois par session
    if (!sessionStorage.getItem('visited')) {
      const recordVisit = async () => {
        try {
          await addDoc(collection(db, 'visits'), {
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent
          });
          sessionStorage.setItem('visited', 'true');
        } catch (error) {
          // On ignore les erreurs (ex: bloqueur de pub)
        }
      };
      recordVisit();
    }
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50/50 selection:bg-brand selection:text-white">
        
        {/* Premium Header */}
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="bg-white/90 backdrop-blur-xl shadow-sm sticky top-0 z-50 border-b border-brand-light/50"
        >
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-3xl font-extrabold tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand-dark via-brand to-brand-gold drop-shadow-sm">
              <a href="/" className="hover:opacity-80 transition-opacity">KARA</a>
            </h1>
            <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
              <a href="/" className="text-gray-800 hover:text-brand transition-colors">Accueil</a>
              <a href="/collection" className="text-gray-800 hover:text-brand transition-colors">Boutique</a>
              <a href="https://wa.me/2250769434390" target="_blank" rel="noreferrer" className="text-gray-800 hover:text-brand transition-colors">Contact</a>
            </nav>
            <div className="flex items-center gap-4">
               <a href="https://wa.me/2250769434390" target="_blank" rel="noreferrer" className="bg-brand hover:bg-brand-dark text-white px-5 py-2 rounded-full text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                 WhatsApp
               </a>
            </div>
          </div>
        </motion.header>

        <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-12">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/collection" element={<ProductGrid />} />
            <Route path="/product/:id" element={<ProductDetail />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AutoRedirectLogin />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/product/new" 
              element={
                <ProtectedRoute>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/product/edit/:id" 
              element={
                <ProtectedRoute>
                  <ProductForm />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        
        <footer className="bg-white border-t py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} KARA. Par Ramde Ramata.
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
