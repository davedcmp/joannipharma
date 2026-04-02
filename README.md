# Pharmacy Inventory Tracker

A modern, mobile-responsive web application for tracking pharmaceutical inventory and managing expiration dates. **Zero dependencies** - built with vanilla HTML, React via CDN, and Tailwind CSS!

## Features

- ✅ **Mobile-First Design** - Responsive card-based interface for mobile, table view for desktop
- 📋 **Complete Inventory Management** - Add, edit, delete, and search pharmaceutical items
- 🔍 **Smart Search** - Filter by SKU or product description
- 🚨 **Color-Coded Expiry Dates** - Visual alerts for items expiring soon (within 3 months)
- 💾 **Persistent Storage** - LocalStorage integration for data persistence
- 📊 **Responsive Tables** - Desktop optimized table view with all data fields
- 🎨 **Clean UI** - Built with Tailwind CSS for a modern, professional interface
- ⚡ **No Build Required** - Single HTML file with CDN libraries

## Data Fields

- **SKU #** - Unique identifier for the product
- **Description** - Medicine name and dosage (e.g., Eltroxin 100mg)
- **QTY** - Quantity currently in stock
- **E.D. (Expiry Date)** - Month and year of expiration (MM/YYYY)
- **Vendor** - The supplier or manufacturer name
- **Return Policy** - Specific window for returns (e.g., '1 month before')
- **Pull-out Date** - Targeted date for removing the item from shelves
- **Remarks** - Notes on condition or status (e.g., 'No loose', 'Recall')
- **Date & Signature** - Field for tracking verification

## Tech Stack

- **React 18** - UI framework (loaded from CDN)
- **Babel Standalone** - JSX transpilation
- **Tailwind CSS** - Styling (loaded from CDN)
- **LocalStorage API** - Data persistence
- **Vanilla HTML5** - No build step required!

## Getting Started

### Quick Start

Simply open `index.html` in your web browser! No installation or build process needed.

**Option 1: Direct File Opening**
- Double-click `index.html` to open in your default browser
- Or right-click and select "Open with" → your preferred browser

**Option 2: Local Web Server** (Recommended)
```bash
# If you have Python 3
python -m http.server 8000

# If you have Python 2
python -m SimpleHTTPServer 8000

# If you have Node.js
npx http-server
```
Then visit: `http://localhost:8000`

## Usage

### Adding Items

1. Fill out the form with all required fields
2. Click "Add Item" to save to inventory
3. Data is automatically persisted to browser storage

### Viewing Items

- **Mobile**: Items display as cards for easy scrolling
- **Desktop**: Items display in a comprehensive table

### Searching

Use the search bar to filter items by:
- SKU number
- Product description

### Color Coding

Expiry dates use color coding for quick visual reference:
- 🔴 **Red** - Expired or expiring within 3 months (urgent)
- 🟡 **Yellow** - Expiring within 6 months (caution)
- 🟢 **Green** - Plenty of time before expiration

### Editing & Deleting

- Click **Edit** to modify any item
- Click **Delete** to remove an item from inventory
- Changes are saved immediately

## Responsive Design

The application is fully responsive:
- **Mobile (< 1024px)** - Card-based layout
- **Desktop (≥ 1024px)** - Table-based layout

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- All modern mobile browsers

## Notes

- All data is stored locally in your browser
- No data is sent to external servers
- Clearing browser storage will clear all inventory data
- Date format for expiry: MM/YYYY (e.g., 03/2025)
