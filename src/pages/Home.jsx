import React from 'react';
import { Search, ShoppingBag, MapPin, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../components/Badge';

function Home({ products, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, isSearchFocus = false }) {
    const navigate = useNavigate();

    const filteredProducts = products.filter(p => {
        const titleMatch = (p.title || "").toLowerCase().includes((searchQuery || "").toLowerCase());
        const catMatch = !categoryFilter || categoryFilter === "Tout" || p.category === categoryFilter;
        return titleMatch && catMatch;
    });

    return (
        <div className="p-6 flex flex-col gap-6">
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                </div>
                <input
                    autoFocus={isSearchFocus}
                    type="text"
                    placeholder="Rechercher un trésor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4.5 pl-12 pr-4 shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
                {['Tout', 'Vêtements', 'Meubles', 'Électronique', 'Loisirs', 'Maison'].map(cat => (
                    <Badge key={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(cat)}>{cat}</Badge>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-5 mb-10">
                {filteredProducts.map(product => (
                    <div key={product.id} onClick={() => navigate(`/product/${product.id}`)} className="group cursor-pointer">
                        <div className="aspect-[4/5] bg-slate-100 rounded-[28px] relative overflow-hidden shadow-sm transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>
                            )}
                            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl text-sm font-black text-indigo-600 shadow-lg">{product.price} FCFA</div>
                        </div>
                        <div className="mt-3 px-2">
                            <h3 className="font-bold text-slate-800 line-clamp-1 text-sm group-hover:text-indigo-600 transition-colors">{product.title}</h3>
                            <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                                <MapPin size={10} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{product.city || 'Partout'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-24 flex flex-col items-center gap-4 text-slate-300">
                    <ShoppingBag size={48} strokeWidth={1} />
                    <p className="text-sm font-bold uppercase tracking-widest">Aucun article trouvé</p>
                </div>
            )}
        </div>
    );
}

export default Home;
