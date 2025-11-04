

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product, Settings } from '../../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const MotionDiv = motion.div;

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <MotionDiv 
        layout
        whileHover={{ y: -4, scale: 1.02, boxShadow: "0px 10px 15px -3px rgba(0,0,0,0.05)" }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="bg-card dark:bg-dark-card rounded-lg shadow-md overflow-hidden cursor-pointer flex flex-col border border-border dark:border-dark-border"
        onClick={() => onAddToCart(product)}
    >
        <div className="relative">
            <img src={product.imageUrl || `https://placehold.co/300x300/e2e8f0/475569?text=${product.name.charAt(0)}`} alt={product.name} className="w-full h-32 object-cover"/>
            {product.stock <= 0 && product.productType === 'Inventory' && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-danger px-2 py-1 rounded">OUT OF STOCK</span>
                </div>
            )}
        </div>
        <div className="p-3 flex flex-col flex-grow">
            <h3 className="font-bold text-foreground dark:text-dark-foreground text-sm flex-grow">{product.name}</h3>
            <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted">{product.category}</p>
                <p className="text-primary dark:text-dark-primary font-bold">Ksh {product.price.toFixed(2)}</p>
            </div>
        </div>
    </MotionDiv>
);

const CubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const ProductListItem: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <MotionDiv
        layout
        whileHover={{
            borderColor: 'var(--tw-color-primary)',
            y: -2,
            boxShadow: '0 4px 12px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
        }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="bg-card dark:bg-dark-card rounded-lg shadow-sm overflow-hidden cursor-pointer flex items-center p-3 space-x-4 w-full border border-border dark:border-dark-border"
        onClick={() => onAddToCart(product)}
    >
        <div className="bg-muted dark:bg-dark-muted p-2 rounded-lg flex-shrink-0">
            <CubeIcon />
        </div>
        <div className="flex-grow min-w-0">
            <p className="font-bold text-foreground dark:text-dark-foreground truncate" title={product.name}>{product.name}</p>
            <p className="text-xs text-foreground-muted dark:text-dark-foreground-muted font-mono">SKU: {product.inventoryCode}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
             <p className="text-primary dark:text-dark-primary font-bold text-base">KES {product.price.toFixed(2)}</p>
             <div className="mt-1 inline-block px-2 py-0.5 rounded bg-black text-white text-xs font-bold">
                Stock: {product.stock}
             </div>
        </div>
    </MotionDiv>
);


interface ProductGridProps {
    products: Product[];
    onAddToCart: (product: Product) => void;
    settings: Settings;
}

const ProductGrid = ({ products, onAddToCart, settings }: ProductGridProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Automatically focus the search input for barcode scanning when the component mounts.
        searchInputRef.current?.focus();
    }, []);

    const categories = useMemo(() => {
        const topLevelCategories = new Set<string>();
        products.forEach(p => {
            if (p.category) {
                topLevelCategories.add(p.category.split(' > ')[0]);
            }
        });
        return ['All', ...Array.from(topLevelCategories).sort()];
    }, [products]);


    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const isCategoryMatch = selectedCategory === 'All' 
                || product.category === selectedCategory 
                || product.category.startsWith(selectedCategory + ' > ');
            
            if (!isCategoryMatch) return false;

            const searchTermLower = searchTerm.toLowerCase();
            const isSearchMatch = product.name.toLowerCase().includes(searchTermLower) || 
                                  product.inventoryCode.toLowerCase().includes(searchTermLower) ||
                                  (product.upc && product.upc.toLowerCase().includes(searchTermLower));
            
            return isSearchMatch;
        });
    }, [products, searchTerm, selectedCategory]);
    
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const searchTermTrimmed = searchTerm.trim().toLowerCase();
            // Attempt to find a product by Inventory Code or UPC when enter is pressed
            const foundProduct = products.find(p => 
                p.inventoryCode.trim().toLowerCase() === searchTermTrimmed ||
                (p.upc && p.upc.trim().toLowerCase() === searchTermTrimmed)
            );
            if (foundProduct) {
                e.preventDefault(); // Prevent any default form submission behavior
                onAddToCart(foundProduct);
                setSearchTerm(''); // Clear the search bar after adding
            }
        }
    };


    const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
    const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0">
                <div className="flex gap-4 items-center">
                    <div className="relative flex-grow">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground-muted dark:text-dark-foreground-muted absolute top-1/2 left-4 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-12 pr-4 py-3 rounded-lg bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground placeholder-foreground-muted dark:placeholder-dark-foreground-muted border border-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                        />
                    </div>
                     <div className="flex bg-muted dark:bg-dark-muted p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-content' : 'text-foreground-muted dark:text-dark-foreground-muted hover:bg-border dark:hover:bg-dark-border'}`}
                            aria-label="Grid view"
                        >
                           <GridIcon/>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-content' : 'text-foreground-muted dark:text-dark-foreground-muted hover:bg-border dark:hover:bg-dark-border'}`}
                            aria-label="List view"
                        >
                            <ListIcon/>
                        </button>
                    </div>
                </div>
                 <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                                selectedCategory === category 
                                ? 'bg-primary text-primary-content' 
                                : 'bg-muted text-foreground-muted hover:bg-border dark:bg-dark-muted dark:text-dark-foreground-muted dark:hover:bg-dark-border'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
             <div className="flex-grow overflow-y-auto mt-4 pr-1">
                 {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                         {filteredProducts.map(product => (
                            <ProductListItem key={product.id} product={product} onAddToCart={onAddToCart} />
                        ))}
                    </div>
                )}
                 {filteredProducts.length === 0 && (
                    <div className="text-center py-10 text-foreground-muted dark:text-dark-foreground-muted">
                        <p>No products found matching your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGrid;