import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, Sparkles, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Loader from '../components/Loader';

function Discover() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Tout");
    const [loading, setLoading] = useState(true);

    // Masonry columns
    const [leftCol, setLeftCol] = useState([]);
    const [rightCol, setRightCol] = useState([]);

    const categories = ["Tout", "Vêtements", "Meubles", "Électronique", "Loisirs", "Sport", "Maison"];

    // Fetch Products from API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('/api/products');
                if (!res.ok) throw new Error('Failed to fetch');
                const items = await res.json();
                setProducts(items);
            } catch (err) {
                console.error("Discover Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Filter Logic
    useEffect(() => {
        let res = products.filter(p => p.status !== 'sold'); // Hide sold items
        if (activeCategory !== "Tout") {
            res = res.filter(p => p.category === activeCategory);
        }
        if (search.trim()) {
            const lowerSearch = search.toLowerCase();
            res = res.filter(p =>
                p.title.toLowerCase().includes(lowerSearch) ||
                p.description?.toLowerCase().includes(lowerSearch) ||
                p.city?.toLowerCase().includes(lowerSearch)
            );
        }
        setFilteredProducts(res);
    }, [products, activeCategory, search]);

    // Masonry Layout
    useEffect(() => {
        const left = [];
        const right = [];
        filteredProducts.forEach((item, index) => {
            if (index % 2 === 0) left.push(item);
            else right.push(item);
        });
        setLeftCol(left);
        setRightCol(right);
    }, [filteredProducts]);

    const ProductCard = ({ product }) => {
        // Handle both older 'imageUrl' and newer 'images' array
        const displayImage = product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : null);

        return (
            <div onClick={() => navigate(`/product/${product.id}`)} className="bg-white rounded-[24px] overflow-hidden mb-4 shadow-sm border border-slate-100 break-inside-avoid relative group active:scale-95 transition-all cursor-pointer hover:shadow-xl hover:shadow-indigo-100/50">
                <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                    {displayImage ? (
                        <img src={displayImage} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag size={32} />
                        </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                        <Heart size={16} className="fill-white/20 hover:fill-rose-500 hover:text-rose-500 transition-colors" />
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight line-clamp-2">{product.title}</h3>
                    <div className="flex justify-between items-end mt-2">
                        <p className="text-indigo-600 font-black text-sm">{product.price.toLocaleString()} FCFA</p>
                        <span className="text-[9px] px-2 py-1 bg-slate-50 text-slate-400 rounded-lg font-bold uppercase tracking-wide">{product.category}</span>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <Loader />;

    return (
        <div className="h-full bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4 bg-white rounded-b-[40px] shadow-sm z-10 sticky top-0">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
                        Découvrir <Sparkles className="text-amber-400 fill-amber-400" size={20} />
                    </h1>
                </div>

                <div className="relative mb-6 group">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une pépite..."
                        className="w-full bg-slate-50 border-2 border-transparent outline-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-600 placeholder:text-slate-300 transition-all focus:bg-white focus:border-indigo-100 focus:shadow-lg focus:shadow-indigo-50"
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                        <Search size={20} />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6 mask-linear-fade">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full font-bold text-xs transition-all duration-300 
                                ${activeCategory === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300 scale-105 ring-4 ring-indigo-50'
                                    : 'bg-white text-slate-500 border border-slate-100 hover:border-indigo-100 hover:text-indigo-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 content-visibility-auto pb-24">
                <div className="flex gap-4 items-start">
                    <div className="flex-1 flex flex-col gap-4">
                        {leftCol.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                    <div className="flex-1 flex flex-col gap-4 mt-8">
                        {rightCol.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </div>

                {filteredProducts.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-1">Aucun résultat</h3>
                        <p className="text-slate-400 text-sm">Essayez d'autres mots-clés ou parcourez une autre catégorie.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Discover;
