const STORAGE_KEYS = {
	vendors: "jp_vendors",
	items: "jp_items",
	inventory: "jp_inventory"
};

const REMARK_OPTIONS = ["Yes, Intact", "Yes, Loose", "No, Loose"];

const state = {
	vendors: readStore(STORAGE_KEYS.vendors),
	items: readStore(STORAGE_KEYS.items),
	inventory: readStore(STORAGE_KEYS.inventory),
	dashboardSearch: ""
};

const inventoryCombo = {
	options: [],
	labelToId: new Map(),
	idToLabel: new Map(),
	highlightedIndex: -1
};

const itemVendorLookup = {
	options: [],
	labelToId: new Map(),
	idToLabel: new Map(),
	highlightedIndex: -1
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
	itemVendorWrap: document.getElementById("itemVendorWrap"),
	itemVendorInput: document.getElementById("itemVendorInput"),
	itemVendorPopup: document.getElementById("itemVendorPopup"),
	itemVendor: document.getElementById("itemVendor"),
	itemPolicyType: document.getElementById("itemPolicyType"),
	itemPolicyMonths: document.getElementById("itemPolicyMonths"),
	itemRows: document.getElementById("itemRows"),
	cancelItemBtn: document.getElementById("cancelItemBtn"),

	newInventoryBtn: document.getElementById("newInventoryBtn"),
	exportExcelBtn: document.getElementById("exportExcelBtn"),
	dashboardSearchInput: document.getElementById("dashboardSearchInput"),
	inventoryModal: document.getElementById("inventoryModal"),
	inventoryForm: document.getElementById("inventoryForm"),
	closeInventoryModalBtn: document.getElementById("closeInventoryModalBtn"),
	inventoryId: document.getElementById("inventoryId"),
	inventoryItemWrap: document.getElementById("inventoryItemWrap"),
	inventoryItemInput: document.getElementById("inventoryItemInput"),
	inventoryItemPopup: document.getElementById("inventoryItemPopup"),
	inventoryItem: document.getElementById("inventoryItem"),
	inventoryQty: document.getElementById("inventoryQty"),
	inventoryExpiry: document.getElementById("inventoryExpiry"),
	inventoryPullout: document.getElementById("inventoryPullout"),
	inventoryRemarks: document.getElementById("inventoryRemarks"),
	inventoryComment: document.getElementById("inventoryComment"),
	cancelInventoryBtn: document.getElementById("cancelInventoryBtn"),
	messageModal: document.getElementById("messageModal"),
	messageModalText: document.getElementById("messageModalText"),
	closeMessageModalBtn: document.getElementById("closeMessageModalBtn"),
	okMessageModalBtn: document.getElementById("okMessageModalBtn"),
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
			closeMessageModal();
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
	refs.itemVendorInput.addEventListener("input", onItemVendorTyped);
	refs.itemVendorInput.addEventListener("change", onItemVendorTyped);
	refs.itemVendorInput.addEventListener("focus", () => {
		renderItemVendorPopup(refs.itemVendorInput.value);
	});
	refs.itemVendorInput.addEventListener("keydown", onItemVendorKeydown);
	refs.itemVendorPopup.addEventListener("mousedown", (event) => {
		event.preventDefault();
		const button = event.target.closest("button[data-id]");
		if (!button) {
			return;
		}
		selectItemVendorOption(button.dataset.id);
	});
	refs.itemPolicyType.addEventListener("change", syncPolicyField);
	refs.cancelItemBtn.addEventListener("click", resetItemForm);

	refs.newInventoryBtn.addEventListener("click", () => {
		resetInventoryForm();
		openInventoryModal();
	});
	refs.dashboardSearchInput.addEventListener("input", () => {
		state.dashboardSearch = refs.dashboardSearchInput.value.trim().toLowerCase();
		renderDashboardRows();
	});
	refs.exportExcelBtn.addEventListener("click", exportDashboardExcel);
	refs.inventoryForm.addEventListener("submit", onSaveInventory);
	refs.inventoryItemInput.addEventListener("input", onInventoryItemTyped);
	refs.inventoryItemInput.addEventListener("change", onInventoryItemTyped);
	refs.inventoryItemInput.addEventListener("focus", () => {
		renderInventoryPopup(refs.inventoryItemInput.value);
	});
	refs.inventoryItemInput.addEventListener("keydown", onInventoryItemKeydown);
	refs.inventoryItemPopup.addEventListener("mousedown", (event) => {
		event.preventDefault();
		const button = event.target.closest("button[data-id]");
		if (!button) {
			return;
		}
		selectInventoryOption(button.dataset.id);
	});
	document.addEventListener("click", (event) => {
		if (!refs.itemVendorWrap.contains(event.target)) {
			closeItemVendorPopup();
		}
		if (!refs.inventoryItemWrap.contains(event.target)) {
			closeInventoryPopup();
		}
	});
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
	refs.closeMessageModalBtn.addEventListener("click", closeMessageModal);
	refs.okMessageModalBtn.addEventListener("click", closeMessageModal);
	refs.messageModal.addEventListener("click", (event) => {
		if (event.target === refs.messageModal) {
			closeMessageModal();
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

	if (!sku || !description) {
		return;
	}

	if (!vendorId || !state.vendors.some((entry) => entry.id === vendorId)) {
		showIssueModal("Please select a valid vendor from the pop-up list.");
		return;
	}

	if (returnPolicyType === "months_before_expiry" && returnPolicyMonths <= 0) {
		showIssueModal("Months before expiry must be greater than 0.");
		return;
	}

	const normalizedSku = sku.toLowerCase();
	const skuTaken = state.items.some((item) => item.id !== id && item.sku.trim().toLowerCase() === normalizedSku);
	if (skuTaken) {
		showIssueModal("SKU already exists. Please use a unique SKU.");
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
	refs.itemVendorInput.value = itemVendorLookup.idToLabel.get(item.vendorId) || "";
	closeItemVendorPopup();
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
	refs.itemVendor.value = "";
	refs.itemVendorInput.value = "";
	closeItemVendorPopup();
	syncPolicyField();
}

function syncPolicyField() {
	const enabled = refs.itemPolicyType.value === "months_before_expiry";
	refs.itemPolicyMonths.disabled = !enabled;
}

function onSaveInventory(event) {
	event.preventDefault();

	if (!state.items.length) {
		showIssueModal("Add at least one item before creating inventory rows.");
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
		showIssueModal("Please select a valid item from the pop-up list.");
		return;
	}

	if (payload.quantity <= 0) {
		showIssueModal("Quantity must be greater than 0.");
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
	closeInventoryPopup();
	refs.inventoryQty.value = String(row.quantity);
	refs.inventoryExpiry.value = row.expiryDate;
	refs.inventoryPullout.value = row.pulloutDate || "";
	refs.inventoryRemarks.value = REMARK_OPTIONS.includes(row.remarks) ? row.remarks : "";
	refs.inventoryComment.value = row.comment || "";
}

function deleteInventory(id) {
	state.inventory = state.inventory.filter((entry) => entry.id !== id);
	persist("inventory");
	renderDashboardRows();
}

function updateInventoryInlineField(id, field, value) {
	const row = state.inventory.find((entry) => entry.id === id);
	if (!row) {
		return;
	}

	row[field] = value;
	persist("inventory");
}

function resetInventoryForm() {
	refs.inventoryForm.reset();
	refs.inventoryId.value = "";
	refs.inventoryItem.value = "";
	refs.inventoryItemInput.value = "";
	closeInventoryPopup();
	refs.inventoryRemarks.value = "";
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
	const searchTerm = state.dashboardSearch;
	let visibleRowCount = 0;

	for (const row of state.inventory) {
		const item = state.items.find((entry) => entry.id === row.itemId);
		if (!item) {
			continue;
		}
		const vendor = state.vendors.find((entry) => entry.id === item.vendorId);
		const policyText = policyLabel(item);
		const haystack = [
			item.sku,
			item.description,
			vendor ? vendor.name : "",
			String(row.quantity ?? ""),
			row.expiryDate || "",
			policyText,
			row.pulloutDate || "",
			row.remarks || "",
			row.comment || ""
		].join(" ").toLowerCase();

		if (searchTerm && !haystack.includes(searchTerm)) {
			continue;
		}

		visibleRowCount += 1;

		const tr = document.createElement("tr");
		const policyParts = policyLines(item);
		tr.innerHTML = `
			<td>${escapeHtml(item.sku)}</td>
			<td>
				<div class="item-summary">
					<div class="item-summary-main">${escapeHtml(item.description)}</div>
					<div class="item-summary-sub">${escapeHtml(vendor ? vendor.name : "-")}</div>
				</div>
			</td>
			<td>${row.quantity}</td>
			<td>${formatDate(row.expiryDate)}</td>
			<td>
				<div class="policy-summary">
					<div class="policy-summary-main">${escapeHtml(policyParts[0])}</div>
					<div class="policy-summary-sub">${escapeHtml(policyParts[1])}</div>
				</div>
			</td>
			<td>${formatDate(row.pulloutDate)}</td>
			<td>
				<select class="dashboard-inline-select" data-inline-field="remarks" data-id="${row.id}" aria-label="Edit remarks">
					<option value="" ${row.remarks ? "" : "selected"}></option>
					<option value="Yes, Intact" ${row.remarks === "Yes, Intact" ? "selected" : ""}>Yes, Intact</option>
					<option value="Yes, Loose" ${row.remarks === "Yes, Loose" ? "selected" : ""}>Yes, Loose</option>
					<option value="No, Loose" ${row.remarks === "No, Loose" ? "selected" : ""}>No, Loose</option>
				</select>
			</td>
			<td>
				<textarea class="dashboard-inline-comment" data-inline-field="comment" data-id="${row.id}" rows="1">${escapeHtml(row.comment || "")}</textarea>
			</td>
			<td class="actions">
				<button type="button" data-action="edit-inventory" data-id="${row.id}" class="icon-btn" aria-label="Edit inventory row" title="Edit">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79Z"/>
					</svg>
				</button>
				<button type="button" data-action="delete-inventory" data-id="${row.id}" class="icon-btn danger" aria-label="Delete inventory row" title="Delete">
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M9 3h6l1 2h5v2H3V5h5l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Zm1 12a2 2 0 0 1-2-2V8h14v11a2 2 0 0 1-2 2H7Z"/>
					</svg>
				</button>
			</td>
		`;
		refs.dashboardRows.appendChild(tr);
	}

	if (!visibleRowCount) {
		const tr = document.createElement("tr");
		tr.innerHTML = `<td colspan="9" class="empty-state-cell">No matching dashboard rows.</td>`;
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

	refs.dashboardRows.querySelectorAll("select[data-inline-field='remarks']").forEach((select) => {
		select.addEventListener("change", () => {
			updateInventoryInlineField(select.dataset.id, "remarks", select.value);
		});
	});

	refs.dashboardRows.querySelectorAll("textarea[data-inline-field='comment']").forEach((textarea) => {
		textarea.addEventListener("change", () => {
			updateInventoryInlineField(textarea.dataset.id, "comment", textarea.value.trim());
		});
		textarea.addEventListener("blur", () => {
			updateInventoryInlineField(textarea.dataset.id, "comment", textarea.value.trim());
		});
	});
}

function renderItemVendorOptions() {
	const previous = refs.itemVendor.value;
	itemVendorLookup.options = [];
	itemVendorLookup.labelToId.clear();
	itemVendorLookup.idToLabel.clear();
	itemVendorLookup.highlightedIndex = -1;
	refs.itemVendorPopup.innerHTML = "";

	if (!state.vendors.length) {
		refs.itemVendorInput.value = "";
		refs.itemVendorInput.placeholder = "Add a vendor first";
		refs.itemVendorInput.disabled = true;
		refs.itemVendor.value = "";
		closeItemVendorPopup();
		return;
	}

	refs.itemVendorInput.disabled = false;
	refs.itemVendorInput.placeholder = "Type vendor name";
	for (const vendor of state.vendors) {
		const label = vendor.name;
		itemVendorLookup.options.push({ id: vendor.id, label, lower: label.toLowerCase() });
		itemVendorLookup.labelToId.set(label.toLowerCase(), vendor.id);
		itemVendorLookup.idToLabel.set(vendor.id, label);
	}

	refs.itemVendor.value = previous && state.vendors.some((entry) => entry.id === previous)
		? previous
		: "";
	refs.itemVendorInput.value = refs.itemVendor.value
		? itemVendorLookup.idToLabel.get(refs.itemVendor.value) || ""
		: "";
	closeItemVendorPopup();
}

function onItemVendorTyped() {
	const label = refs.itemVendorInput.value.trim().toLowerCase();
	refs.itemVendor.value = itemVendorLookup.labelToId.get(label) || "";
	renderItemVendorPopup(refs.itemVendorInput.value);
}

function onItemVendorKeydown(event) {
	if (refs.itemVendorPopup.hidden) {
		if (event.key === "ArrowDown" && refs.itemVendorInput.value.trim()) {
			renderItemVendorPopup(refs.itemVendorInput.value);
		}
		return;
	}

	const visibleButtons = refs.itemVendorPopup.querySelectorAll("button[data-id]");
	if (!visibleButtons.length) {
		if (event.key === "Escape") {
			closeItemVendorPopup();
		}
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		itemVendorLookup.highlightedIndex = Math.min(itemVendorLookup.highlightedIndex + 1, visibleButtons.length - 1);
		updateItemVendorPopupHighlight();
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		itemVendorLookup.highlightedIndex = Math.max(itemVendorLookup.highlightedIndex - 1, 0);
		updateItemVendorPopupHighlight();
		return;
	}

	if (event.key === "Enter") {
		event.preventDefault();
		const button = visibleButtons[itemVendorLookup.highlightedIndex] || visibleButtons[0];
		if (button) {
			selectItemVendorOption(button.dataset.id);
		}
		return;
	}

	if (event.key === "Escape") {
		event.preventDefault();
		closeItemVendorPopup();
	}
}

function renderItemVendorPopup(rawQuery) {
	if (refs.itemVendorInput.disabled) {
		closeItemVendorPopup();
		return;
	}

	const query = rawQuery.trim().toLowerCase();
	if (!query) {
		closeItemVendorPopup();
		return;
	}

	const matches = itemVendorLookup.options
		.filter((option) => option.lower.includes(query))
		.slice(0, 8);

	refs.itemVendorPopup.innerHTML = "";
	if (!matches.length) {
		closeItemVendorPopup();
		return;
	}

	for (const match of matches) {
		const li = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		button.dataset.id = match.id;
		button.textContent = match.label;
		li.appendChild(button);
		refs.itemVendorPopup.appendChild(li);
	}

	itemVendorLookup.highlightedIndex = 0;
	refs.itemVendorPopup.hidden = false;
	updateItemVendorPopupHighlight();
}

function updateItemVendorPopupHighlight() {
	const visibleButtons = refs.itemVendorPopup.querySelectorAll("button[data-id]");
	visibleButtons.forEach((button, index) => {
		button.classList.toggle("active", index === itemVendorLookup.highlightedIndex);
	});
}

function selectItemVendorOption(id) {
	refs.itemVendor.value = id;
	refs.itemVendorInput.value = itemVendorLookup.idToLabel.get(id) || "";
	closeItemVendorPopup();
}

function closeItemVendorPopup() {
	refs.itemVendorPopup.hidden = true;
	refs.itemVendorPopup.innerHTML = "";
	itemVendorLookup.highlightedIndex = -1;
}

function renderInventoryItemOptions() {
	const previous = refs.inventoryItem.value;
	inventoryCombo.options = [];
	inventoryCombo.labelToId.clear();
	inventoryCombo.idToLabel.clear();
	refs.inventoryItemPopup.innerHTML = "";
	inventoryCombo.highlightedIndex = -1;

	if (!state.items.length) {
		refs.inventoryItemInput.value = "";
		refs.inventoryItemInput.placeholder = "Add an item first";
		refs.inventoryItemInput.disabled = true;
		refs.inventoryItem.value = "";
		closeInventoryPopup();
		refs.newInventoryBtn.disabled = true;
		closeInventoryModal();
		return;
	}

	refs.inventoryItemInput.disabled = false;
	refs.inventoryItemInput.placeholder = "Type SKU or description";
	refs.newInventoryBtn.disabled = false;
	for (const item of state.items) {
		const vendor = state.vendors.find((entry) => entry.id === item.vendorId);
		const label = `${item.sku} - ${item.description} (${vendor ? vendor.name : "No vendor"})`;
		inventoryCombo.options.push({ id: item.id, label, lower: label.toLowerCase() });
		inventoryCombo.labelToId.set(label.toLowerCase(), item.id);
		inventoryCombo.idToLabel.set(item.id, label);
	}

	refs.inventoryItem.value = previous && state.items.some((entry) => entry.id === previous)
		? previous
		: "";
	refs.inventoryItemInput.value = refs.inventoryItem.value
		? inventoryCombo.idToLabel.get(refs.inventoryItem.value) || ""
		: "";
	closeInventoryPopup();
}

function onInventoryItemTyped() {
	const label = refs.inventoryItemInput.value.trim().toLowerCase();
	refs.inventoryItem.value = inventoryCombo.labelToId.get(label) || "";
	renderInventoryPopup(refs.inventoryItemInput.value);
}

function onInventoryItemKeydown(event) {
	if (refs.inventoryItemPopup.hidden) {
		if (event.key === "ArrowDown" && refs.inventoryItemInput.value.trim()) {
			renderInventoryPopup(refs.inventoryItemInput.value);
		}
		return;
	}

	const visibleButtons = refs.inventoryItemPopup.querySelectorAll("button[data-id]");
	if (!visibleButtons.length) {
		if (event.key === "Escape") {
			closeInventoryPopup();
		}
		return;
	}

	if (event.key === "ArrowDown") {
		event.preventDefault();
		inventoryCombo.highlightedIndex = Math.min(inventoryCombo.highlightedIndex + 1, visibleButtons.length - 1);
		updateInventoryPopupHighlight();
		return;
	}

	if (event.key === "ArrowUp") {
		event.preventDefault();
		inventoryCombo.highlightedIndex = Math.max(inventoryCombo.highlightedIndex - 1, 0);
		updateInventoryPopupHighlight();
		return;
	}

	if (event.key === "Enter") {
		event.preventDefault();
		const button = visibleButtons[inventoryCombo.highlightedIndex] || visibleButtons[0];
		if (button) {
			selectInventoryOption(button.dataset.id);
		}
		return;
	}

	if (event.key === "Escape") {
		event.preventDefault();
		closeInventoryPopup();
	}
}

function renderInventoryPopup(rawQuery) {
	if (refs.inventoryItemInput.disabled) {
		closeInventoryPopup();
		return;
	}

	const query = rawQuery.trim().toLowerCase();
	if (!query) {
		closeInventoryPopup();
		return;
	}

	const matches = inventoryCombo.options
		.filter((option) => option.lower.includes(query))
		.slice(0, 8);

	refs.inventoryItemPopup.innerHTML = "";
	if (!matches.length) {
		closeInventoryPopup();
		return;
	}

	for (const match of matches) {
		const li = document.createElement("li");
		const button = document.createElement("button");
		button.type = "button";
		button.dataset.id = match.id;
		button.textContent = match.label;
		li.appendChild(button);
		refs.inventoryItemPopup.appendChild(li);
	}

	inventoryCombo.highlightedIndex = 0;
	refs.inventoryItemPopup.hidden = false;
	updateInventoryPopupHighlight();
}

function updateInventoryPopupHighlight() {
	const visibleButtons = refs.inventoryItemPopup.querySelectorAll("button[data-id]");
	visibleButtons.forEach((button, index) => {
		button.classList.toggle("active", index === inventoryCombo.highlightedIndex);
	});
}

function selectInventoryOption(id) {
	refs.inventoryItem.value = id;
	refs.inventoryItemInput.value = inventoryCombo.idToLabel.get(id) || "";
	closeInventoryPopup();
}

function closeInventoryPopup() {
	refs.inventoryItemPopup.hidden = true;
	refs.inventoryItemPopup.innerHTML = "";
	inventoryCombo.highlightedIndex = -1;
}

function openInventoryModal() {
	refs.inventoryModal.hidden = false;
	document.body.classList.add("modal-open");
}

function closeInventoryModal() {
	refs.inventoryModal.hidden = true;
	document.body.classList.remove("modal-open");
}

function showIssueModal(message) {
	refs.messageModalText.textContent = message;
	refs.messageModal.hidden = false;
	document.body.classList.add("modal-open");
}

function closeMessageModal() {
	refs.messageModal.hidden = true;
	if (refs.inventoryModal.hidden) {
		document.body.classList.remove("modal-open");
	}
}

function exportDashboardExcel() {
	const searchTerm = state.dashboardSearch;

	const header = [
		"SKU#",
		"Description",
		"Vendor",
		"Qty",
		"Expiry Date",
		"Return Policy",
		"Pull-out Date",
		"Remarks",
		"Comment"
	];

	const dataRows = [];

	for (const row of state.inventory) {
		const item = state.items.find((entry) => entry.id === row.itemId);
		if (!item) {
			continue;
		}
		const vendor = state.vendors.find((entry) => entry.id === item.vendorId);
		const vendorName = vendor ? vendor.name : "-";
		const policy = policyLabel(item);

		if (searchTerm) {
			const haystack = [
				item.sku,
				item.description,
				vendorName,
				String(row.quantity ?? ""),
				row.expiryDate || "",
				policy,
				row.pulloutDate || "",
				row.remarks || "",
				row.comment || ""
			].join(" ").toLowerCase();

			if (!haystack.includes(searchTerm)) {
				continue;
			}
		}

		dataRows.push([
			item.sku,
			item.description,
			vendorName,
			row.quantity ?? 0,
			row.expiryDate || "",
			policy,
			row.pulloutDate || "",
			row.remarks || "",
			row.comment || ""
		]);
	}

	const wsData = [header, ...dataRows];
	const ws = XLSX.utils.aoa_to_sheet(wsData);

	const colWidths = header.map((_, colIdx) => ({
		wpx: Math.max(
			header[colIdx].length * 9,
			...dataRows.map((r) => String(r[colIdx] ?? "").length * 8)
		)
	}));
	ws["!cols"] = colWidths;

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Dashboard");

	const timestamp = new Date().toISOString().slice(0, 10);
	XLSX.writeFile(wb, `joanni_pharma_dashboard_${timestamp}.xlsx`);
}

function exportAllCsv() {
	const header = [
		"record_type",
		"id",
		"name",
		"sku",
		"description",
		"vendor_id",
		"return_policy_type",
		"return_policy_months",
		"item_id",
		"quantity",
		"expiry_date",
		"pullout_date",
		"remarks",
		"comment"
	];

	const rows = [
		...state.vendors.map((entry) => [
			"vendor",
			entry.id,
			entry.name,
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			"",
			""
		]),
		...state.items.map((entry) => [
			"item",
			entry.id,
			"",
			entry.sku,
			entry.description,
			entry.vendorId,
			entry.returnPolicyType,
			String(entry.returnPolicyMonths || 0),
			"",
			"",
			"",
			"",
			"",
			""
		]),
		...state.inventory.map((entry) => [
			"inventory",
			entry.id,
			"",
			"",
			"",
			"",
			"",
			"",
			entry.itemId,
			String(entry.quantity || 0),
			entry.expiryDate || "",
			entry.pulloutDate || "",
			entry.remarks || "",
			entry.comment || ""
		])
	];

	downloadCsv("joanni_pharma_export.csv", header, rows);
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

	if (matchesHeader(header, [
		"record_type",
		"id",
		"name",
		"sku",
		"description",
		"vendor_id",
		"return_policy_type",
		"return_policy_months",
		"item_id",
		"quantity",
		"expiry_date",
		"pullout_date",
		"remarks",
		"comment"
	])) {
		state.vendors = dataRows
			.filter((row) => (row[0] || "").trim().toLowerCase() === "vendor")
			.map((row) => ({
				id: row[1] || uid(),
				name: (row[2] || "").trim()
			}))
			.filter((entry) => entry.name);

		state.items = dataRows
			.filter((row) => (row[0] || "").trim().toLowerCase() === "item")
			.map((row) => ({
				id: row[1] || uid(),
				sku: (row[3] || "").trim(),
				description: (row[4] || "").trim(),
				vendorId: (row[5] || "").trim(),
				returnPolicyType: row[6] === "expiry_month" ? "expiry_month" : "months_before_expiry",
				returnPolicyMonths: Number(row[7] || 0)
			}))
			.filter((entry) => entry.sku && entry.description);

		state.inventory = dataRows
			.filter((row) => (row[0] || "").trim().toLowerCase() === "inventory")
			.map((row) => ({
				id: row[1] || uid(),
				itemId: (row[8] || "").trim(),
				quantity: Number(row[9] || 0),
				expiryDate: (row[10] || "").trim(),
				pulloutDate: (row[11] || "").trim(),
				remarks: REMARK_OPTIONS.includes(row[12]) ? row[12] : "",
				comment: row[13] || ""
			}))
			.filter((entry) => entry.itemId);

		persist("vendors");
		persist("items");
		persist("inventory");
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
			remarks: REMARK_OPTIONS.includes(row[5]) ? row[5] : "",
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

function policyLines(item) {
	if (item.returnPolicyType === "expiry_month") {
		return ["On the month", "of expiry"];
	}
	return [`${item.returnPolicyMonths || 0} month(s)`, "before expiry"];
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
