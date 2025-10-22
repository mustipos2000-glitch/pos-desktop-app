import React from 'react';
import './css/ProductGrid.css';

const ProductGrid = ({ products, onAddToCart }) => {
  // Function to determine if the image is a URL or emoji
  const isImageUrl = (image) => {
    return image && (image.startsWith('http') || image.startsWith('/uploads/'));
  };

  return (
    <div className="product-grid">
      {products.map((product) => (
        <div
          key={product.id}
          className="product-card"
          // style={{ borderColor: product.color }}
          onClick={() => onAddToCart(product)}
        >
          <div className="product-image" style={{ background: product.color }}>
            {isImageUrl(product.image) ? (
              <img 
                src={`http://localhost:5000${product.image}`} 
                alt={product.name} 
                className="product-image-img"
              />
            ) : (
              <span className="product-emoji">{product.image || '📦'}</span>
            )}
          </div>
          <div className="product-info">
            <div className="product-name">{product.name}</div>
            <div className="product-price">€{product.price.toFixed(2)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGrid;