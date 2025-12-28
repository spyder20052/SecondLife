import React, { useState } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

function ProductDetail({ products, user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products.find(p => p.id === id);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    if (!product) return <div className="p-10 text-center">Produit non trouvé</div>;

    const onContact = () => {
        if (!user || user.isAnonymous) {
            navigate('/auth');
            return;
        }
        if (product.sellerId === user.uid) return;

        const chatData = {
            productId: product.id,
            sellerId: product.sellerId,
            buyerId: user.uid,
            productTitle: product.title,
            sellerName: product.sellerName || 'Vendeur'
        };

        navigate('/chat/detail', { state: { activeChat: chatData } });
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="relative aspect-square w-full bg-slate-50">
                <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-10 w-12 h-12 bg-white/90 backdrop-blur rounded-2xl shadow-xl flex items-center justify-center text-slate-800 active:scale-90 border border-slate-100">
                    <ArrowLeft size={24} />
                </button>

                {product.imageUrls && product.imageUrls.length > 0 ? (
                    <div className="w-full h-full overflow-x-auto flex snap-x snap-mandatory no-scrollbar">
                        {product.imageUrls.map((url, i) => (
                            <img key={i} src={url} className="w-full h-full object-cover flex-shrink-0 snap-center" alt="" />
                        ))}
                    </div>
                ) : (
                    <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                )}

                {product.imageUrls && product.imageUrls.length > 1 && (
                    <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-2 z-10">
                        {product.imageUrls.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === activeImageIndex ? 'bg-white w-4' : 'bg-white/50'}`} />
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 px-6 pt-10 pb-32 -mt-10 bg-white rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.08)] relative z-20">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 pr-4">
                        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">{product.category}</span>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight mt-3">{product.title}</h1>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-3"><MapPin size={16} /><span className="text-sm font-bold">{product.city || 'Lieu inconnu'}</span></div>
                    </div>
                    <div className="text-3xl font-black text-indigo-600">{product.price}€</div>
                </div>

                <div className="h-px bg-slate-100 w-full mb-8" />
                <div className="mb-8">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-4">Description</h2>
                    <p className="text-slate-500 text-sm leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        {product.description || "Aucune description fournie."}
                    </p>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-white border-t border-slate-100 z-30">
                {user?.uid === product.sellerId ? (
                    <Button onClick={() => navigate('/post', { state: { productToEdit: product } })} variant="secondary" className="w-full py-5">Gérer mon annonce</Button>
                ) : (
                    <Button onClick={onContact} className="w-full py-5 text-lg">
                        {(user?.isAnonymous || !user) ? "Connectez-vous pour contacter" : "Contacter le vendeur"}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default ProductDetail;
