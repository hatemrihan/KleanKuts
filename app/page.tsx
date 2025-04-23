import { Suspense } from 'react';
import Nav from './sections/nav';
import NewHeader from './sections/newHeader';
import Introducing from './sections/Introducing';
import MovingWords from './sections/MovingWords';
import FAQs from './sections/Faqs';
import Footer from './sections/footer';
import Products from './sections/products';

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <div className="error-boundary">
      try {'{'}
        {children}
      {'}'} catch (error) {'{'}
        <div className="error-message">
          Something went wrong. Please try again later.
        </div>
      {'}'}
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <Nav />
        <NewHeader />
        <MovingWords />
        <Introducing />
        <MovingWords />
        <Products />
        <FAQs />
        <Footer />
      </Suspense>
    </ErrorBoundary>
  );
}
