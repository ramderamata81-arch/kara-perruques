import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, getCountFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, LogOut, Settings, Clock, CheckCircle, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitsCount, setVisitsCount] = useState(0);
  const [orderStats, setOrderStats] = useState({});
  const [showStats, setShowStats] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Récupérer le nombre total de visites
    const fetchVisits = async () => {
      try {
        const coll = collection(db, 'visits');
        const snapshot = await getCountFromServer(coll);
        setVisitsCount(snapshot.data().count);
      } catch (e) {
        console.error("Erreur stats: ", e);
      }
    };
    fetchVisits();

    // Fetch all products for admin, ordered by creation or publish date
    const q = query(collection(db, 'products'), orderBy('publishAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
      setLoading(false);
    });

    // Fetch order clicks to aggregate stats per product
    const ordersQuery = query(collection(db, 'order_clicks'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const stats = {};
      snapshot.forEach(doc => {
        const pId = doc.data().productId;
        if (pId) {
          stats[pId] = (stats[pId] || 0) + 1;
        }
      });
      setOrderStats(stats);
    });

    return () => {
      unsubscribe();
      unsubscribeOrders();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleDelete = async (id, nom) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${nom}" ?`)) {
      try {
        await deleteDoc(doc(db, 'products', id));
        // Note: we might also want to delete the image from storage if it exists
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Erreur lors de la suppression.");
      }
    }
  };

  const isPublished = (publishAt) => {
    if (!publishAt) return true;
    
    // Check if publishAt is a Firebase Timestamp
    const publishDate = publishAt.toDate ? publishAt.toDate() : new Date(publishAt);
    return publishDate <= new Date();
  };

  const formatPublishDate = (publishAt) => {
    if (!publishAt) return '';
    const date = publishAt.toDate ? publishAt.toDate() : new Date(publishAt);
    return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <div className="flex gap-4">
            <button 
              onClick={handleLogout}
            className="flex items-center text-red-600 hover:text-red-800 transition-colors"
          >
            <LogOut size={20} className="mr-2" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Carte Statistiques */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Aperçu</h2>
        
        {showStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-brand to-brand-dark rounded-xl p-6 text-white shadow-md flex items-center justify-between">
              <div>
                <p className="text-white/80 font-medium mb-1">Total des Visites</p>
                <h3 className="text-4xl font-black">{visitsCount}</h3>
              </div>
              <button 
                onClick={() => setShowStats(false)}
                title="Masquer les statistiques"
                className="bg-white/20 hover:bg-white/30 p-4 rounded-full transition-colors cursor-pointer"
              >
                <EyeOff size={32} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-3 text-gray-500 text-sm flex items-center gap-3 w-fit">
            <button 
              onClick={() => setShowStats(true)}
              title="Afficher les statistiques"
              className="bg-brand-light hover:bg-brand-light/80 p-2 rounded-full text-brand transition-colors cursor-pointer"
            >
              <Eye size={16} />
            </button>
            <span className="font-medium text-gray-700">{visitsCount}</span> visites totales depuis le lancement.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Vos produits ({products.length})</h2>
          <Link 
            to="/admin/product/new"
            className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg flex items-center transition-colors font-medium"
          >
            <Plus size={20} className="mr-2" />
            Nouveau produit
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">Chargement...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Vous n'avez pas encore de produit. Cliquez sur "Nouveau produit" pour commencer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase">
                  <th className="px-6 py-4 font-medium">Produit</th>
                  <th className="px-6 py-4 font-medium">Prix</th>
                  <th className="px-6 py-4 font-medium text-center" title="Nombre de clics sur Commander">Intention d'achat</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const published = isPublished(product.publishAt);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 relative">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.nom} className="w-full h-full object-cover" />
                          ) : product.videoUrl ? (
                            <video src={product.videoUrl} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <div className="w-full h-full bg-gray-200"></div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900">{product.nom}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {product.prix.toLocaleString('fr-FR')} F
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 bg-green-50 text-green-700 font-bold px-3 py-1 rounded-full border border-green-200">
                          <MessageCircle size={16} className="text-[#25D366]" />
                          {orderStats[product.id] || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {published ? (
                          <span className="inline-flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
                            <CheckCircle size={16} className="mr-1.5" />
                            Publié
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center text-amber-700 bg-amber-100 px-3 py-1 rounded-full text-sm font-medium w-max">
                              <Clock size={16} className="mr-1.5" />
                              Programmé
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              pour le {formatPublishDate(product.publishAt)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <Link 
                            to={`/admin/product/edit/${product.id}`}
                            className="text-gray-500 hover:text-brand transition-colors p-2"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(product.id, product.nom)}
                            className="text-gray-500 hover:text-red-600 transition-colors p-2"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
