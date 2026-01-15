import React, { useState, useEffect } from 'react';
import { Camera, MapPin, X, Trash2, Navigation } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Input from '../components/Input';
import Button from '../components/Button';
import { compressImage } from '../utils/image';

function Post({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const productToEdit = location.state?.productToEdit;
    const productToRelist = location.state?.productToRelist;
    const isEditing = !!productToEdit;
    const sourceProduct = productToEdit || productToRelist;

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Mode");
    const [condition, setCondition] = useState("Très bon état");
    const [city, setCity] = useState("");
    const [desc, setDesc] = useState("");

    // Images state
    const [existingImages, setExistingImages] = useState([]); // URLs
    const [newImageFiles, setNewImageFiles] = useState([]); // Files
    const [newImagePreviews, setNewImagePreviews] = useState([]); // Blob URLs

    const [uploading, setUploading] = useState(false);
    const [locLoading, setLocLoading] = useState(false);

    useEffect(() => {
        if (sourceProduct) {
            setTitle(sourceProduct.title || "");
            setPrice(sourceProduct.price || "");
            setCategory(sourceProduct.category || "Mode");
            setCondition(sourceProduct.condition || "Très bon état");
            setCity(sourceProduct.city || "");
            setDesc(sourceProduct.description || "");
            // Support both keys just in case
            const images = sourceProduct.images || sourceProduct.imageUrls || (sourceProduct.imageUrl ? [sourceProduct.imageUrl] : []);
            setExistingImages(images);
        } else if (user && user.city) {
            setCity(user.city);
        }
    }, [sourceProduct, user]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = existingImages.length + newImageFiles.length + files.length;

        if (totalImages > 3) {
            addToast("Maximum 3 photos autorisées.", "error");
            return;
        }

        if (files.length > 0) {
            const addedFiles = [...newImageFiles, ...files];
            setNewImageFiles(addedFiles);

            const addedPreviews = files.map(file => URL.createObjectURL(file));
            setNewImagePreviews(prev => [...prev, ...addedPreviews]);
        }
    };

    const removeImage = (index) => {
        if (index < existingImages.length) {
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            const newIndex = index - existingImages.length;
            setNewImageFiles(prev => prev.filter((_, i) => i !== newIndex));
            setNewImagePreviews(prev => prev.filter((_, i) => i !== newIndex));
        }
    };

    const handleGeolocation = () => {
        if (!navigator.geolocation) {
            addToast("La géolocalisation n'est pas supportée par votre navigateur.", "error");
            return;
        }

        setLocLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`);
                const data = await res.json();

                if (data.features && data.features.length > 0) {
                    const cityFound = data.features[0].properties.city;
                    setCity(cityFound);
                    addToast(`Ville détectée : ${cityFound}`, "success");
                } else {
                    addToast("Impossible de détecter la ville précise.", "info");
                }
            } catch (err) {
                console.error("Geo error:", err);
                addToast("Erreur lors de la récupération de la ville.", "error");
            } finally {
                setLocLoading(false);
            }
        }, (err) => {
            console.error(err);
            setLocLoading(false);
            addToast("Accès à la position refusé.", "error");
        });
    };

    const handleSubmit = async () => {
        if (!title || !price || !user) return;

        if ((existingImages.length + newImageFiles.length) === 0) {
            addToast("Ajoutez au moins une photo.", "error");
            return;
        }

        setUploading(true);
        try {
            // 1. Process images: Compress and convert to Base64
            const newImageUrls = await Promise.all(newImageFiles.map(async (file) => {
                return await compressImage(file, 0.5, 500, 500);
            }));

            // 2. Combine URLs
            const finalImageUrls = [...existingImages, ...newImageUrls];
            const mainImageUrl = finalImageUrls[0];

            const productData = {
                title,
                price: Number(price),
                category,
                condition,
                city,
                description: desc,
                imageUrl: mainImageUrl,
                images: finalImageUrls, // Correct key matching Mongoose Schema
                updatedAt: new Date()
            };

            if (isEditing) {
                await fetch(`/api/products/${productToEdit.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            } else {
                productData.sellerId = user.uid;
                productData.sellerName = user.displayName || 'Vendeur';
                productData.sellerAvatar = user.photoURL || null;

                await fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
            }

            navigate('/');
            addToast(isEditing ? "Annonce mise à jour !" : "Annonce publiée !", "success");
        } catch (err) {
            console.error("Post Error:", err);
            addToast(`Erreur: ${err.message || "Publication échouée"}`, "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!isEditing || !window.confirm("Supprimer cette annonce ?")) return;
        setUploading(true);
        try {
            await fetch(`/api/products/${productToEdit.id}`, {
                method: 'DELETE'
            });
            navigate('/');
            addToast("Annonce supprimée.", "info");
        } catch (err) { console.error(err); addToast("Erreur lors de la suppression.", "error"); }
        finally { setUploading(false); }
    };

    const allPreviews = [...existingImages, ...newImagePreviews];

    return (
        <div className="p-6 flex flex-col gap-6 pb-32"> {/* Added pb-32 for bottom nav clearance */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900">{isEditing ? "Modifier" : "Vendre un article"}</h2>
                {isEditing && (
                    <button onClick={handleDelete} className="p-2 text-rose-500 bg-rose-50 rounded-full hover:bg-rose-100 transition-colors">
                        <Trash2 size={20} />
                    </button>
                )}
            </div>

            {/* Photos */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {allPreviews.map((preview, index) => (
                    <div key={index} className="flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden relative shadow-sm border border-slate-100 snap-center">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80">
                            <X size={14} />
                        </button>
                    </div>
                ))}

                {allPreviews.length < 3 && (
                    <label className="flex-shrink-0 w-28 h-28 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-500 transition-all snap-center">
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        <Camera size={24} />
                        <span className="text-[10px] font-bold uppercase">Ajouter</span>
                    </label>
                )}
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5">
                <Input label="Titre de l'annonce" placeholder="Ex: iPhone 12 Pro..." value={title} onChange={setTitle} />

                <div className="grid grid-cols-2 gap-4">
                    <Input label="Prix" type="number" placeholder="FCFA" value={price} onChange={setPrice} />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">État</label>
                        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20">
                            {['Neuf', 'Très bon état', 'Bon état', 'Satisfaisant', 'Pour pièces'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20">
                        {['Mode', 'Maison', 'Multimédia', 'Loisirs', 'Autres'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="relative">
                    <Input label="Ville" icon={MapPin} placeholder="Ville (ou Géolocaliser)" value={city} onChange={setCity} />
                    <button
                        type="button"
                        onClick={handleGeolocation}
                        disabled={locLoading}
                        className="absolute right-4 top-[2.8rem] text-indigo-600 p-1 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Me géolocaliser"
                    >
                        <Navigation size={20} className={locLoading ? "animate-spin" : ""} />
                    </button>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        rows={4}
                        placeholder="Décrivez votre article (taille, défauts éventuels...)"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    />
                </div>

                <Button onClick={handleSubmit} loading={uploading} className="mt-4 py-4 shadow-xl shadow-indigo-200">
                    {isEditing ? "Valider les modifications" : "Publier maintenant"}
                </Button>
            </div>
        </div>
    );
}

export default Post;
