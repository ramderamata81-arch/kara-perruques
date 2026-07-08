import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Upload, Save, FileVideo } from 'lucide-react';
import MediaEditor from './MediaEditor';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    enPromo: false,
    prixPromo: '',
    description: '',
    publishAt: ''
  });
  
  const [images, setImages] = useState([]); // tableau de URLs de photos
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTrim, setVideoTrim] = useState(null); // { startTime, endTime }
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  // Éditeur média
  const [editingFile, setEditingFile] = useState(null);  // { file, localUrl }
  const [pendingFiles, setPendingFiles] = useState([]);   // fichiers en attente d'upload après édition

  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        try {
          const docSnap = await getDoc(doc(db, 'products', id));
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            let publishAtStr = '';
            if (data.publishAt) {
              const d = data.publishAt.toDate ? data.publishAt.toDate() : new Date(data.publishAt);
              // format: YYYY-MM-DDTHH:mm
              publishAtStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
            }

            setFormData({
              nom: data.nom || '',
              prix: data.prix || '',
              enPromo: data.enPromo || false,
              prixPromo: data.prixPromo || '',
              description: data.description || '',
              publishAt: publishAtStr
            });
            // Chargement des photos multiples (rétrocompatible avec l'ancienne imageUrl)
            if (data.images && data.images.length > 0) {
              setImages(data.images);
            } else if (data.imageUrl) {
              setImages([data.imageUrl]);
            }
            setVideoUrl(data.videoUrl || '');
          }
        } catch (error) {
          console.error("Error fetching product:", error);
        } finally {
          setFetching(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary n'est pas configuré. Veuillez vérifier votre fichier .env.local");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      // Utilisation du endpoint 'auto' pour accepter à la fois images et vidéos
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadProgress(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          reject(new Error("Erreur d'upload vers Cloudinary"));
        }
      };

      xhr.onerror = () => reject(new Error("Erreur réseau lors de l'upload"));
      xhr.send(formData);
    });
  };

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = ''; // reset pour permettre de re-sélectionner le même fichier

    // Ouvrir l'éditeur pour le premier fichier sélectionné
    // Les autres seront traités en séquence après confirmation
    const localUrl = URL.createObjectURL(files[0]);
    setEditingFile({ file: files[0], localUrl });
    if (files.length > 1) {
      setPendingFiles(files.slice(1));
    } else {
      setPendingFiles([]);
    }
  };

  // Appelé quand la vendeuse confirme depuis l'éditeur
  const handleEditorConfirm = async (result) => {
    const { file } = editingFile;
    setEditingFile(null);

    if (file.type.startsWith('video/')) {
      // Résultat vidéo : { startTime, endTime } + upload du fichier original
      setUploadingMedia(true);
      setUploadProgress(0);
      try {
        const downloadURL = await uploadToCloudinary(file);
        setVideoUrl(downloadURL);
        setVideoTrim(result); // sauvegarde les points de début/fin
        setImages([]);
      } catch (err) {
        alert(err.message || "L'upload a échoué.");
      }
      setUploadingMedia(false);
    } else {
      // Résultat image : result est un Blob édité
      setUploadingMedia(true);
      setUploadProgress(0);
      try {
        const editedFile = new File([result], file.name, { type: 'image/jpeg' });
        const downloadURL = await uploadToCloudinary(editedFile);
        setImages(prev => [...prev, downloadURL]);
        setVideoUrl('');
      } catch (err) {
        console.error(err);
      }
      setUploadingMedia(false);

      // S'il y a d'autres fichiers en attente, ouvrir l'éditeur pour le suivant
      if (pendingFiles.length > 0 && images.length + 1 < 6) {
        const next = pendingFiles[0];
        const nextUrl = URL.createObjectURL(next);
        setEditingFile({ file: next, localUrl: nextUrl });
        setPendingFiles(prev => prev.slice(1));
      }
    }
  };

  const handleEditorCancel = () => {
    if (editingFile?.localUrl) URL.revokeObjectURL(editingFile.localUrl);
    setEditingFile(null);
    setPendingFiles([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const publishDate = formData.publishAt ? new Date(formData.publishAt) : new Date();
      
      const productData = {
        nom: formData.nom,
        prix: Number(formData.prix),
        enPromo: formData.enPromo,
        prixPromo: formData.enPromo && formData.prixPromo ? Number(formData.prixPromo) : null,
        description: formData.description,
        publishAt: formData.publishAt ? Timestamp.fromDate(new Date(formData.publishAt)) : null,
        updatedAt: serverTimestamp()
      };

      if (images.length > 0) {
        productData.images = images;
        productData.imageUrl = images[0];
      }
      if (videoUrl) {
        productData.videoUrl = videoUrl;
        if (videoTrim) productData.videoTrim = videoTrim; // startTime, endTime
      }

      if (isEditing) {
        if (images.length > 0 && !videoUrl) productData.videoUrl = null;
        if (videoUrl && images.length === 0) { productData.imageUrl = null; productData.images = []; }
        await updateDoc(doc(db, 'products', id), productData);
      } else {
        productData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'products'), productData);
      }

      navigate('/admin');
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center p-12">Chargement...</div>;

  return (
    <>
      {/* Éditeur média : s'ouvre en overlay dès qu'un fichier est sélectionné */}
      {editingFile && (
        <MediaEditor
          file={editingFile.file}
          localUrl={editingFile.localUrl}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      )}

    <div className="max-w-3xl mx-auto pb-12">
      <Link 
        to="/admin" 
        className="flex items-center text-gray-600 hover:text-brand mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Retour au tableau de bord
      </Link>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du produit *</label>
                <input
                  type="text"
                  name="nom"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand"
                  placeholder="Ex: Perruque Brésilienne Lisse 24 pouces"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix (F CFA) *</label>
                <input
                  type="number"
                  name="prix"
                  value={formData.prix}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-brand focus:border-brand"
                  placeholder="Ex: 50000"
                />
              </div>

              <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-orange-900">Activer une promotion</h3>
                    <p className="text-sm text-orange-700">Mettre cet article en promo.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="enPromo"
                      checked={formData.enPromo}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                {formData.enPromo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau Prix Promo (F CFA) *</label>
                    <input
                      type="number"
                      name="prixPromo"
                      value={formData.prixPromo}
                      onChange={handleChange}
                      required={formData.enPromo}
                      className="w-full px-4 py-3 rounded-lg border border-orange-300 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Ex: 40000"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de publication (optionnel)
                </label>
                <input
                  type="datetime-local"
                  name="publishAt"
                  value={formData.publishAt}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos du produit <span className="text-gray-400 font-normal">({images.length}/6 photos)</span>
                </label>

                {/* Grille de miniatures */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {images.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-brand-light group">
                        <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        {/* Numéro de la photo */}
                        <div className="absolute top-1 left-1 bg-brand text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                        {/* Bouton supprimer */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        >✕</button>
                      </div>
                    ))}
                    {/* Bouton ajouter une photo supplémentaire */}
                    {images.length < 6 && !uploadingMedia && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-brand flex items-center justify-center cursor-pointer transition-colors">
                        <input type="file" className="sr-only" accept="image/*" multiple onChange={handleMediaChange} disabled={uploadingMedia} />
                        <span className="text-3xl text-gray-300 hover:text-brand">+</span>
                      </label>
                    )}
                  </div>
                )}
                
                {/* Zone de téléchargement principale (si pas de photos) */}
                {images.length === 0 && !videoUrl && (
                  <label className={`mt-1 flex flex-col items-center justify-center w-full px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
                    ${uploadingMedia ? 'border-brand-light bg-brand-light/30 cursor-wait' : 'border-gray-300 hover:border-brand hover:bg-brand-light/20'}
                  `}>
                    <input type="file" className="sr-only" accept="image/*,video/*" multiple onChange={handleMediaChange} disabled={uploadingMedia} />
                    <Upload className={`h-10 w-10 mb-3 ${uploadingMedia ? 'text-brand animate-bounce' : 'text-gray-400'}`} />
                    <span className="text-sm font-bold text-brand">
                      {uploadingMedia ? `Téléchargement photo ${uploadingIndex}...` : '📷 Sélectionner les photos / vidéo'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {uploadingMedia ? `${Math.round(uploadProgress)}%` : 'Jusqu\'à 6 photos ou 1 vidéo MP4'}
                    </span>
                  </label>
                )}

                {/* Barre de progression */}
                {uploadingMedia && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Téléchargement en cours...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-brand h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}
                
                {/* Preview Vidéo */}
                {!uploadingMedia && videoUrl && (
                  <div className="mt-4 relative group">
                    <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center relative">
                      <video src={videoUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <FileVideo className="text-white w-12 h-12 opacity-80" />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transition-all duration-200 flex items-center gap-1"
                    >
                      🗑️ Changer la vidéo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              rows="5"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand focus:border-brand"
              placeholder="Décrivez votre produit..."
            ></textarea>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end">
            <Link 
              to="/admin"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 mr-4 font-medium"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingMedia}
              className={`bg-brand hover:bg-brand-dark text-white font-bold py-2 px-6 rounded-lg flex items-center ${(loading || uploadingMedia) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Enregistrement...' : (
                <>
                  <Save size={20} className="mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      </div>
    </>
  );
};

export default ProductForm;
