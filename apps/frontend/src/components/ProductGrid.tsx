import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useProductStore } from '../store/useProductStore';
import { useSiteStore } from '../store/useSiteStore';
import './ProductGrid.css';

const ProductGrid: React.FC = () => {
  const { products } = useProductStore();
  const { gridTitle, bestsellerIds } = useSiteStore();
  const homeProducts = products.slice(0, 8);

  return (
    <section className="product-section container">
      <h2 className="section-title">{gridTitle}</h2>
      <div className="product-grid">
        {homeProducts.map(product => (
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
      <div className="view-all-container">
        <Link to="/shop" className="btn-primary">VIEW ALL PERFUMES</Link>
      </div>
    </section>
  );
};

export default ProductGrid;
