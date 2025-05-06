'use client'

import React, { useState, useEffect } from 'react'
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
  const [orderError, setOrderError] = useState<string | null>(null)

  const shippingCost = formData.city ? shippingCosts[formData.city as City] || 0 : 0
  const totalWithShipping = cartTotal + shippingCost

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/cart')
    }
  }, [cart, router])

  if (typeof window === 'undefined' || cart.length === 0) {
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
    
    // Reset any previous error
    setOrderError(null)
    
    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // First, send to our main API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            address: `${formData.address.trim()}${formData.apartment ? ', ' + formData.apartment.trim() : ''}${formData.city ? ', ' + formData.city : ''}`
          },
          products: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            image: item.image
          })),
          totalAmount: totalWithShipping,
          status: 'pending',
          notes: formData.notes || '',
          orderDate: new Date().toISOString()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        try {
          // Then, send to admin panel API
          console.log('Sending order to admin panel...');
          const adminResponse = await fetch('https://kleankutsadmin.netlify.app/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': 'https://kleankuts.shop'
            },
            body: JSON.stringify({
              firstName: formData.firstName.trim(),
              lastName: formData.lastName.trim(),
              phone: formData.phone.trim(),
              email: formData.email.trim(),
              address: formData.address.trim(),
              apartment: formData.apartment.trim(),
              city: formData.city,
              notes: formData.notes || '',
              products: cart.map(item => ({
                productId: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                image: item.image
              })),
              total: Number(totalWithShipping.toFixed(0))
            })
          });

          console.log('Admin panel response status:', adminResponse.status);
          const adminData = await adminResponse.json();
          console.log('Admin panel response:', adminData);

          if (!adminResponse.ok) {
            console.error('Admin panel error:', adminData.error || 'Failed to sync with admin panel');
            // Main order was successful, so we still proceed
          }

          // First clear cart and redirect to thank you page
          clearCart();
          // Set flag that order was completed successfully
          sessionStorage.setItem('orderCompleted', 'true');
          // Use a tiny delay to ensure the flag is saved before navigation
          setTimeout(() => {
            router.push('/thank-you');
          }, 100);
        } catch (adminError: any) {
          console.error('Admin panel error:', adminError);
          // Even if admin panel fails, we still want to proceed since the main order was successful
          clearCart();
          // Set flag that order was completed successfully
          sessionStorage.setItem('orderCompleted', 'true');
          // Use a tiny delay to ensure the flag is saved before navigation
          setTimeout(() => {
            router.push('/thank-you');
          }, 100);
        }
      } else {
        // Main API order failed
        const errorMessage = data.error || data.details?.join(', ') || 'Something went wrong with your order'
        setOrderError(errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error: any) {
      console.error('Order submission error:', error)
      setOrderError(error.message || 'Failed to place order. Please try again.')
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
    // Clear order error when user changes any form field
    if (orderError) {
      setOrderError(null)
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

          {orderError && (
            <div className="mb-8 p-4 bg-red-50 border border-red-300 text-red-700 rounded">
              <h3 className="font-medium mb-2">Order Submission Failed</h3>
              <p>{orderError}</p>
              <p className="mt-2 text-sm">Please check your information and try again, or contact support if the problem persists.</p>
            </div>
          )}

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
                    Apartment
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
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className={`w-full p-3 border ${
                      errors.notes ? 'border-red-500' : 'border-gray-300'
                    } focus:outline-none focus:border-black`}
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full p-3 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default CheckoutPage