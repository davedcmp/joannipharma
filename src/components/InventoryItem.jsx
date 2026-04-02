import { useState } from 'react'

export default function InventoryItem({ item, onDelete, onUpdate, isMobile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(item)

  const getExpiryStatusColor = (expiryDate) => {
    if (!expiryDate) return 'bg-gray-100 text-gray-800'
    
    const [month, year] = expiryDate.split('/').map(Number)
    if (!month || !year) return 'bg-gray-100 text-gray-800'
    
    const expiry = new Date(year, month - 1, 1)
    const today = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    
    if (expiry < today) {
      return 'bg-red-100 text-red-800 font-bold'
    } else if (expiry <= threeMonthsFromNow) {
      return 'bg-red-100 text-red-800 border-2 border-red-500'
    } else if (expiry <= new Date(today.getFullYear(), today.getMonth() + 6)) {
      return 'bg-yellow-100 text-yellow-800'
    } else {
      return 'bg-green-100 text-green-800'
    }
  }

  const handleEdit = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSave = () => {
    onUpdate(item.id, editData)
    setIsEditing(false)
  }

  if (isMobile) {
    // Mobile Card View
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
        {!isEditing ? (
          <>
            <div className="mb-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">SKU #</p>
                  <p className="font-bold text-gray-900">{item.sku}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-semibold ${getExpiryStatusColor(item.expiryDate)}`}>
                  {item.expiryDate || 'N/A'}
                </span>
              </div>
              <div className="mb-2">
                <p className="text-xs text-gray-600 font-semibold">Description</p>
                <p className="text-gray-800">{item.description}</p>
              </div>
              <div className="mb-2">
                <p className="text-xs text-gray-600 font-semibold">Quantity</p>
                <p className="text-gray-800 font-bold text-lg">{item.quantity}</p>
              </div>
              <div className="mb-2">
                <p className="text-xs text-gray-600 font-semibold">Vendor</p>
                <p className="text-gray-800">{item.vendor}</p>
              </div>
              <div className="mb-2">
                <p className="text-xs text-gray-600 font-semibold">Return Policy</p>
                <p className="text-gray-800">{item.returnPolicy}</p>
              </div>
              <div className="mb-2">
                <p className="text-xs text-gray-600 font-semibold">Pull-out Date</p>
                <p className="text-gray-800">{item.pullOutDate}</p>
              </div>
              {item.remarks && (
                <div className="mb-2">
                  <p className="text-xs text-gray-600 font-semibold">Remarks</p>
                  <p className="text-gray-800">{item.remarks}</p>
                </div>
              )}
              {item.dateSignature && (
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Date & Signature</p>
                  <p className="text-gray-800">{item.dateSignature}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex-1 px-3 py-2 bg-red-500 text-white rounded font-medium text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </>
        ) : (
          <EditForm 
            editData={editData}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isMobile={true}
          />
        )}
      </div>
    )
  } else {
    // Desktop Table Row View
    return (
      <tr className="hover:bg-gray-50 transition-colors">
        {!isEditing ? (
          <>
            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.sku}</td>
            <td className="px-6 py-4 text-sm text-gray-800">{item.description}</td>
            <td className="px-6 py-4 text-sm text-center text-gray-900 font-bold">{item.quantity}</td>
            <td className="px-6 py-4 text-center">
              <span className={`px-3 py-1 rounded text-sm font-semibold ${getExpiryStatusColor(item.expiryDate)}`}>
                {item.expiryDate || 'N/A'}
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-gray-800">{item.vendor}</td>
            <td className="px-6 py-4 text-sm text-gray-800">{item.returnPolicy}</td>
            <td className="px-6 py-4 text-sm text-gray-800">{item.pullOutDate}</td>
            <td className="px-6 py-4 text-sm text-gray-800">{item.remarks || '-'}</td>
            <td className="px-6 py-4 text-sm text-gray-800">{item.dateSignature || '-'}</td>
            <td className="px-6 py-4 text-center text-sm">
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </td>
          </>
        ) : (
          <td colSpan="10" className="px-6 py-4">
            <EditForm 
              editData={editData}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isMobile={false}
            />
          </td>
        )}
      </tr>
    )
  }
}

function EditForm({ editData, onEdit, onSave, onCancel, isMobile }) {
  if (isMobile) {
    return (
      <div className="space-y-3">
        <input
          type="text"
          value={editData.sku}
          onChange={(e) => onEdit('sku', e.target.value)}
          placeholder="SKU #"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="text"
          value={editData.description}
          onChange={(e) => onEdit('description', e.target.value)}
          placeholder="Description"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="number"
          value={editData.quantity}
          onChange={(e) => onEdit('quantity', parseInt(e.target.value) || 0)}
          placeholder="QTY"
          className="w-full px-2 py-2 border rounded text-sm"
          min="0"
        />
        <input
          type="text"
          value={editData.expiryDate}
          onChange={(e) => onEdit('expiryDate', e.target.value)}
          placeholder="MM/YYYY"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="text"
          value={editData.vendor}
          onChange={(e) => onEdit('vendor', e.target.value)}
          placeholder="Vendor"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="text"
          value={editData.returnPolicy}
          onChange={(e) => onEdit('returnPolicy', e.target.value)}
          placeholder="Return Policy"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="date"
          value={editData.pullOutDate}
          onChange={(e) => onEdit('pullOutDate', e.target.value)}
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="text"
          value={editData.remarks}
          onChange={(e) => onEdit('remarks', e.target.value)}
          placeholder="Remarks"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <input
          type="text"
          value={editData.dateSignature}
          onChange={(e) => onEdit('dateSignature', e.target.value)}
          placeholder="Date & Signature"
          className="w-full px-2 py-2 border rounded text-sm"
        />
        <div className="flex gap-2 pt-2">
          <button
            onClick={onSave}
            className="flex-1 px-3 py-2 bg-green-500 text-white rounded font-medium text-sm hover:bg-green-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-gray-400 text-white rounded font-medium text-sm hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  } else {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-5 gap-2">
          <input
            type="text"
            value={editData.sku}
            onChange={(e) => onEdit('sku', e.target.value)}
            placeholder="SKU #"
            className="px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            value={editData.description}
            onChange={(e) => onEdit('description', e.target.value)}
            placeholder="Description"
            className="px-2 py-1 border rounded text-sm"
          />
          <input
            type="number"
            value={editData.quantity}
            onChange={(e) => onEdit('quantity', parseInt(e.target.value) || 0)}
            placeholder="QTY"
            className="px-2 py-1 border rounded text-sm text-center"
            min="0"
          />
          <input
            type="text"
            value={editData.expiryDate}
            onChange={(e) => onEdit('expiryDate', e.target.value)}
            placeholder="MM/YYYY"
            className="px-2 py-1 border rounded text-sm text-center"
          />
          <input
            type="text"
            value={editData.vendor}
            onChange={(e) => onEdit('vendor', e.target.value)}
            placeholder="Vendor"
            className="px-2 py-1 border rounded text-sm"
          />
        </div>
        <div className="grid grid-cols-5 gap-2">
          <input
            type="text"
            value={editData.returnPolicy}
            onChange={(e) => onEdit('returnPolicy', e.target.value)}
            placeholder="Return Policy"
            className="px-2 py-1 border rounded text-sm"
          />
          <input
            type="date"
            value={editData.pullOutDate}
            onChange={(e) => onEdit('pullOutDate', e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            value={editData.remarks}
            onChange={(e) => onEdit('remarks', e.target.value)}
            placeholder="Remarks"
            className="px-2 py-1 border rounded text-sm"
          />
          <input
            type="text"
            value={editData.dateSignature}
            onChange={(e) => onEdit('dateSignature', e.target.value)}
            placeholder="Date & Signature"
            className="px-2 py-1 border rounded text-sm"
          />
          <div className="flex gap-1">
            <button
              onClick={onSave}
              className="flex-1 px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-2 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }
}
