export default function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search by SKU or Description..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-3 pl-10 pr-4 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
      />
      <svg
        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  )
}
