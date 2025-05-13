import { Suspense } from 'react';
import Nav from './sections/nav';
import NewHeader from './sections/newHeader';
import Introducing from './sections/Introducing';
import MovingWords from './sections/MovingWords';
import FAQs from './sections/Faqs';
import Products from './sections/products';
import NewFooter from './sections/NewFooter';
import Waitlist from './sections/Waitlist';

export default function Home() {
  return (
    <>
    <Nav /><Waitlist />
    </>
    // <Suspense fallback={<div>Loading...</div>}>
     
   
   
  );
}
