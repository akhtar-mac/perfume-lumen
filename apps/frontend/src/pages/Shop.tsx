import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import './Shop.css';

const Shop: React.FC = () => {
  const products = useProductStore(state => state.products);
  const bestsellerIds = useSiteStore(state => state.bestsellerIds);
  const [sortBy, setSortBy] = React.useState('default');

  const sortedProducts = React.useMemo(() => {
    let sorted = [...products];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'reviews':
        sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case 'bestseller':
        sorted.sort((a, b) => {
          const aIsBest = bestsellerIds.includes(a.id) ? 1 : 0;
          const bIsBest = bestsellerIds.includes(b.id) ? 1 : 0;
          return bIsBest - aIsBest;
        });
        break;
      default:
        break;
    }
    return sorted;
  }, [products, sortBy, bestsellerIds]);

  return (
    <div className="shop-page">
      <Header />
      <div className="shop-header">
        <div className="container">
          <h1>ALL PERFUMES 🛍️</h1>
          <p>Discover our complete collection of 30 designer-inspired fragrances 💎</p>
        </div>
      </div>
      <div className="container shop-container">
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
              <option value="bestseller">Bestsellers First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Best Rating</option>
              <option value="reviews">Most Reviews</option>
            </select>
          </div>
          <div className="results-count">
            Showing {sortedProducts.length} products
          </div>
        </div>
        <div className="product-grid">
          {sortedProducts.map(product => (
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
            />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Shop;
