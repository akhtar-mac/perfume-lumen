import React from 'react';
import ProductCard from '../components/ProductCard';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import './Shop.css';

const CATEGORIES = [
  { id: 'all', label: 'All Perfumes', icon: '🛍️' },
  { id: 'men', label: 'For Men', icon: '👔' },
  { id: 'women', label: 'For Women', icon: '💄' },
  { id: 'unisex', label: 'Unisex', icon: '✨' },
];

const Shop: React.FC = () => {
  const products = useProductStore(state => state.products);
  const bestsellerIds = useSiteStore(state => state.bestsellerIds);
  const [sortBy, setSortBy] = React.useState('default');
  const [activeCategory, setActiveCategory] = React.useState('all');

  const filteredProducts = React.useMemo(() => {
    let filtered = [...products];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'reviews':
        filtered.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case 'bestseller':
        filtered.sort((a, b) => {
          const aIsBest = bestsellerIds.includes(a.id) ? 1 : 0;
          const bIsBest = bestsellerIds.includes(b.id) ? 1 : 0;
          return bIsBest - aIsBest;
        });
        break;
      case 'new':
        filtered.sort((a, b) => {
          const aIsNew = a.badge === 'new' ? 1 : 0;
          const bIsNew = b.badge === 'new' ? 1 : 0;
          return bIsNew - aIsNew;
        });
        break;
      default:
        break;
    }
    return filtered;
  }, [products, sortBy, bestsellerIds, activeCategory]);

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="container">
          <h1>ALL PERFUMES 🛍️</h1>
          <p>Discover our complete collection of {products.length} designer-inspired fragrances 💎</p>
        </div>
      </div>
      <div className="container shop-container">
        {/* Category Filters */}
        <div className="category-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="cat-icon">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        <div className="shop-controls">
          <div className="sort-wrapper">
            <label htmlFor="sort">Sort By:</label>
            <select 
              id="sort" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="default">Recommended</option>
              <option value="new">New Arrivals First</option>
              <option value="bestseller">Bestsellers First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Best Rating</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>
          <div className="results-count">
            Showing {filteredProducts.length} products
          </div>
        </div>
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id}
              id={product.id}
              images={product.images}
              title={product.title}
              price={`₹${product.price}`}
              originalPrice={`₹${product.originalPrice}`}
              isBestseller={bestsellerIds.includes(product.id)}
              rating={product.rating}
              reviewsCount={product.reviewsCount}
              badge={product.badge}
            />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="no-results">
            <p>No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
