const STORAGE_KEYS = {
	vendors: "jp_vendors",
	items: "jp_items",
	inventory: "jp_inventory"
};

const REMARK_OPTIONS = ["Yes, Intact", "Yes, Loose", "No, Loose"];

const state = {
	vendors: readStore(STORAGE_KEYS.vendors),
	items: readStore(STORAGE_KEYS.items),
	inventory: readStore(STORAGE_KEYS.inventory)
};

const inventoryCombo = {
	labelToId: new Map(),
	idToLabel: new Map()
};

const refs = {
	dashboardSection: document.getElementById("dashboardSection"),
	vendorSection: document.getElementById("vendorSection"),
	itemSection: document.getElementById("itemSection"),
	menuPanel: document.getElementById("mainMenuPanel"),
	menuToggleBtn: document.getElementById("menuToggleBtn"),
	menuBackdrop: document.getElementById("menuBackdrop"),
	homeBtn: document.getElementById("homeBtn"),
	closeVendorSectionBtn: document.getElementById("closeVendorSectionBtn"),
	closeItemSectionBtn: document.getElementById("closeItemSectionBtn"),
	openVendorBtn: document.getElementById("openVendorBtn"),
	openItemBtn: document.getElementById("openItemBtn"),
	exportCsvBtn: document.getElementById("exportCsvBtn"),
	importCsvBtn: document.getElementById("importCsvBtn"),
	csvFileInput: document.getElementById("csvFileInput"),

	vendorForm: document.getElementById("vendorForm"),
	vendorId: document.getElementById("vendorId"),
	vendorName: document.getElementById("vendorName"),
	vendorRows: document.getElementById("vendorRows"),
	cancelVendorBtn: document.getElementById("cancelVendorBtn"),

	itemForm: document.getElementById("itemForm"),
	itemId: document.getElementById("itemId"),
	itemSku: document.getElementById("itemSku"),
	itemDescription: document.getElementById("itemDescription"),
	itemVendor: document.getElementById("itemVendor"),
	itemPolicyType: document.getElementById("itemPolicyType"),
	itemPolicyMonths: document.getElementById("itemPolicyMonths"),
	itemRows: document.getElementById("itemRows"),
	cancelItemBtn: document.getElementById("cancelItemBtn"),

	newInventoryBtn: document.getElementById("newInventoryBtn"),
	inventoryModal: document.getElementById("inventoryModal"),
	inventoryForm: document.getElementById("inventoryForm"),
	closeInventoryModalBtn: document.getElementById("closeInventoryModalBtn"),
	inventoryId: document.getElementById("inventoryId"),
	inventoryItemInput: document.getElementById("inventoryItemInput"),
	inventoryItemList: document.getElementById("inventoryItemList"),
	inventoryItem: document.getElementById("inventoryItem"),
	inventoryQty: document.getElementById("inventoryQty"),
	inventoryExpiry: document.getElementById("inventoryExpiry"),
	inventoryPullout: document.getElementById("inventoryPullout"),
	inventoryRemarks: document.getElementById("inventoryRemarks"),
	inventoryComment: document.getElementById("inventoryComment"),
	cancelInventoryBtn: document.getElementById("cancelInventoryBtn"),
	dashboardRows: document.getElementById("dashboardRows")
};

init();

function init() {
	bindEvents();
	renderAll();
	showSection("dashboard");
}

function bindEvents() {
	refs.menuToggleBtn.addEventListener("click", toggleMainMenu);
	refs.menuBackdrop.addEventListener("click", closeMainMenu);
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeMainMenu();
		}
	});

	refs.homeBtn.addEventListener("click", () => showSection("dashboard"));
	refs.closeVendorSectionBtn.addEventListener("click", () => showSection("dashboard"));
	refs.closeItemSectionBtn.addEventListener("click", () => showSection("dashboard"));
	refs.openVendorBtn.addEventListener("click", () => {
		showSection("vendor");
		closeMainMenu();
	});
	refs.openItemBtn.addEventListener("click", () => {
		showSection("item");
		closeMainMenu();
	});

	refs.vendorForm.addEventListener("submit", onSaveVendor);
	refs.cancelVendorBtn.addEventListener("click", resetVendorForm);

	refs.itemForm.addEventListener("submit", onSaveItem);
	refs.itemPolicyType.addEventListener("change", syncPolicyField);
	refs.cancelItemBtn.addEventListener("click", resetItemForm);

	refs.newInventoryBtn.addEventListener("click", () => {
		resetInventoryForm();
		openInventoryModal();
	});
	refs.inventoryForm.addEventListener("submit", onSaveInventory);
	refs.inventoryItemInput.addEventListener("input", onInventoryItemTyped);
	refs.inventoryItemInput.addEventListener("change", onInventoryItemTyped);
	refs.cancelInventoryBtn.addEventListener("click", () => {
		resetInventoryForm();
		closeInventoryModal();
	});
	refs.closeInventoryModalBtn.addEventListener("click", closeInventoryModal);
	refs.inventoryModal.addEventListener("click", (event) => {
		if (event.target === refs.inventoryModal) {
			closeInventoryModal();
		}
	});

	refs.exportCsvBtn.addEventListener("click", () => {
		exportAllCsv();
		closeMainMenu();
	});
	refs.importCsvBtn.addEventListener("click", () => {
		refs.csvFileInput.click();
		closeMainMenu();
	});
	refs.csvFileInput.addEventListener("change", onImportCsv);
}

function toggleMainMenu() {
	if (document.body.classList.contains("menu-open")) {
		closeMainMenu();
		return;
	}
	openMainMenu();
}

function openMainMenu() {
	document.body.classList.add("menu-open");
	refs.menuBackdrop.hidden = false;
	refs.menuToggleBtn.setAttribute("aria-expanded", "true");
}

function closeMainMenu() {
	document.body.classList.remove("menu-open");
	refs.menuBackdrop.hidden = true;
	refs.menuToggleBtn.setAttribute("aria-expanded", "false");
}

function showSection(name) {
	refs.dashboardSection.hidden = name !== "dashboard";
	refs.vendorSection.hidden = name !== "vendor";
	refs.itemSection.hidden = name !== "item";
}

function renderAll() {
	renderVendorRows();
	renderItemRows();
	renderItemVendorOptions();
	renderInventoryItemOptions();
	renderDashboardRows();
	syncPolicyField();
}

function onSaveVendor(event) {
	event.preventDefault();
	const id = refs.vendorId.value || uid();
	const name = refs.vendorName.value.trim();
	if (!name) {
		return;
	}

	const existing = state.vendors.find((vendor) => vendor.id === id);
	if (existing) {
		existing.name = name;
	} else {
		state.vendors.push({ id, name });
	}

	persist("vendors");
	renderAll();
	resetVendorForm();
}

function editVendor(id) {
	const vendor = state.vendors.find((entry) => entry.id === id);
	if (!vendor) {
		return;
	}

	showSection("vendor");
	refs.vendorId.value = vendor.id;
	refs.vendorName.value = vendor.name;
}

function deleteVendor(id) {
	const inUse = state.items.some((item) => item.vendorId === id);
	if (inUse) {
		window.alert("Vendor is used by one or more items. Update or delete those items first.");
		return;
	}

	state.vendors = state.vendors.filter((entry) => entry.id !== id);
	persist("vendors");
	renderAll();
}

function resetVendorForm() {
	refs.vendorForm.reset();
	refs.vendorId.value = "";
}

function onSaveItem(event) {
	event.preventDefault();
	const id = refs.itemId.value || uid();
	const sku = refs.itemSku.value.trim();
	const description = refs.itemDescription.value.trim();
	const vendorId = refs.itemVendor.value;
	const returnPolicyType = refs.itemPolicyType.value;
	const returnPolicyMonths = returnPolicyType === "months_before_expiry"
		? Number(refs.itemPolicyMonths.value || 0)
		: 0;

	if (!sku || !description || !vendorId) {
		return;
	}

	const existing = state.items.find((item) => item.id === id);
	const payload = { id, sku, description, vendorId, returnPolicyType, returnPolicyMonths };
	if (existing) {
		Object.assign(existing, payload);
	} else {
		state.items.push(payload);
	}

	persist("items");
	renderAll();
	resetItemForm();
}

function editItem(id) {
	const item = state.items.find((entry) => entry.id === id);
	if (!item) {
		return;
	}

	showSection("item");
	refs.itemId.value = item.id;
	refs.itemSku.value = item.sku;
	refs.itemDescription.value = item.description;
	refs.itemVendor.value = item.vendorId;
	refs.itemPolicyType.value = item.returnPolicyType;
	refs.itemPolicyMonths.value = String(item.returnPolicyMonths || 0);
	syncPolicyField();
}

function deleteItem(id) {
	const inUse = state.inventory.some((row) => row.itemId === id);
	if (inUse) {
		window.alert("Item is used by inventory rows. Delete those rows first.");
		return;
	}

	state.items = state.items.filter((entry) => entry.id !== id);
	persist("items");
	renderAll();
}

function resetItemForm() {
	refs.itemForm.reset();
	refs.itemId.value = "";
	syncPolicyField();
}

function syncPolicyField() {
	const enabled = refs.itemPolicyType.value === "months_before_expiry";
	refs.itemPolicyMonths.disabled = !enabled;
}

function onSaveInventory(event) {
	event.preventDefault();

	if (!state.items.length) {
		window.alert("Add at least one item before creating inventory rows.");
		return;
	}

	const id = refs.inventoryId.value || uid();
	const payload = {
		id,
		itemId: refs.inventoryItem.value,
		quantity: Number(refs.inventoryQty.value || 0),
		expiryDate: refs.inventoryExpiry.value,
		pulloutDate: refs.inventoryPullout.value,
		remarks: refs.inventoryRemarks.value,
		comment: refs.inventoryComment.value.trim()
	};

	if (!payload.itemId || !state.items.some((entry) => entry.id === payload.itemId)) {
		window.alert("Please select a valid item from the combo box.");
		return;
	}

	const existing = state.inventory.find((row) => row.id === id);
	if (existing) {
		Object.assign(existing, payload);
	} else {
		state.inventory.push(payload);
	}

	persist("inventory");
	renderDashboardRows();
	resetInventoryForm();
	closeInventoryModal();
}

function editInventory(id) {
	const row = state.inventory.find((entry) => entry.id === id);
	if (!row) {
		return;
	}

	showSection("dashboard");
	openInventoryModal();
	refs.inventoryId.value = row.id;
	refs.inventoryItem.value = row.itemId;
	refs.inventoryItemInput.value = inventoryCombo.idToLabel.get(row.itemId) || "";
	refs.inventoryQty.value = String(row.quantity);
	refs.inventoryExpiry.value = row.expiryDate;
	refs.inventoryPullout.value = row.pulloutDate || "";
	refs.inventoryRemarks.value = REMARK_OPTIONS.includes(row.remarks) ? row.remarks : "Yes, Intact";
	refs.inventoryComment.value = row.comment || "";
}

function deleteInventory(id) {
	state.inventory = state.inventory.filter((entry) => entry.id !== id);
	persist("inventory");
	renderDashboardRows();
}

function resetInventoryForm() {
	refs.inventoryForm.reset();
	refs.inventoryId.value = "";
	refs.inventoryItem.value = "";
	refs.inventoryItemInput.value = "";
	refs.inventoryRemarks.value = "Yes, Intact";
}

function renderVendorRows() {
	refs.vendorRows.innerHTML = "";

	for (const vendor of state.vendors) {
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${escapeHtml(vendor.name)}</td>
			<td class="actions">
				<button type="button" data-action="edit-vendor" data-id="${vendor.id}">Edit</button>
				<button type="button" data-action="delete-vendor" data-id="${vendor.id}" class="danger">Delete</button>
			</td>
		`;
		refs.vendorRows.appendChild(tr);
	}

	refs.vendorRows.querySelectorAll("button").forEach((button) => {
		button.addEventListener("click", () => {
			const id = button.dataset.id;
			if (button.dataset.action === "edit-vendor") {
				editVendor(id);
			} else {
				deleteVendor(id);
			}
		});
	});
}

function renderItemRows() {
	refs.itemRows.innerHTML = "";

	for (const item of state.items) {
		const vendor = state.vendors.find((entry) => entry.id === item.vendorId);
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${escapeHtml(item.sku)}</td>
			<td>${escapeHtml(item.description)}</td>
			<td>${escapeHtml(vendor ? vendor.name : "-")}</td>
			<td>${escapeHtml(policyLabel(item))}</td>
			<td class="actions">
				<button type="button" data-action="edit-item" data-id="${item.id}">Edit</button>
				<button type="button" data-action="delete-item" data-id="${item.id}" class="danger">Delete</button>
			</td>
		`;
		refs.itemRows.appendChild(tr);
	}

	refs.itemRows.querySelectorAll("button").forEach((button) => {
		button.addEventListener("click", () => {
			const id = button.dataset.id;
			if (button.dataset.action === "edit-item") {
				editItem(id);
			} else {
				deleteItem(id);
			}
		});
	});
}

function renderDashboardRows() {
	refs.dashboardRows.innerHTML = "";

	for (const row of state.inventory) {
		const item = state.items.find((entry) => entry.id === row.itemId);
		if (!item) {
			continue;
		}
		const vendor = state.vendors.find((entry) => entry.id === item.vendorId);

		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${escapeHtml(item.sku)}</td>
			<td>${escapeHtml(item.description)} (${escapeHtml(vendor ? vendor.name : "-")})</td>
			<td>${row.quantity}</td>
			<td>${formatDate(row.expiryDate)}</td>
			<td>${escapeHtml(policyLabel(item))}</td>
			<td>${formatDate(row.pulloutDate)}</td>
			<td>${escapeHtml(row.remarks || "")}</td>
			<td>${escapeHtml(row.comment || "")}</td>
			<td class="actions">
				<button type="button" data-action="edit-inventory" data-id="${row.id}">Edit</button>
				<button type="button" data-action="delete-inventory" data-id="${row.id}" class="danger">Delete</button>
			</td>
		`;
		refs.dashboardRows.appendChild(tr);
	}

	refs.dashboardRows.querySelectorAll("button").forEach((button) => {
		button.addEventListener("click", () => {
			const id = button.dataset.id;
			if (button.dataset.action === "edit-inventory") {
				editInventory(id);
			} else {
				deleteInventory(id);
			}
		});
	});
}

function renderItemVendorOptions() {
	const previous = refs.itemVendor.value;
	refs.itemVendor.innerHTML = "";

	if (!state.vendors.length) {
		refs.itemVendor.innerHTML = "<option value=''>Add a vendor first</option>";
		refs.itemVendor.disabled = true;
		return;
	}

	refs.itemVendor.disabled = false;
	refs.itemVendor.innerHTML = "<option value=''>Select vendor</option>";
	for (const vendor of state.vendors) {
		const option = document.createElement("option");
		option.value = vendor.id;
		option.textContent = vendor.name;
		refs.itemVendor.appendChild(option);
	}

	refs.itemVendor.value = previous && state.vendors.some((entry) => entry.id === previous)
		? previous
		: "";
}

function renderInventoryItemOptions() {
	const previous = refs.inventoryItem.value;
	inventoryCombo.labelToId.clear();
	inventoryCombo.idToLabel.clear();
	refs.inventoryItemList.innerHTML = "";

	if (!state.items.length) {
		refs.inventoryItemInput.value = "";
		refs.inventoryItemInput.placeholder = "Add an item first";
		refs.inventoryItemInput.disabled = true;
		refs.inventoryItem.value = "";
		refs.newInventoryBtn.disabled = true;
		closeInventoryModal();
		return;
	}

	refs.inventoryItemInput.disabled = false;
	refs.inventoryItemInput.placeholder = "Type SKU or description";
	refs.newInventoryBtn.disabled = false;
	for (const item of state.items) {
		const vendor = state.vendors.find((entry) => entry.id === item.vendorId);
		const option = document.createElement("option");
		const label = `${item.sku} - ${item.description} (${vendor ? vendor.name : "No vendor"})`;
		option.value = label;
		refs.inventoryItemList.appendChild(option);
		inventoryCombo.labelToId.set(label.toLowerCase(), item.id);
		inventoryCombo.idToLabel.set(item.id, label);
	}

	refs.inventoryItem.value = previous && state.items.some((entry) => entry.id === previous)
		? previous
		: "";
	refs.inventoryItemInput.value = refs.inventoryItem.value
		? inventoryCombo.idToLabel.get(refs.inventoryItem.value) || ""
		: "";
}

function onInventoryItemTyped() {
	const label = refs.inventoryItemInput.value.trim().toLowerCase();
	refs.inventoryItem.value = inventoryCombo.labelToId.get(label) || "";
}

function openInventoryModal() {
	refs.inventoryModal.hidden = false;
	document.body.classList.add("modal-open");
}

function closeInventoryModal() {
	refs.inventoryModal.hidden = true;
	document.body.classList.remove("modal-open");
}

function exportAllCsv() {
	downloadCsv("vendors.csv", ["id", "name"], state.vendors.map((entry) => [entry.id, entry.name]));

	downloadCsv(
		"items.csv",
		["id", "sku", "description", "vendor_id", "return_policy_type", "return_policy_months"],
		state.items.map((entry) => [
			entry.id,
			entry.sku,
			entry.description,
			entry.vendorId,
			entry.returnPolicyType,
			String(entry.returnPolicyMonths || 0)
		])
	);

	downloadCsv(
		"inventory.csv",
		["id", "item_id", "quantity", "expiry_date", "pullout_date", "remarks", "comment"],
		state.inventory.map((entry) => [
			entry.id,
			entry.itemId,
			String(entry.quantity || 0),
			entry.expiryDate || "",
			entry.pulloutDate || "",
			entry.remarks || "",
			entry.comment || ""
		])
	);
}

function onImportCsv(event) {
	const [file] = event.target.files;
	if (!file) {
		return;
	}

	const reader = new FileReader();
	reader.onload = () => {
		try {
			const text = String(reader.result || "");
			importCsvText(text);
			renderAll();
			window.alert("CSV imported successfully.");
		} catch (error) {
			window.alert(`Import failed: ${error.message}`);
		} finally {
			refs.csvFileInput.value = "";
		}
	};
	reader.readAsText(file);
}

function importCsvText(text) {
	const rows = parseCsv(text);
	if (rows.length < 2) {
		throw new Error("CSV has no data rows.");
	}

	const header = rows[0].map(normalizeHeader);
	const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));

	if (matchesHeader(header, ["id", "name"])) {
		state.vendors = dataRows.map((row) => ({
			id: row[0] || uid(),
			name: (row[1] || "").trim()
		})).filter((entry) => entry.name);
		persist("vendors");
		return;
	}

	if (matchesHeader(header, ["id", "sku", "description", "vendor_id", "return_policy_type", "return_policy_months"])) {
		state.items = dataRows.map((row) => ({
			id: row[0] || uid(),
			sku: (row[1] || "").trim(),
			description: (row[2] || "").trim(),
			vendorId: (row[3] || "").trim(),
			returnPolicyType: row[4] === "expiry_month" ? "expiry_month" : "months_before_expiry",
			returnPolicyMonths: Number(row[5] || 0)
		})).filter((entry) => entry.sku && entry.description);
		persist("items");
		return;
	}

	if (matchesHeader(header, ["id", "item_id", "quantity", "expiry_date", "pullout_date", "remarks", "comment"])) {
		state.inventory = dataRows.map((row) => ({
			id: row[0] || uid(),
			itemId: (row[1] || "").trim(),
			quantity: Number(row[2] || 0),
			expiryDate: (row[3] || "").trim(),
			pulloutDate: (row[4] || "").trim(),
			remarks: REMARK_OPTIONS.includes(row[5]) ? row[5] : "Yes, Intact",
			comment: row[6] || ""
		})).filter((entry) => entry.itemId);
		persist("inventory");
		return;
	}

	throw new Error("Unsupported CSV format. Use files exported by this app.");
}

function downloadCsv(filename, header, rows) {
	const csv = [header, ...rows]
		.map((row) => row.map(toCsvValue).join(","))
		.join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function parseCsv(text) {
	const output = [];
	let row = [];
	let field = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i += 1) {
		const char = text[i];
		const next = text[i + 1];

		if (char === '"') {
			if (inQuotes && next === '"') {
				field += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (!inQuotes && char === ",") {
			row.push(field);
			field = "";
			continue;
		}

		if (!inQuotes && (char === "\n" || char === "\r")) {
			if (char === "\r" && next === "\n") {
				i += 1;
			}
			row.push(field);
			output.push(row);
			row = [];
			field = "";
			continue;
		}

		field += char;
	}

	if (field.length > 0 || row.length > 0) {
		row.push(field);
		output.push(row);
	}

	return output;
}

function toCsvValue(value) {
	const safe = String(value == null ? "" : value);
	if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
		return `"${safe.replaceAll('"', '""')}"`;
	}
	return safe;
}

function normalizeHeader(value) {
	return String(value || "")
		.trim()
		.toLowerCase()
		.replaceAll(" ", "_");
}

function matchesHeader(actual, expected) {
	if (actual.length !== expected.length) {
		return false;
	}
	return expected.every((entry, index) => actual[index] === entry);
}

function policyLabel(item) {
	if (item.returnPolicyType === "expiry_month") {
		return "On the month of expiry";
	}
	return `${item.returnPolicyMonths || 0} month(s) before expiry`;
}

function formatDate(value) {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.valueOf())) {
		return value;
	}

	return date.toLocaleDateString();
}

function escapeHtml(value) {
	return String(value == null ? "" : value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

function uid() {
	return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readStore(key) {
	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) {
			return [];
		}
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function persist(name) {
	const key = STORAGE_KEYS[name];
	window.localStorage.setItem(key, JSON.stringify(state[name]));
}
