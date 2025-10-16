import React from 'react';
import './ProductGrid.css';

const ProductGrid = ({ products, onAddToCart }) => {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <div
          key={product.id}
          className="product-card"
          style={{ borderColor: product.color }}
          onClick={() => onAddToCart(product)}
        >
          <div className="product-image" style={{ background: product.color }}>
            <span className="product-emoji">{product.image}</span>
          </div>
          <div className="product-info">
            <div className="product-name">{product.name}</div>
            <div className="product-price">{product.price.toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;
