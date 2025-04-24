import { Suspense } from 'react';
import Nav from './sections/nav';
import NewHeader from './sections/newHeader';
import Introducing from './sections/Introducing';
import MovingWords from './sections/MovingWords';
import FAQs from './sections/Faqs';
import Footer from './sections/footer';
import Products from './sections/products';

export default function Home() {
  return (
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
  );
}
