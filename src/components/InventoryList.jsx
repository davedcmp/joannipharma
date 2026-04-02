import InventoryItem from './InventoryItem'

export default function InventoryList({ items, onDeleteItem, onUpdateItem }) {
  return (
    <div>
      {/* Mobile View - Cards */}
      <div className="block lg:hidden space-y-4">
        {items.map(item => (
          <InventoryItem
            key={item.id}
            item={item}
            onDelete={onDeleteItem}
            onUpdate={onUpdateItem}
            isMobile={true}
          />
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">SKU #</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Description</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">QTY</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">E.D.</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Vendor</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Return Policy</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Pull-out Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Remarks</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">Date & Signature</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <InventoryItem
                key={item.id}
                item={item}
                onDelete={onDeleteItem}
                onUpdate={onUpdateItem}
                isMobile={false}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
