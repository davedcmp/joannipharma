const STORAGE_KEY = "pharmacyInventoryItems";
const EXPIRY_ALERT_WINDOW_DAYS = 30;
const DEFAULT_ROWS_PER_PAGE = 15;

const addInventoryBtn = document.getElementById("add-inventory-btn");
const addModal = document.getElementById("add-modal");
const addItemNameInput = document.getElementById("add-item-name");
const addExpirationDateInput = document.getElementById("add-expiration-date");
const addSaveBtn = document.getElementById("add-save-btn");
const addCancelBtn = document.getElementById("add-cancel-btn");
const inventoryBody = document.getElementById("inventory-body");
const alertModal = document.getElementById("alert-modal");
const alertMessage = document.getElementById("alert-message");
const alertTableWrap = document.getElementById("alert-table-wrap");
const alertTableBody = document.getElementById("alert-table-body");
const closeModalBtn = document.getElementById("close-modal");
const editModal = document.getElementById("edit-modal");
const editItemNameInput = document.getElementById("edit-item-name");
const editExpirationDateInput = document.getElementById("edit-expiration-date");
const editSaveBtn = document.getElementById("edit-save-btn");
const editCancelBtn = document.getElementById("edit-cancel-btn");
const exportBackupBtn = document.getElementById("export-backup");
const importBackupBtn = document.getElementById("import-backup");
const backupFileInput = document.getElementById("backup-file");
const generateReportBtn = document.getElementById("generate-report");
const deleteSelectedBtn = document.getElementById("delete-selected");
const deselectAllBtn = document.getElementById("deselect-all");
const tableSearchInput = document.getElementById("table-search");
const prevPageBtn = document.getElementById("prev-page");
const nextPageBtn = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");
const rowsPerPageSelect = document.getElementById("rows-per-page");

let searchQuery = "";
let inventory = loadInventory();
let currentPage = 1;
let rowsPerPage = DEFAULT_ROWS_PER_PAGE;
let selectedItemIds = new Set();
let currentEditingItemId = null;

initializeApp();

function initializeApp() {
  renderInventoryTable();

  // Requesting permission on load allows web notifications to appear automatically
  // later for expired items. If permission is denied, the app will use an in-app modal.
  requestNotificationPermission();

  checkExpirationsAndNotify();

  closeModalBtn.addEventListener("click", hideModal);
  addInventoryBtn.addEventListener("click", onAddInventoryClick);
  addCancelBtn.addEventListener("click", onAddCancel);
  addSaveBtn.addEventListener("click", onAddSave);
  editCancelBtn.addEventListener("click", onEditCancel);
  editSaveBtn.addEventListener("click", onEditSave);
  inventoryBody.addEventListener("click", onTableBodyClick);
  inventoryBody.addEventListener("change", onTableBodyChange);
  exportBackupBtn.addEventListener("click", onExportBackup);
  importBackupBtn.addEventListener("click", onImportBackupClick);
  backupFileInput.addEventListener("change", onBackupFileSelected);
  generateReportBtn.addEventListener("click", onGenerateReport);
  deleteSelectedBtn.addEventListener("click", onDeleteSelected);
  deselectAllBtn.addEventListener("click", onDeselectAll);
  tableSearchInput.addEventListener("input", onSearchInput);
  prevPageBtn.addEventListener("click", onPrevPageClick);
  nextPageBtn.addEventListener("click", onNextPageClick);
  rowsPerPageSelect.addEventListener("change", onRowsPerPageChange);

  rowsPerPage = Number.parseInt(rowsPerPageSelect.value, 10) || DEFAULT_ROWS_PER_PAGE;
}

function onTableBodyChange(event) {
  const checkbox = event.target;
  if (!checkbox.classList.contains("row-check")) return;

  const itemId = checkbox.dataset.id;
  if (!itemId) return;

  setItemSelection(itemId, checkbox.checked);

  updateBulkActionControls();
}

function onAddSave() {
  const itemName = addItemNameInput.value.trim();
  const expirationDate = addExpirationDateInput.value;

  if (!itemName || !expirationDate) {
    showInAppAlert("Please provide both Item Name and Expiration Date.");
    return;
  }

  const newItem = {
    id: generateUUID(),
    itemName,
    expirationDate
  };

  inventory.push(newItem);
  saveInventory();
  renderInventoryTable();
  addModal.classList.add("hidden");
}

function onAddCancel() {
  addModal.classList.add("hidden");
}

function onAddInventoryClick() {
  addItemNameInput.value = "";
  addExpirationDateInput.value = "";
  addModal.classList.remove("hidden");
  addItemNameInput.focus();
}

function onDeleteSelected() {
  if (selectedItemIds.size === 0) {
    showInAppAlert("Select at least one row to delete.");
    return;
  }

  const count = selectedItemIds.size;
  if (!window.confirm(`Delete ${count} selected ${count === 1 ? "item" : "items"}?`)) return;

  inventory = inventory.filter((item) => !selectedItemIds.has(item.id));
  selectedItemIds.clear();
  saveInventory();
  renderInventoryTable();
}

function onDeselectAll() {
  if (selectedItemIds.size === 0) return;

  selectedItemIds.clear();
  renderInventoryTable();
}

function onTableBodyClick(event) {
  const target = event.target;

  if (target.classList.contains("row-check")) {
    return;
  }

  const actionButton = target.closest("button");
  if (actionButton && actionButton.classList.contains("edit-btn")) {
    const itemId = actionButton.dataset.id;
    if (!itemId) return;

    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    currentEditingItemId = itemId;
    editItemNameInput.value = item.itemName;
    editExpirationDateInput.value = item.expirationDate;
    editModal.classList.remove("hidden");
    editItemNameInput.focus();
    return;
  }

  if (actionButton) {
    return;
  }

  const row = target.closest("tr[data-item-id]");
  if (!row) return;

  const itemId = row.dataset.itemId;
  if (!itemId) return;

  const isSelected = toggleItemSelection(itemId);
  updateRowCheckboxState(itemId, isSelected);
  updateBulkActionControls();
}

function setItemSelection(itemId, isSelected) {
  if (isSelected) {
    selectedItemIds.add(itemId);
  } else {
    selectedItemIds.delete(itemId);
  }
}

function toggleItemSelection(itemId) {
  const shouldSelect = !selectedItemIds.has(itemId);
  setItemSelection(itemId, shouldSelect);
  return shouldSelect;
}

function updateRowCheckboxState(itemId, isSelected) {
  const rowCheckbox = inventoryBody.querySelector(`.row-check[data-id="${itemId}"]`);
  if (!rowCheckbox) return;
  rowCheckbox.checked = isSelected;
}

function onEditSave() {
  const newName = editItemNameInput.value.trim();
  const newDate = editExpirationDateInput.value;

  if (!newName || !newDate) {
    showInAppAlert("Please provide both Item Name and Expiration Date.");
    return;
  }

  const item = inventory.find((i) => i.id === currentEditingItemId);
  if (!item) return;
  item.itemName = newName;
  item.expirationDate = newDate;
  saveInventory();
  renderInventoryTable();
  editModal.classList.add("hidden");
  currentEditingItemId = null;
}

function onEditCancel() {
  editModal.classList.add("hidden");
  currentEditingItemId = null;
}

function onGenerateReport() {
  const today = normalizeDate(new Date());
  const visibleItems = inventory.filter((item) => matchesSearch(item, searchQuery, today));

  if (visibleItems.length === 0) {
    showInAppAlert("No records to include in the report.");
    return;
  }

  const headers = ["Item Name", "Expiration Date", "Status"];
  const csvRows = [headers.map(quoteCsvField).join(",")];

  visibleItems.forEach((item) => {
    const statusLabel = getExpirationStatus(item.expirationDate, today).label;
    const row = [item.itemName, item.expirationDate, statusLabel]
      .map(quoteCsvField)
      .join(",");
    csvRows.push(row);
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(`pharmacy-report-${timestamp}.csv`, csvRows.join("\n"));
}

function onExportBackup() {
  if (inventory.length === 0) {
    showInAppAlert("No records to export yet.");
    return;
  }

  const headers = ["Item Name", "Expiration Date"];
  const csvRows = [headers.map(quoteCsvField).join(",")];

  inventory.forEach((item) => {
    const row = [item.itemName, item.expirationDate]
      .map(quoteCsvField)
      .join(",");
    csvRows.push(row);
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(`pharmacy-inventory-records-${timestamp}.csv`, csvRows.join("\n"));
}

function onImportBackupClick() {
  const shouldImport = window.confirm(
    "Importing a CSV will replace your current records. Do you want to continue?"
  );
  if (!shouldImport) return;

  backupFileInput.click();
}

function onBackupFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const csvText = String(reader.result || "");
      const importedItems = parseCsvBackup(csvText);

      inventory = importedItems;
      saveInventory();
      renderInventoryTable();
      checkExpirationsAndNotify();
      showInAppAlert(`Backup restored successfully. Imported ${importedItems.length} ${importedItems.length === 1 ? "item" : "items"}.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown format";
      showInAppAlert(`Invalid CSV backup file. ${reason}`);
    } finally {
      backupFileInput.value = "";
    }
  };

  reader.onerror = () => {
    showInAppAlert("Unable to read the selected file.");
    backupFileInput.value = "";
  };

  reader.readAsText(file);
}

function loadInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveInventory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

function onSearchInput(event) {
  const nextQuery = String(event.target.value || "").trim().toLowerCase();
  if (nextQuery === searchQuery) return;

  searchQuery = nextQuery;
  currentPage = 1;
  renderInventoryTable();
}

function onPrevPageClick() {
  if (currentPage <= 1) return;
  currentPage -= 1;
  renderInventoryTable();
}

function onNextPageClick() {
  currentPage += 1;
  renderInventoryTable();
}

function onRowsPerPageChange(event) {
  const selected = Number.parseInt(event.target.value, 10);
  const nextRowsPerPage = Number.isFinite(selected) && selected > 0 ? selected : DEFAULT_ROWS_PER_PAGE;
  if (nextRowsPerPage === rowsPerPage) return;

  rowsPerPage = nextRowsPerPage;
  currentPage = 1;
  renderInventoryTable();
}

function renderInventoryTable() {
  pruneSelectedItems();
  updateBulkActionControls();

  const today = normalizeDate(new Date());
  const filteredInventory = inventory.filter((item) => matchesSearch(item, searchQuery, today));
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / rowsPerPage));
  currentPage = Math.min(currentPage, totalPages);
  currentPage = Math.max(1, currentPage);

  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageItems = filteredInventory.slice(pageStartIndex, pageStartIndex + rowsPerPage);

  updatePaginationControls(totalPages, filteredInventory.length);

  if (inventory.length === 0) {
    inventoryBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">No inventory items saved.</td>
      </tr>
    `;
    return;
  }

  if (filteredInventory.length === 0) {
    inventoryBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="3">No items match your search.</td>
      </tr>
    `;
    return;
  }

  const rows = pageItems
    .map((item) => {
      const status = getExpirationStatus(item.expirationDate, today);
      const isChecked = selectedItemIds.has(item.id) ? "checked" : "";
      return `
        <tr data-item-id="${item.id}">
          <td class="checkbox-cell" rowspan="2"><input class="row-check" data-id="${item.id}" type="checkbox" aria-label="Select item" ${isChecked} /></td>
          <td class="item-name-cell">${escapeHtml(item.itemName)}</td>
          <td class="action-cell" rowspan="2">
            <button class="edit-btn" data-id="${item.id}" type="button" aria-label="Edit item" title="Edit">✎</button>
          </td>
        </tr>
        <tr data-item-id="${item.id}">
          <td class="item-details-cell"><span class="item-date">${formatDisplayDate(item.expirationDate)}</span> <span class="${status.className}">${status.label}</span></td>
        </tr>
      `;
    })
    .join("");

  inventoryBody.innerHTML = rows;
}

function updatePaginationControls(totalPages, filteredCount) {
  const hasRows = filteredCount > 0;
  pageInfo.textContent = hasRows ? `Page ${currentPage} of ${totalPages}` : "Page 0 of 0";
  prevPageBtn.disabled = !hasRows || currentPage <= 1;
  nextPageBtn.disabled = !hasRows || currentPage >= totalPages;
}

function updateBulkActionControls() {
  const hasSelections = selectedItemIds.size > 0;
  deleteSelectedBtn.disabled = !hasSelections;
  deselectAllBtn.disabled = !hasSelections;
}

function pruneSelectedItems() {
  if (selectedItemIds.size === 0) return;

  const validIds = new Set(inventory.map((item) => item.id));
  for (const id of selectedItemIds) {
    if (!validIds.has(id)) selectedItemIds.delete(id);
  }
}

function getExpirationStatus(dateText, today = normalizeDate(new Date())) {
  const expiry = normalizeDate(new Date(dateText));
  const expiryTime = expiry.getTime();
  const todayTime = today.getTime();

  if (Number.isNaN(expiryTime) || expiryTime <= todayTime) {
    return { label: "Expired", className: "status-expired" };
  }

  if (getDayDifference(today, expiry) <= EXPIRY_ALERT_WINDOW_DAYS) {
    return { label: "Expiring", className: "status-soon" };
  }

  return { label: "Valid", className: "status-valid" };
}

function checkExpirationsAndNotify() {
  const today = normalizeDate(new Date());
  const alertItems = inventory.filter((item) => {
    const expiry = normalizeDate(new Date(item.expirationDate));
    if (Number.isNaN(expiry.getTime())) return false;

    const daysUntilExpiry = getDayDifference(today, expiry);
    return daysUntilExpiry <= EXPIRY_ALERT_WINDOW_DAYS;
  });

  if (alertItems.length === 0) return;

  const messageLines = alertItems.map((item) => {
    const status = getExpirationStatus(item.expirationDate, today).label;
    return `• ${item.itemName} (${formatDisplayDate(item.expirationDate)} - ${status})`;
  });

  const fullMessage = `The following items expire within ${EXPIRY_ALERT_WINDOW_DAYS} days or are already expired:\n\n${messageLines.join("\n")}`;

  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Pharmacy Expiration Alert", {
        body: fullMessage
      });
      return;
    } catch {
      // Some browsers expose Notification but block direct construction.
      // Fall back to the in-app alert when constructor use is not allowed.
    }
  }

  showExpirationTableAlert(alertItems);
}

function requestNotificationPermission() {
  // Check if Notification API is available
  if (!("Notification" in window)) return;

  // Only request permission if not already granted or denied
  if (Notification.permission === "default") {
    // Some browsers (iOS Safari) require user interaction for notification permission
    // The permission request will be handled via user gesture when needed
    if (typeof Notification.requestPermission === "function") {
      Notification.requestPermission().catch(() => {
        // Permission request failed or was blocked - silently handle
      });
    }
  }
}

function showInAppAlert(message) {
  alertMessage.textContent = message;
  alertMessage.classList.remove("hidden");
  alertTableWrap.classList.add("hidden");
  alertTableBody.innerHTML = "";
  alertModal.classList.remove("hidden");
}

function showExpirationTableAlert(items) {
  const title = `The following items expire within ${EXPIRY_ALERT_WINDOW_DAYS} days or are already expired:`;
  alertMessage.textContent = title;
  alertMessage.classList.remove("hidden");

  const rows = items
    .map((item) => {
      const status = getExpirationStatus(item.expirationDate).label;
      return `
        <tr>
          <td>${escapeHtml(item.itemName)}</td>
          <td>${formatDisplayDate(item.expirationDate)}</td>
          <td>${status}</td>
        </tr>
      `;
    })
    .join("");

  alertTableBody.innerHTML = rows;
  alertTableWrap.classList.remove("hidden");
  alertModal.classList.remove("hidden");
}

function hideModal() {
  alertModal.classList.add("hidden");
}

function triggerDownload(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDisplayDate(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDifference(startDate, endDate) {
  const millisecondsInDay = 1000 * 60 * 60 * 24;
  return Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsInDay);
}

function matchesSearch(item, query, today = normalizeDate(new Date())) {
  if (!query) return true;

  const itemName = String(item.itemName || "").toLowerCase();
  if (itemName.includes(query)) return true;

  const rawDate = String(item.expirationDate || "").toLowerCase();
  if (rawDate.includes(query)) return true;

  const formattedDate = formatDisplayDate(item.expirationDate).toLowerCase();
  if (formattedDate.includes(query)) return true;

  const statusLabel = getExpirationStatus(item.expirationDate, today).label.toLowerCase();
  return statusLabel.includes(query);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function generateUUID() {
  // Use native crypto.randomUUID() if available (Chrome 92+, latest browsers)
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // Fallback for older browser versions (Chrome < 92, older Safari, etc.)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function parseCsvBackup(csvText) {
  const sanitizedText = String(csvText || "")
    .replace(/^\uFEFF/, "")
    .replace(/\u0000/g, "");

  if (!sanitizedText.trim()) {
    throw new Error("Empty CSV");
  }

  const lines = splitCsvLines(sanitizedText)
    .map((line) => line.trim())
    .filter((line) => line !== "");

  if (lines.length === 0) {
    throw new Error("No lines");
  }

  // Support files that include an Excel-style separator hint (e.g., "sep=;").
  if (/^sep\s*=\s*[,;\t]$/i.test(lines[0])) {
    lines.shift();
  }

  const delimiter = detectCsvDelimiter(lines[0] || "");
  const rows = lines
    .map((line) => parseCsvLine(line, delimiter))
    .filter((row) => row.length > 0 && row.some((cell) => cell.trim() !== ""));

  if (rows.length < 2) {
    throw new Error("No data rows");
  }

  const header = rows[0].map((cell) => normalizeHeader(cell));
  let itemNameIndex = findHeaderIndex(header, ["item name", "item", "medicine", "medication", "itemname"]);
  let expirationDateIndex = findHeaderIndex(header, ["expiration date", "expiry date", "expiration", "expiry", "exp date", "exp"]);

  // Fallback for CSV files with non-standard headers.
  if (itemNameIndex === -1 || expirationDateIndex === -1) {
    itemNameIndex = 0;
    expirationDateIndex = 1;
  }

  if (rows.length === 1 || rows[0].length < 2) {
    throw new Error("Missing required columns");
  }

  const importedItems = rows.slice(1).reduce((result, row) => {
    const itemName = String(row[itemNameIndex] || "").trim();
    const expirationDateRaw = String(row[expirationDateIndex] || "").trim();

    // Ignore empty/non-data rows instead of failing the whole import.
    if (!itemName && !expirationDateRaw) return result;

    const expirationDate = normalizeDateText(expirationDateRaw);
    if (!itemName || !expirationDate) return result;

    const normalizedDate = normalizeDate(new Date(expirationDate));
    if (Number.isNaN(normalizedDate.getTime())) return result;

    result.push({
      id: generateUUID(),
      itemName,
      expirationDate
    });

    return result;
  }, []);

  if (importedItems.length === 0) {
    throw new Error("No valid rows found. Expected columns: Item Name and Expiration Date");
  }

  return importedItems;
}

function splitCsvLines(csvText) {
  return csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n")
    .split("\n");
}

function parseCsvLine(line, delimiter = ",") {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function detectCsvDelimiter(headerLine) {
  const commaCount = countDelimiter(headerLine, ",");
  const semicolonCount = countDelimiter(headerLine, ";");
  const tabCount = countDelimiter(headerLine, "\t");

  if (semicolonCount > commaCount && semicolonCount >= tabCount) return ";";
  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  return ",";
}

function countDelimiter(line, delimiter) {
  let inQuotes = false;
  let count = 0;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      count += 1;
    }
  }

  return count;
}

function normalizeDateText(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  const isoSlashMatch = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (isoSlashMatch) {
    return `${isoSlashMatch[1]}-${String(isoSlashMatch[2]).padStart(2, "0")}-${String(isoSlashMatch[3]).padStart(2, "0")}`;
  }

  const dashMatch = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    let part1 = Number(dashMatch[1]);
    let part2 = Number(dashMatch[2]);
    const year = Number(dashMatch[3]);
    let month = part1;
    let day = part2;
    if (part1 > 12 && part2 <= 12) {
      month = part2;
      day = part1;
    }
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    let part1 = Number(slashMatch[1]);
    let part2 = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    // Prefer MM/DD/YYYY for ambiguous values; flip when month is impossible.
    let month = part1;
    let day = part2;
    if (part1 > 12 && part2 <= 12) {
      month = part2;
      day = part1;
    }

    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  // Support Excel serial dates (e.g., 45567).
  if (/^\d{4,6}$/.test(text)) {
    const serial = Number(text);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  // Last-resort parse for localized month-name formats.
  const fallbackDate = new Date(text);
  if (!Number.isNaN(fallbackDate.getTime())) {
    const year = fallbackDate.getFullYear();
    const month = String(fallbackDate.getMonth() + 1).padStart(2, "0");
    const day = String(fallbackDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return "";
}

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function findHeaderIndex(headers, candidates) {
  for (let i = 0; i < headers.length; i += 1) {
    const header = headers[i];
    if (candidates.includes(header)) return i;
  }
  return -1;
}

function quoteCsvField(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}
