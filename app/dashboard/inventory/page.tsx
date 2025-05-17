'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function InventoryDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResults, setSyncResults] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/products?includeInventory=true')
      const data = await response.json()
      
      if (data.products) {
        setProducts(data.products)
      } else {
        toast.error('Failed to load products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error loading products')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncInventory = async () => {
    try {
      setIsSyncing(true)
      setSyncResults(null)
      
      const response = await fetch('/api/inventory/sync-all-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Processed ${data.processed} orders`)
        setSyncResults(data)
        // Refresh products to show updated inventory
        fetchProducts()
      } else {
        toast.error(data.error || 'Failed to sync inventory')
      }
    } catch (error) {
      console.error('Error syncing inventory:', error)
      toast.error('Failed to sync inventory')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="space-x-4">
          <button 
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            onClick={fetchProducts}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Products'}
          </button>
          <button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
            onClick={handleSyncInventory}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync Inventory from Orders'}
          </button>
        </div>
      </div>
      
      {syncResults && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <h2 className="font-semibold text-lg mb-2">Sync Results</h2>
          <p>Processed {syncResults.processed} orders</p>
          <div className="mt-2">
            <h3 className="font-medium">Details:</h3>
            <ul className="list-disc pl-5 mt-1">
              {syncResults.results && syncResults.results.map((result: any, index: number) => (
                <li key={index}>
                  Order {result.orderId}: {result.success ? 'Success' : 'Failed'} 
                  {result.updates && ` - ${result.updates} product(s) updated`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Product Inventory</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage inventory levels for all products and variants
          </p>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No products found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product: any) => (
                  <React.Fragment key={product._id || product.id}>
                    {product.inventory?.variants?.length > 0 ? (
                      product.inventory.variants.map((variant: any, index: number) => (
                        <tr key={`${product._id || product.id}-${variant.size}-${variant.color}-${index}`}>
                          {index === 0 ? (
                            <td rowSpan={product.inventory.variants.length} className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {product.selectedImages && product.selectedImages[0] && (
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={product.selectedImages[0]} 
                                      alt={product.name || product.title} 
                                    />
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name || product.title}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {product._id || product.id}
                                  </div>
                                </div>
                              </div>
                            </td>
                          ) : null}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              Size: {variant.size}
                            </div>
                            <div className="text-sm text-gray-500">
                              Color: {variant.color}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {variant.quantity} in stock
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              variant.quantity > 10 
                                ? 'bg-green-100 text-green-800' 
                                : variant.quantity > 0 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : 'bg-red-100 text-red-800'
                            }`}>
                              {variant.quantity > 10 
                                ? 'In Stock' 
                                : variant.quantity > 0 
                                  ? 'Low Stock' 
                                  : 'Out of Stock'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {product.selectedImages && product.selectedImages[0] && (
                                <img 
                                  className="h-10 w-10 rounded-full object-cover" 
                                  src={product.selectedImages[0]} 
                                  alt={product.name || product.title} 
                                />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {product.name || product.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {product._id || product.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            No variants
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.stock || 0} in stock
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            !product.stock || product.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {!product.stock || product.stock === 0 ? 'No inventory tracking' : 'Basic tracking'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 