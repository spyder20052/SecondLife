import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../firebase';
import Input from '../components/Input';

function Discover() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("Tout");

    // Masonry columns
    const [leftCol, setLeftCol] = useState([]);
    const [rightCol, setRightCol] = useState([]);

    const categories = ["Tout", "Vêtements", "Meubles", "Électronique", "Loisirs", "Sport", "Maison"];

    useEffect(() => {
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'products');
        const unsub = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        let res = products;
        if (activeCategory !== "Tout") {
            res = res.filter(p => p.category === activeCategory);
        }
        if (search.trim()) {
            res = res.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));
        }
        setFilteredProducts(res);
    }, [products, activeCategory, search]);

    useEffect(() => {
        // Distribute items into two columns for masonry effect
        const left = [];
        const right = [];
        filteredProducts.forEach((item, index) => {
            if (index % 2 === 0) left.push(item);
            else right.push(item);
        });
        setLeftCol(left);
        setRightCol(right);
    }, [filteredProducts]);

    const ProductCard = ({ product }) => (
        <div onClick={() => navigate(`/product/${product.id}`)} className="bg-white rounded-[24px] overflow-hidden mb-4 shadow-sm border border-slate-100 break-inside-avoid relative group active:scale-95 transition-transform cursor-pointer">
            <div className="relative">
                <img src={product.imageUrl} alt="" className="w-full h-auto object-cover" />
                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart size={14} />
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-black text-slate-800 text-sm mb-1 leading-tight">{product.title}</h3>
                <p className="text-indigo-600 font-bold text-xs">{product.price}€</p>
                <div className="mt-2 flex gap-1 flex-wrap">
                    <span className="text-[9px] px-2 py-1 bg-slate-50 text-slate-400 rounded-lg font-bold uppercase tracking-wide">{product.category}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-slate-50 flex flex-col">
            <div className="p-6 pb-2 bg-white rounded-b-[32px] shadow-sm z-10">
                <h1 className="text-3xl font-black text-slate-900 mb-6">Découvrir</h1>
                <div className="relative mb-6">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une pépite..."
                        className="w-full bg-slate-50 border-none outline-none rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-600 placeholder:text-slate-300 transition-all focus:bg-indigo-50 focus:text-indigo-900"
                    />
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 text-slate-300">
                        <Search size={20} />
                    </div>
                </div>

                {/* Categories Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`flex-shrink-0 px-6 py-3 rounded-2xl font-black text-xs transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 content-visibility-auto">
                {/* Masonry Grid Layout manually created with 2 columns */}
                <div className="flex gap-4 items-start">
                    <div className="flex-1 flex flex-col">
                        {leftCol.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                    <div className="flex-1 flex flex-col mt-8"> {/* Offset right column */}
                        {rightCol.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </div>
                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 text-slate-400 font-bold">
                        Aucun résultat trouvée :/
                    </div>
                )}
            </div>
        </div>
    );
}

export default Discover;
