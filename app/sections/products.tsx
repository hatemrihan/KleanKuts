"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface SizeStock {
  size: string;
  stock: number;
  isPreOrder: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  discount?: number;
  sizes: SizeStock[];
}

// Updated product data with size-specific stock information
const products: Product[] = [
  {
    id: 1,
    name: '01 Sage set in Rich brown',
    price: 1300,
    images: [
      '/images/model-image.jpg',
      '/images/modeltwo-image.jpg',
      '/images/modelthree-image.jpg',
      '/images/modelfour-image.jpg'
    ],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 2,
    name: '02 Sage set in light beige',
    price: 1300,
    images: [
      '/images/malak-image.jpg',
      '/images/malaktwo-image.jpg',
      '/images/malakthree-image.jpg',
      '/images/malakfour-image.jpg',
      '/images/malakfive-image.jpg',
      '/images/malaksix-image.jpg'
    ],
    sizes: [
      { size: 'S', stock: 7, isPreOrder: false },
      { size: 'M', stock: 20, isPreOrder: false }
    ]
  },
  {
    id: 3,
    name: 'Sage top in Rich brown',
    price: 700,
    images: [
      '/images/modelsix-image.jpg',
      '/images/modeleight-image.jpg',
      '/images/modelseven-image.jpg',
      '/images/modelnine-image.jpg'
    ],
    sizes: [
      { size: 'S', stock: 9, isPreOrder: false },
      { size: 'M', stock: 13, isPreOrder: false }
    ]
  },
  {
    id: 4,
    name: 'Sage top in light beige',
    price: 700,
    images: [
      '/images/malakfive-image.jpg',
      '/images/malaksix-image.jpg',
      '/images/malakthree-image.jpg'
    ],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 5,
    name: 'Sage pants in rich brown',
    price: 600,
    images: [
      '/images/pantmodel-image.jpg',
      '/images/pantmodeltwo-image.jpg',
      '/images/pantmodelthree-image.jpg',
      '/images/pantmodelfour-image.jpg',
      '/images/pantmodelfive-image.jpg'
    ],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ]
  },
  {
    id: 6,
    name: 'Sage pants in light beige',
    price: 600,
    images: [
      '/images/malakpant-image.jpg',
      '/images/pantmalaktwo-image.jpg',
      '/images/pantmalakthree-image.jpg'
    ],
    sizes: [
      { size: 'S', stock: 0, isPreOrder: true },
      { size: 'M', stock: 0, isPreOrder: true }
    ]
  }
];

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getStockStatus = () => {
    const allPreOrder = product.sizes.every(size => size.isPreOrder);
    if (allPreOrder) {
      return { text: 'SOLD OUT', class: 'bg-black text-white' };
    }
    return null;
  };

  const stockStatus = getStockStatus();

  return (
    <div className="relative">
      <Link 
        href={`/product/${product.id}`}
        className="group relative block bg-gray-100 overflow-hidden"
      >
        {/* Product Images */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={product.images[currentImageIndex]}
            alt={`${product.name} - Image ${currentImageIndex + 1}`}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            priority={product.id <= 3}
          />
          
          {/* Image Thumbnails */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* Status Badge */}
          {stockStatus && (
            <div className="absolute top-3 right-3 z-20 bg-black text-white px-4 py-2 text-sm font-semibold rounded">
              {stockStatus.text}
            </div>
          )}

          {/* Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex((prev) => 
                    prev === 0 ? product.images.length - 1 : prev - 1
                  );
                }}
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/50"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentImageIndex((prev) => 
                    prev === product.images.length - 1 ? 0 : prev + 1
                  );
                }}
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-light text-black mb-2">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-black">L.E {product.price}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};

const Products = () => {
  const tops = products.filter(product => product.id === 3 || product.id === 4);
  const pants = products.filter(product => product.id === 5 || product.id === 6);

  return (
    <section className="w-full bg-white py-16 px-4 md:px-8">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Best Sellers</h2>
        <p className="text-gray-500 text-sm md:text-base">Featured products & New collections</p>
      </div>

      {/* Original Desktop/Tablet Grid - Hidden on Mobile */}
      <div className="max-w-7xl mx-auto hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Mobile Only Layout */}
      <div className="md:hidden max-w-7xl mx-auto">
        {/* Sets */}
        <div className="grid grid-cols-1 gap-6">
          {products.slice(0, 2).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Tops Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-light mb-6">SAGE TOPS</h3>
          <div className="relative w-full overflow-x-auto hide-scrollbar">
            <div className="flex space-x-4">
              {tops.map((product) => (
                <div key={product.id} className="flex-none w-[85vw]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pants Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-light mb-6">SAGE PANTS</h3>
          <div className="relative w-full overflow-x-auto hide-scrollbar">
            <div className="flex space-x-4">
              {pants.map((product) => (
                <div key={product.id} className="flex-none w-[85vw]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

export default Products
