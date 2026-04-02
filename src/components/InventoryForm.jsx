import { useState } from 'react'

export default function InventoryForm({ onAddItem }) {
  const [formData, setFormData] = useState({
    sku: '',
    description: '',
    quantity: '',
    expiryDate: '',
    vendor: '',
    returnPolicy: '',
    pullOutDate: '',
    remarks: '',
    dateSignature: '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.quantity.trim()) newErrors.quantity = 'Quantity is required'
    if (!formData.expiryDate.trim()) newErrors.expiryDate = 'Expiry Date is required'
    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required'
    if (!formData.returnPolicy.trim()) newErrors.returnPolicy = 'Return Policy is required'
    if (!formData.pullOutDate.trim()) newErrors.pullOutDate = 'Pull-out Date is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return

    onAddItem({
      sku: formData.sku.trim(),
      description: formData.description.trim(),
      quantity: parseInt(formData.quantity) || 0,
      expiryDate: formData.expiryDate.trim(),
      vendor: formData.vendor.trim(),
      returnPolicy: formData.returnPolicy.trim(),
      pullOutDate: formData.pullOutDate.trim(),
      remarks: formData.remarks.trim(),
      dateSignature: formData.dateSignature.trim(),
    })

    setFormData({
      sku: '',
      description: '',
      quantity: '',
      expiryDate: '',
      vendor: '',
      returnPolicy: '',
      pullOutDate: '',
      remarks: '',
      dateSignature: '',
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Item</h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* SKU */}
        <div>
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
            SKU #
          </label>
          <input
            type="text"
            id="sku"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            placeholder="e.g., SKU12345"
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.sku
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Eltroxin 100mg"
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.description
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            QTY
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.quantity
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
        </div>

        {/* Expiry Date */}
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
            E.D. (MM/YYYY)
          </label>
          <input
            type="text"
            id="expiryDate"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/YYYY"
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.expiryDate
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.expiryDate && <p className="text-red-500 text-xs mt-1">{errors.expiryDate}</p>}
        </div>

        {/* Vendor */}
        <div>
          <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
            Vendor
          </label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            placeholder="Supplier name"
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.vendor
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
        </div>

        {/* Return Policy */}
        <div>
          <label htmlFor="returnPolicy" className="block text-sm font-medium text-gray-700 mb-1">
            Return Policy
          </label>
          <input
            type="text"
            id="returnPolicy"
            name="returnPolicy"
            value={formData.returnPolicy}
            onChange={handleChange}
            placeholder="e.g., 1 month before"
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.returnPolicy
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.returnPolicy && <p className="text-red-500 text-xs mt-1">{errors.returnPolicy}</p>}
        </div>

        {/* Pull-out Date */}
        <div>
          <label htmlFor="pullOutDate" className="block text-sm font-medium text-gray-700 mb-1">
            Pull-out Date
          </label>
          <input
            type="date"
            id="pullOutDate"
            name="pullOutDate"
            value={formData.pullOutDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 rounded-lg border-2 focus:outline-none transition-colors ${
              errors.pullOutDate
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.pullOutDate && <p className="text-red-500 text-xs mt-1">{errors.pullOutDate}</p>}
        </div>

        {/* Remarks */}
        <div className="md:col-span-2 lg:col-span-1">
          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">
            Remarks
          </label>
          <input
            type="text"
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            placeholder="e.g., No loose, Recall"
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Date & Signature */}
        <div className="md:col-span-2 lg:col-span-1">
          <label htmlFor="dateSignature" className="block text-sm font-medium text-gray-700 mb-1">
            Date & Signature
          </label>
          <input
            type="text"
            id="dateSignature"
            name="dateSignature"
            value={formData.dateSignature}
            onChange={handleChange}
            placeholder="Name and date"
            className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="w-full h-[40px] mt-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Item
          </button>
        </div>
      </form>
    </div>
  )
}
