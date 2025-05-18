"use client";

import React from 'react';
import Waitlist from '../sections/Waitlist';

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Optional video background */}
      <div className="fixed inset-0 w-full h-full z-0 opacity-50">
        <video 
          className="object-cover w-full h-full"
          autoPlay 
          muted 
          loop 
          playsInline
          src="/videos/waitlist.mp4"
        >
          Your browser does not support the video tag.
        </video>
      </div>
      
      {/* Waitlist content */}
      <div className="relative z-10">
        <Waitlist />
      </div>
    </div>
  );
} 