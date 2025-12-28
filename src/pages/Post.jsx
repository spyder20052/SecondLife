import React, { useState, useEffect } from 'react';
import { Camera, MapPin, X, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Input from '../components/Input';
import Button from '../components/Button';

function Post({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const productToEdit = location.state?.productToEdit;
    const isEditing = !!productToEdit;

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("Vêtements");
    const [city, setCity] = useState("");
    const [desc, setDesc] = useState("");

    // Split state for images
    const [existingImages, setExistingImages] = useState([]); // Array of strings (Base64 or URLs)
    const [newImageFiles, setNewImageFiles] = useState([]); // Array of Files
    const [newImagePreviews, setNewImagePreviews] = useState([]); // Array of strings (previews for new files)

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setTitle(productToEdit.title || "");
            setPrice(productToEdit.price || "");
            setCategory(productToEdit.category || "Vêtements");
            setCity(productToEdit.city || "");
            setDesc(productToEdit.description || "");
            // Handle legacy single imageUrl vs new imageUrls array
            const images = productToEdit.imageUrls || (productToEdit.imageUrl ? [productToEdit.imageUrl] : []);
            setExistingImages(images);
        }
    }, [productToEdit]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const addedFiles = [...newImageFiles, ...files];
            setNewImageFiles(addedFiles);

            const addedPreviewsPromise = files.map(file => {
                const reader = new FileReader();
                return new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(addedPreviewsPromise).then(results => {
                setNewImagePreviews(prev => [...prev, ...results]);
            });
        }
    };

    const removeImage = (index) => {
        if (index < existingImages.length) {
            // Remove from existing
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            // Remove from new
            const newIndex = index - existingImages.length;
            setNewImageFiles(prev => prev.filter((_, i) => i !== newIndex));
            setNewImagePreviews(prev => prev.filter((_, i) => i !== newIndex));
        }
    };

    const compressImage = async (file) => {
        return new Promise((resolve) => {
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
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                };
            };
        });
    };

    // Combine for display
    const allPreviews = [...existingImages, ...newImagePreviews];

    const handleSubmit = async () => {
        if (!title || !price || !user || user.isAnonymous) return;
        setUploading(true);
        try {
            // 1. Process new images
            let newBase64s = [];
            if (newImageFiles.length > 0) {
                newBase64s = await Promise.all(newImageFiles.map(file => compressImage(file)));
            }

            // 2. Combine with remaining existing images
            const finalImageUrls = [...existingImages, ...newBase64s];
            const mainImageUrl = finalImageUrls.length > 0 ? finalImageUrls[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800';

            const productData = {
                title,
                price: Number(price),
                category,
                city,
                description: desc,
                imageUrl: mainImageUrl,
                imageUrls: finalImageUrls,
                updatedAt: serverTimestamp()
            };

            if (isEditing) {
                const productRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', productToEdit.id);
                await updateDoc(productRef, productData);
            } else {
                productData.sellerId = user.uid;
                productData.sellerName = user.displayName || 'Membre';
                productData.createdAt = serverTimestamp();
                const productsRef = collection(db, 'artifacts', appId, 'public', 'data', 'products');
                await addDoc(productsRef, productData);
            }

            navigate(isEditing ? `/product/${productToEdit.id}` : '/');
            addToast(isEditing ? "Annonce modifiée avec succès" : "Annonce publiée !", "success");
        } catch (err) { console.error(err); addToast("Une erreur est survenue", "error"); }
        finally { setUploading(false); }
    };

    const handleDelete = async () => {
        if (!isEditing || !window.confirm("Voulez-vous vraiment supprimer cette annonce ?")) return;
        setUploading(true);
        try {
            const productRef = doc(db, 'artifacts', appId, 'public', 'data', 'products', productToEdit.id);
            await deleteDoc(productRef);
            navigate('/');
            addToast("Annonce supprimée", "info");
        } catch (err) { console.error(err); addToast("Erreur lors de la suppression", "error"); }
        finally { setUploading(false); }
    };

    return (
        <div className="p-8 flex flex-col gap-8">
            <h2 className="text-3xl font-black">{isEditing ? "Modifier l'annonce" : "Vendre un objet"}</h2>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-3">
                    {allPreviews.map((preview, index) => (
                        <div key={index} className="aspect-square rounded-2xl overflow-hidden relative group">
                            <img src={preview} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <label className="aspect-square bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-indigo-600 gap-1 cursor-pointer hover:bg-indigo-50 transition-colors">
                        <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                        <Camera size={20} />
                        <span className="text-[9px] font-black uppercase tracking-wider">Ajouter</span>
                    </label>
                </div>
            </div>

            <div className="flex flex-col gap-6">
                <Input label="Titre" placeholder="Veste vintage..." value={title} onChange={setTitle} />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Prix" type="number" placeholder="00" value={price} onChange={setPrice} />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 font-bold text-slate-800 outline-none">
                            {['Vêtements', 'Meubles', 'Électronique', 'Loisirs', 'Sport', 'Maison'].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <Input label="Ville" icon={MapPin} placeholder="Ex: Paris" value={city} onChange={setCity} />
                <textarea placeholder="Description (état, taille...)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-[28px] py-5 px-6 font-medium outline-none" />

                <Button onClick={handleSubmit} loading={uploading} className="py-5">
                    {isEditing ? "Enregistrer les modifications" : "Publier l'annonce"}
                </Button>

                {isEditing && (
                    <button onClick={handleDelete} disabled={uploading} className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 rounded-3xl border border-red-100">
                        Supprimer l'annonce
                    </button>
                )}
            </div>
        </div>
    );
}

export default Post;
