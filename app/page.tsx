import { Suspense } from 'react';
import Nav from './sections/nav';
import NewHeader from './sections/newHeader';
import Introducing from './sections/Introducing';
import MovingWords from './sections/MovingWords';
import FAQs from './sections/Faqs';
import Products from './sections/products';
import NewFooter from './sections/NewFooter';
import Waitlist from './sections/Waitlist';
import NewMovingWords from './sections/NewMovingWords';
import Hola from './sections/Hola';
import CategorySections from './sections/CategorySections';

export default function Home() {
  return (
    
    <>
      <Nav />
      {/* <Hola /> */}
     
     
      <Introducing />
      
      
      {/* Dynamic Category Sections from Admin Panel */}
      {/* <CategorySections /> */}
      
     
      <NewHeader />
      <NewMovingWords />
    <Products />
    <FAQs /> 
    <MovingWords/>
    <NewFooter />
      
     
    </>
  
); 
}
