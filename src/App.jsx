import { useState, useEffect } from 'react'
import InventoryForm from './components/InventoryForm'
import InventoryList from './components/InventoryList'
import SearchBar from './components/SearchBar'

export default function App() {
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState(false)

  // Load items from localStorage on mount
  useEffect(() => {
    const savedItems = localStorage.getItem('pharmacyInventory')
    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems))
      } catch (error) {
        console.error('Error loading items:', error)
      }
    }
  }, [])

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pharmacyInventory', JSON.stringify(items))
  }, [items])

  const handleAddItem = (newItem) => {
    setItems([...items, { ...newItem, id: Date.now() }])
  }

  const handleDeleteItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleUpdateItem = (id, updatedItem) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ))
  }

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.description.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower)
    )
  })

  // Filter items expiring soon (within 3 months)
  const itemsExpiringWithin3Months = items.filter(item => {
    const expiryDate = getExpiryDateAsDate(item.expiryDate)
    if (!expiryDate) return false
    
    const today = new Date()
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
    
    return expiryDate >= today && expiryDate <= threeMonthsFromNow
  })

  const getExpiryDateAsDate = (expiryDate) => {
    if (!expiryDate) return null

    if (expiryDate.includes('/')) {
      const [month, year] = expiryDate.split('/').map(Number)
      if (!month || !year) return null
      return new Date(year, month - 1, 1)
    }

    const parsedDate = new Date(expiryDate)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pharmacy Inventory Tracker
              </h1>
              <p className="text-gray-600 mt-1">Manage pharmaceutical inventory and expiration dates</p>
            </div>
            <div className="text-sm text-gray-600">
              Total Items: <span className="font-bold text-lg text-blue-600">{items.length}</span>
              {itemsExpiringWithin3Months.length > 0 && (
                <div className="text-red-600 font-semibold mt-2">
                  ⚠️ {itemsExpiringWithin3Months.length} expiring soon
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
          <button
            onClick={() => setFilterActive(!filterActive)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterActive
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {filterActive ? '🔴 Expiring Soon' : 'Show All'}
          </button>
        </div>

        {/* Form Section */}
        <div className="mb-8">
          <InventoryForm onAddItem={handleAddItem} />
        </div>

        {/* List Section */}
        <div>
          {filteredItems.length === 0 && items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items yet</h3>
              <p className="text-gray-600">Add your first pharmaceutical item using the form above.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your search term.</p>
            </div>
          ) : (
            <InventoryList 
              items={filterActive ? itemsExpiringWithin3Months : filteredItems}
              onDeleteItem={handleDeleteItem}
              onUpdateItem={handleUpdateItem}
            />
          )}
        </div>
      </main>
    </div>
  )
}
