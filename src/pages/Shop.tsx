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
        <div className="product-grid">
          {products.map(product => (
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
