'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '../context/CartContext'
import Nav from '../sections/nav'

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  apartment: string;
  city: string;
  notes: string;
}

const shippingCosts = {
  'Cairo': 70,
  'Giza': 70,
  'Alexandria': 70,
  'Qailyoubiya': 70,
  'Buhirah': 75,
  'Gharbia': 75,
  'Munofiya': 75,
  'Damietta': 75,
  'Qalub': 75,
  'Dakahliya': 75,
  'Kafr-Elshiekh': 75,
  'Sharkia': 75,
  'Al-Ismailiyyah': 75,
  'Port-Said': 75,
  'Suez': 75,
  'Fayoum': 100,
  'Bani-Suwayf': 100,
  'Minya': 111,
  'Asyout': 111,
  'Souhag': 111,
  'Qena': 120,
  'Aswan': 120,
  'Luxor': 120,
  'Marsa Matrouh': 130,
} as const;

type City = keyof typeof shippingCosts;

const CheckoutPage = () => {
  const router = useRouter()
  const { cart, cartTotal, clearCart } = useCart()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    apartment: '',
    city: '',
    notes: ''
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const shippingCost = formData.city ? shippingCosts[formData.city as City] || 0 : 0
  const totalWithShipping = cartTotal + shippingCost

  if (cart.length === 0) {
    router.push('/cart')
    return null
  }

  const validateForm = () => {
    const newErrors: Partial<FormData> = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.city) newErrors.city = 'Please select a city'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          products: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            image: item.image,
            discount: item.discount
          })),
          total: totalWithShipping,
          shippingCost
        }),
      })

      const data = await response.json()

      if (response.ok) {
        clearCart()
        window.location.href = '/thank-you'
      } else {
        throw new Error(data.error || 'Something went wrong')
      }
    } catch (error) {
      alert('Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-white pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-8">
            <span>←</span>
            <span>Back to cart</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-light mb-12">CHECKOUT</h1>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Checkout Form */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full p-3 border ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:border-black`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full p-3 border ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      } focus:outline-none focus:border-black`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:border-black`}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:border-black`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:border-black`}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apartment *
                  </label>
                  <input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${
                      errors.apartment ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:border-black`}
                  />
                  {errors.apartment && (
                    <p className="text-red-500 text-sm mt-1">{errors.apartment}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:border-black bg-white`}
                  >
                    <option value="">Select a city</option>
                    {Object.entries(shippingCosts).map(([city, cost]) => (
                      <option key={city} value={city}>
                        {city} (Shipping: L.E {cost})
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 border border-gray-300 focus:outline-none focus:border-black"
                  />
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-80 space-y-6">
              <h2 className="text-xl font-light">ORDER SUMMARY</h2>
              
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4">
                    <div className="relative w-16 h-16">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-light">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Size: {item.size} × {item.quantity}
                      </p>
                      {item.discount ? (
                        <p className="text-red-500">
                          L.E {((item.price * (1 - item.discount/100)) * item.quantity).toFixed(0)}
                        </p>
                      ) : (
                        <p>L.E {(item.price * item.quantity).toFixed(0)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 py-4 border-t border-b">
                <div className="flex justify-between text-sm">
                  <span>Shipping (3-5 Business Days)</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>L.E {cartTotal.toFixed(0)}</span>
                </div>
              </div>

              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>L.E {totalWithShipping.toFixed(0)}</span>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 hover:bg-gray-900 transition-colors disabled:bg-gray-400"
              >
                {isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
              </button>

              <p className="text-sm text-gray-500 text-center">
                Pay on delivery
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default CheckoutPage 