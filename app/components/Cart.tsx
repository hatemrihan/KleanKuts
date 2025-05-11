import React from 'react'
import { useCart } from '../context/CartContext'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { optimizeCloudinaryUrl } from '../utils/imageUtils'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    // Remove authentication check
    router.push('/checkout')
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black text-black dark:text-white transition-colors duration-300">
      {cart.length === 0 ? (
        <p className="text-center py-8 text-gray-600 dark:text-gray-300">Your cart is empty</p>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-4 mb-4 p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                {item.image && (
                  <div className="w-16 h-16 relative flex-shrink-0">
                    <Image
                      src={optimizeCloudinaryUrl(item.image, { width: 100 })}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-light dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Size: {item.size} × {item.quantity}</p>
                  <p className="text-sm dark:text-white">L.E {item.price}</p>
                </div>
                <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-300">
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-4 hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors duration-300"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </>
      )}
    </div>
  )
} 