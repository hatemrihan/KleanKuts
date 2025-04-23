import React from 'react'
import { useCart } from '../context/CartContext'
import { useRouter } from 'next/navigation'

export default function Cart() {
  const { cart, removeFromCart, updateQuantity } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    // Remove authentication check
    router.push('/checkout')
  }

  return (
    <div className="flex flex-col h-full">
      {cart.length === 0 ? (
        <p className="text-center py-8">Your cart is empty</p>
      ) : (
        <>
          <div className="flex-1 overflow-auto">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-4 mb-4 p-4 border-b">
                <div className="flex-1">
                  <p className="font-light">{item.name}</p>
                  <p className="text-sm text-gray-500">Size: {item.size} × {item.quantity}</p>
                  <p className="text-sm">L.E {item.price}</p>
                </div>
                <button onClick={() => removeFromCart(item.id, item.size)} className="text-red-500">
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={handleCheckout}
              className="w-full bg-black text-white py-4 hover:bg-gray-900 transition-colors"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        </>
      )}
    </div>
  )
} 