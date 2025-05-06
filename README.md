# KleanKuts E-commerce Platform

This is a Next.js e-commerce application for KleanKuts, featuring product listings, shopping cart, and checkout functionality.

## Features

- Product catalog with filtering by categories
- Product detail pages with size and color selection
- Shopping cart functionality
- Checkout process
- Responsive design for mobile and desktop

## Cloudinary Integration

The application uses Cloudinary for image storage and optimization:

- All product images are stored in Cloudinary instead of the local file system
- Image URLs follow the format: `https://res.cloudinary.com/dvcs7czio/image/upload/v1234567890/samples/ecommerce/abcdef123456.jpg`
- Images are optimized using Cloudinary transformations for different device sizes and use cases

### Image Optimization

The application uses the following Cloudinary transformations for optimal performance:

- Thumbnails: `w_200,c_limit,q_auto,f_auto`
- Mobile: `w_600,c_limit,q_auto,f_auto`
- Desktop: `w_1200,c_limit,q_auto,f_auto`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

The application is deployed at:
- Frontend: https://kleankuts.shop/
- Admin Panel: https://kleankutsadmin.netlify.app/
