import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Tag, CheckCircle, RotateCw, Star, MessageCircle, Share2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import Button from '../components/Button';

function ProductDetail({ products, user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Try to find in the main list first
    const foundProduct = products.find(p => p.id === id);
    // Local state for full details (fetched if list is optimized/partial)
    const [fetchedProduct, setFetchedProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    // The display product is the fetched one (full) or the found one (partial)
    const product = fetchedProduct || foundProduct;

    useEffect(() => {
        // If no product found OR product exists but lacks full 'images' array (optimization), fetch detail.
        if (id && (!foundProduct || !foundProduct.images)) {
            // Only fetch if we haven't already fetched this specific ID
            if (fetchedProduct && fetchedProduct.id === id) return;

            setLoading(true);
            fetch(`/api/products/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error("Not found");
                    return res.json();
                })
                .then(data => {
                    setFetchedProduct(data);
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [id, foundProduct, fetchedProduct]);

    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const scrollRef = useRef(null);

    const scrollToIndex = (index) => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: width * index,
                behavior: 'smooth'
            });
            setActiveImageIndex(index);
        }
    };

    const [markingSold, setMarkingSold] = useState(false);
    const [sellerRating, setSellerRating] = useState(null);
    const [sellerData, setSellerData] = useState(null);

    // Fetch Seller Info & Rating
    useEffect(() => {
        if (!product?.sellerId) return;

        const fetchSeller = async () => {
            try {
                const res = await fetch(`/api/users/${product.sellerId}`);
                if (res.ok) {
                    const data = await res.json();
                    setSellerData(data);
                    if (data.ratingCount > 0) {
                        setSellerRating((data.ratingSum / data.ratingCount).toFixed(1));
                    }
                }
            } catch (err) { console.error("Error fetching seller", err); }
        };
        fetchSeller();
    }, [product?.sellerId]);

    if (!product) return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <p className="font-bold">Chargement du produit...</p>
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold uppercase">Retour</button>
        </div>
    );

    const isSold = product.status === 'sold';
    const isOwner = user?.uid === product.sellerId;

    // Normalize images: newer 'images' array vs older 'imageUrls' vs 'imageUrl'
    const displayImages = product.images?.length > 0
        ? product.images
        : (product.imageUrls?.length > 0 ? product.imageUrls : [product.imageUrl]);

    const onContact = () => {
        if (!user) {
            navigate('/auth');
            return;
        }
        if (isOwner) return;

        const chatData = {
            productId: product.id,
            sellerId: product.sellerId,
            buyerId: user.uid,
            productTitle: product.title,
            sellerName: product.sellerName || 'Vendeur',
            buyerName: user.displayName || 'Acheteur',
            sellerEmail: product.sellerEmail || null, // Assuming backend sends this or we don't need it
            buyerEmail: user.email || null
        };

        navigate('/chat/detail', { state: { activeChat: chatData } });
    };

    const updateProductStatus = async (status) => {
        setMarkingSold(true);
        try {
            const res = await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error("API Update Failed");

            addToast(status === 'sold' ? "Article marqué comme vendu !" : "Article remis en vente !", "success");
            navigate('/');
        } catch (err) {
            console.error(err);
            addToast("Erreur lors de la mise à jour.", "error");
        } finally {
            setMarkingSold(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative overflow-y-auto w-full">
            {/* Image Slider */}
            <div className="relative aspect-[4/5] w-full bg-slate-100 group">
                {/* Navigation Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between z-20 bg-gradient-to-b from-black/40 to-transparent">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <Share2 size={18} />
                    </button>
                </div>

                {/* Sold Overlay */}
                {isSold && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white text-slate-900 px-8 py-4 rounded-3xl font-black text-2xl uppercase tracking-widest shadow-2xl transform -rotate-6 border-4 border-slate-900">
                            Vendu
                        </div>
                    </div>
                )}

                {/* Images */}
                {/* Images */}
                <div
                    ref={scrollRef}
                    className="w-full h-full overflow-x-auto flex snap-x snap-mandatory no-scrollbar scroll-smooth relative"
                    onScroll={(e) => {
                        const scrollLeft = e.target.scrollLeft;
                        const width = e.target.offsetWidth;
                        setActiveImageIndex(Math.round(scrollLeft / width));
                    }}>
                    {displayImages.map((url, i) => (
                        <img key={i} src={url} className="w-full h-full object-cover flex-shrink-0 snap-center" alt="" />
                    ))}
                </div>

                {/* Navigation Arrows */}
                {displayImages.length > 1 && (
                    <>
                        {activeImageIndex > 0 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); scrollToIndex(activeImageIndex - 1); }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors z-20"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        {activeImageIndex < displayImages.length - 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); scrollToIndex(activeImageIndex + 1); }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors z-20"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </>
                )}

                {/* Indicators */}
                {displayImages.length > 1 && (
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-20">
                        {displayImages.map((_, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); scrollToIndex(i); }}
                                className={`h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm ${i === activeImageIndex ? 'bg-white w-6' : 'bg-white/40 w-1.5 hover:bg-white/60'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Product Info Card - Pull up effect */}
            <div className="flex-1 px-6 pt-8 pb-32 -mt-10 bg-white rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] relative z-30">
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 opacity-50" />

                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1 pr-4">
                        <div className="flex gap-2 mb-3 flex-wrap">
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md shadow-indigo-200">{product.category}</span>
                            {product.condition && <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-slate-200">{product.condition}</span>}
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight mb-2">{product.title}</h1>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin size={14} className="text-indigo-500" />
                            <span className="text-xs font-bold uppercase tracking-wide">{product.city || sellerData?.city || 'Localisation inconnue'}</span>
                        </div>
                    </div>
                    <div className="text-3xl font-black text-indigo-600 whitespace-nowrap tracking-tight">{product.price.toLocaleString()} <span className="text-sm align-top text-indigo-300">FCFA</span></div>
                </div>

                {/* Seller & Trust */}
                <div
                    onClick={() => navigate(`/profile/${product.sellerId}`)}
                    className="flex items-center justify-between bg-slate-50/80 p-4 rounded-2xl mb-8 border border-slate-100 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-100 transition-all active:scale-98"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-600 font-bold overflow-hidden border-2 border-white">
                            {product.sellerAvatar || sellerData?.photoURL ?
                                <img src={product.sellerAvatar || sellerData?.photoURL} alt="" className="w-full h-full object-cover" />
                                : (product.sellerName?.[0] || 'V')}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vendeur</div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                                {product.sellerName || sellerData?.displayName || 'Vendeur Anonyme'}
                                <CheckCircle size={12} className="text-emerald-500 fill-emerald-100" />
                            </div>
                        </div>
                    </div>
                    {sellerRating && (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-lg">
                                <span className="text-xs font-black text-amber-700">{sellerRating}</span>
                                <Star size={10} className="fill-amber-500 text-amber-500" />
                            </div>
                            <span className="text-[9px] text-slate-400 mt-1 font-medium">{sellerData?.ratingCount || 0} avis</span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="mb-8">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Tag size={14} className="text-slate-400" /> Description
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                        {product.description || "Aucune description fournie par le vendeur."}
                    </p>
                </div>

                {/* Safety Tip */}
                <div className="bg-indigo-50 p-4 rounded-2xl flex gap-3 items-start mb-8">
                    <ShieldCheck size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-xs font-bold text-indigo-900 mb-1">Achat sécurisé</h4>
                        <p className="text-[10px] text-indigo-700/80 leading-relaxed">
                            Ne payez jamais à l'avance. Rencontrez le vendeur dans un lieu public pour vérifier l'article avant l'achat.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-40 pb-6 flex gap-3">
                {isOwner ? (
                    <div className="flex-1 flex gap-3">
                        {isSold ? (
                            <Button onClick={() => updateProductStatus('active')} loading={markingSold} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200">
                                <RotateCw size={18} className="mr-2" /> Remettre en vente
                            </Button>
                        ) : (
                            <Button onClick={() => updateProductStatus('sold')} loading={markingSold} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 text-white">
                                <CheckCircle size={18} className="mr-2" /> Marquer Vendu
                            </Button>
                        )}
                        <Button onClick={() => navigate('/post', { state: { productToEdit: product } })} variant="secondary" className="px-4 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200">
                            Modifier
                        </Button>
                    </div>
                ) : (
                    <Button
                        onClick={onContact}
                        disabled={isSold}
                        className={`flex-1 py-4 text-base shadow-xl flex items-center justify-center gap-2 ${isSold ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-indigo-200 bg-gradient-to-r from-indigo-600 to-indigo-700'}`}
                    >
                        {isSold ? (
                            <>Cet article est vendu</>
                        ) : (
                            <> <MessageCircle size={20} /> Contacter le vendeur</>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default ProductDetail;
