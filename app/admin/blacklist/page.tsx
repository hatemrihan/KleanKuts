'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface BlacklistItem {
  productId: string
  reason: string
  blacklistedAt: string
  productDetails: any
  isInRecycleBin: boolean
  _id: string
}

export default function BlacklistManagementPage() {
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newProductId, setNewProductId] = useState('')
  const [newReason, setNewReason] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)

  // Load blacklist data when the page loads
  useEffect(() => {
    fetchBlacklist()
  }, [])

  // Fetch blacklist data from the API
  const fetchBlacklist = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products/blacklist/details')
      const data = await response.json()
      
      if (data.success) {
        setBlacklist(data.blacklist)
      } else {
        toast.error('Failed to load blacklist')
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error)
      toast.error('Error loading blacklist')
    } finally {
      setLoading(false)
    }
  }

  // Add a product to the blacklist
  const addToBlacklist = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProductId) {
      toast.error('Product ID is required')
      return
    }
    
    try {
      setAddingProduct(true)
      const response = await fetch('/api/products/blacklist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: newProductId,
          reason: newReason || 'Manually added from admin panel'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Product ${newProductId} added to blacklist`)
        setNewProductId('')
        setNewReason('')
        fetchBlacklist()
      } else {
        toast.error(data.message || 'Failed to add product to blacklist')
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error)
      toast.error('Error adding product to blacklist')
    } finally {
      setAddingProduct(false)
    }
  }

  // Remove a product from the blacklist
  const removeFromBlacklist = async (productId: string) => {
    if (!confirm(`Are you sure you want to remove product ${productId} from the blacklist?`)) {
      return
    }
    
    try {
      const response = await fetch('/api/products/blacklist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Product ${productId} removed from blacklist`)
        fetchBlacklist()
      } else {
        toast.error(data.message || 'Failed to remove product from blacklist')
      }
    } catch (error) {
      console.error('Error removing from blacklist:', error)
      toast.error('Error removing product from blacklist')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Product Blacklist Management</h1>
        <Link href="/admin/products" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded">
          Back to Products
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Product to Blacklist</h2>
        <form onSubmit={addToBlacklist} className="space-y-4">
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
              Product ID
            </label>
            <input
              type="text"
              id="productId"
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter product ID"
              required
            />
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason (optional)
            </label>
            <input
              type="text"
              id="reason"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Reason for blacklisting"
            />
          </div>
          <button
            type="submit"
            disabled={addingProduct}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {addingProduct ? 'Adding...' : 'Add to Blacklist'}
          </button>
        </form>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Blacklisted Products</h2>
        
        {loading ? (
          <div className="p-6 text-center">Loading blacklist data...</div>
        ) : blacklist.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No products in the blacklist</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blacklisted At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {blacklist.map((item) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.productId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.productDetails?.title || item.productDetails?.name || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.blacklistedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.isInRecycleBin ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          In Recycle Bin
                        </span>
                      ) : item.productDetails?.note ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Not Found
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => removeFromBlacklist(item.productId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove from Blacklist
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
