const STORAGE_KEYS = {
	vendors: "jp_vendors",
	items: "jp_items",
	inventory: "jp_inventory"
};

const REMARK_OPTIONS = ["Yes, Intact", "Yes, Loose", "No, Loose"];

const ICONS = {
	edit: `
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm14.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.96 1.96 3.75 3.75 2.13-1.79Z"/>
		</svg>
	`,
	delete: `
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M9 3h6l1 2h5v2H3V5h5l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Zm1 12a2 2 0 0 1-2-2V8h14v11a2 2 0 0 1-2 2H7Z"/>
		</svg>
	`,
	save: `
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M9.55 18.2 3.9 12.55l1.4-1.4 4.25 4.25L18.7 6.25l1.4 1.4-10.55 10.55Z"/>
		</svg>
	`,
	cancel: `
		<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3-1.41-1.41Z"/>
		</svg>
	`
};

const state = {
	vendors: readStore(STORAGE_KEYS.vendors),
	items: readStore(STORAGE_KEYS.items),
	inventory: readStore(STORAGE_KEYS.inventory),
	pulloutDateFilter: "",
	inventoryDrafts: new Map()
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

let pendingDeleteAction = null;
let closeItemVendorPopup, renderItemVendorPopup;
let closeInventoryPopup, renderInventoryPopup;

const refs = {
	dashboardSection: document.getElementById("dashboardSection"),
	vendorSection: document.getElementById("vendorSection"),
	itemSection: document.getElementById("itemSection"),
	menuPanel: document.getElementById("mainMenuPanel"),
	menuToggleBtn: document.getElementById("menuToggleBtn"),
	menuBackdrop: document.getElementById("menuBackdrop"),
	startupScreen: document.getElementById("startupScreen"),
	closeStartupScreenBtn: document.getElementById("closeStartupScreenBtn"),
	startupScreenSummary: document.getElementById("startupScreenSummary"),
	startupCandidateRows: document.getElementById("startupCandidateRows"),
	startupContinueBtn: document.getElementById("startupContinueBtn"),
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
	pulloutDateFilter: document.getElementById("pulloutDateFilter"),
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
	inventoryRemarks: document.getElementById("inventoryRemarks"),
	inventoryComment: document.getElementById("inventoryComment"),
	cancelInventoryBtn: document.getElementById("cancelInventoryBtn"),
	messageModal: document.getElementById("messageModal"),
	messageModalTitle: document.getElementById("messageModalTitle"),
	messageModalText: document.getElementById("messageModalText"),
	closeMessageModalBtn: document.getElementById("closeMessageModalBtn"),
	okMessageModalBtn: document.getElementById("okMessageModalBtn"),
	confirmModal: document.getElementById("confirmModal"),
	confirmModalText: document.getElementById("confirmModalText"),
	closeConfirmModalBtn: document.getElementById("closeConfirmModalBtn"),
	cancelConfirmModalBtn: document.getElementById("cancelConfirmModalBtn"),
	confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
	dashboardRows: document.getElementById("dashboardRows")
};

init();

function init() {
	bindEvents();
	renderAll();
	showSection("dashboard");
	openStartupScreen();
}

function bindEvents() {
	refs.menuToggleBtn.addEventListener("click", toggleMainMenu);
	refs.menuBackdrop.addEventListener("click", closeMainMenu);
	setupMainMenuSectionAnimations();
	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeStartupScreen();
			closeMessageModal();
			closeConfirmModal();
			closeMainMenu();
		}
	});

	if (refs.startupScreen && refs.startupContinueBtn && refs.startupCandidateRows) {
		if (refs.closeStartupScreenBtn) {
			refs.closeStartupScreenBtn.addEventListener("click", closeStartupScreen);
		}
		refs.startupContinueBtn.addEventListener("click", closeStartupScreen);
		refs.startupScreen.addEventListener("click", (event) => {
			if (event.target === refs.startupScreen) {
				closeStartupScreen();
			}
		});
		refs.startupCandidateRows.addEventListener("click", onStartupCandidateTableClick);
		refs.startupCandidateRows.addEventListener("keydown", onStartupCandidateTableKeydown);
	}

	if (refs.homeBtn) {
		refs.homeBtn.addEventListener("click", () => showSection("dashboard"));
	}
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
	refs.vendorRows.addEventListener("click", onVendorTableClick);

	refs.itemForm.addEventListener("submit", onSaveItem);
	({ close: closeItemVendorPopup, renderPopup: renderItemVendorPopup } = bindComboBox(itemVendorLookup, refs.itemVendorInput, refs.itemVendorPopup, refs.itemVendor));
	refs.itemPolicyType.addEventListener("change", syncPolicyField);
	refs.cancelItemBtn.addEventListener("click", resetItemForm);
	refs.itemRows.addEventListener("click", onItemTableClick);

	refs.newInventoryBtn.addEventListener("click", () => {
		resetInventoryForm();
		openInventoryModal();
	});
	refs.pulloutDateFilter.addEventListener("change", () => {
		state.pulloutDateFilter = refs.pulloutDateFilter.value.trim();
		renderDashboardRows();
	});
	refs.exportExcelBtn.addEventListener("click", () => {
		exportDashboardExcel();
		closeMainMenu();
	});
	refs.dashboardRows.addEventListener("click", onDashboardTableClick);
	refs.dashboardRows.addEventListener("input", onDashboardTableEdit);
	refs.dashboardRows.addEventListener("change", onDashboardTableEdit);
	refs.inventoryForm.addEventListener("submit", onSaveInventory);
	({ close: closeInventoryPopup, renderPopup: renderInventoryPopup } = bindComboBox(inventoryCombo, refs.inventoryItemInput, refs.inventoryItemPopup, refs.inventoryItem));
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
	refs.closeConfirmModalBtn.addEventListener("click", closeConfirmModal);
	refs.cancelConfirmModalBtn.addEventListener("click", closeConfirmModal);
	refs.confirmDeleteBtn.addEventListener("click", confirmDelete);
	refs.confirmModal.addEventListener("click", (event) => {
		if (event.target === refs.confirmModal) {
			closeConfirmModal();
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
	collapseMainMenuSections();
}

function collapseMainMenuSections() {
	if (!refs.menuPanel) {
		return;
	}

	for (const section of refs.menuPanel.querySelectorAll("details")) {
		setMenuSectionExpanded(section, false, { immediate: true });
	}
}

function setupMainMenuSectionAnimations() {
	if (!refs.menuPanel) {
		return;
	}

	for (const section of refs.menuPanel.querySelectorAll("details")) {
		const summary = section.querySelector("summary");
		const content = section.querySelector(".menu-group-content");
		if (!summary || !content) {
			continue;
		}

		if (section.open) {
			section.classList.add("is-open");
			content.style.maxHeight = "none";
			content.style.opacity = "1";
			content.style.transform = "translateY(0)";
			content.style.marginTop = "0.3rem";
		} else {
			section.classList.remove("is-open");
		}

		summary.addEventListener("click", (event) => {
			event.preventDefault();
			setMenuSectionExpanded(section, !section.classList.contains("is-open"));
		});
	}
}

function setMenuSectionExpanded(section, shouldOpen, options = {}) {
	const { immediate = false } = options;
	if (!section) {
		return;
	}

	const content = section.querySelector(".menu-group-content");
	if (!content) {
		section.open = shouldOpen;
		section.classList.toggle("is-open", shouldOpen);
		return;
	}

	if (immediate) {
		section.open = shouldOpen;
		section.classList.toggle("is-open", shouldOpen);
		content.style.transition = "none";
		if (shouldOpen) {
			content.style.maxHeight = "none";
			content.style.opacity = "1";
			content.style.transform = "translateY(0)";
			content.style.marginTop = "0.3rem";
		} else {
			content.style.maxHeight = "0px";
			content.style.opacity = "0";
			content.style.transform = "translateY(-20px)";
			content.style.marginTop = "0";
		}
		requestAnimationFrame(() => {
			content.style.transition = "";
		});
		return;
	}

	if (shouldOpen) {
		section.open = true;
		content.style.maxHeight = "0px";
		content.style.opacity = "0";
		content.style.transform = "translateY(-20px)";
		content.style.marginTop = "0";
		void content.offsetHeight;

		section.classList.add("is-open");
		content.style.maxHeight = `${content.scrollHeight}px`;
		content.style.opacity = "1";
		content.style.transform = "translateY(0)";
		content.style.marginTop = "0.3rem";

		const onOpenEnd = (event) => {
			if (event.target !== content || event.propertyName !== "max-height") {
				return;
			}
			content.style.maxHeight = "none";
			content.removeEventListener("transitionend", onOpenEnd);
		};
		content.addEventListener("transitionend", onOpenEnd);
		return;
	}

	if (!section.open && !section.classList.contains("is-open")) {
		return;
	}

	content.style.maxHeight = `${content.scrollHeight}px`;
	content.style.opacity = "1";
	content.style.transform = "translateY(0)";
	content.style.marginTop = "0.3rem";
	void content.offsetHeight;

	section.classList.remove("is-open");
	content.style.maxHeight = "0px";
	content.style.opacity = "0";
	content.style.transform = "translateY(-20px)";
	content.style.marginTop = "0";

	const onCloseEnd = (event) => {
		if (event.target !== content || event.propertyName !== "max-height") {
			return;
		}
		section.open = false;
		content.removeEventListener("transitionend", onCloseEnd);
	};
	content.addEventListener("transitionend", onCloseEnd);
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
	renderStartupCandidateRows();
	renderDashboardRows();
	syncPolicyField();
}

function openModal(element) {
	if (!element) {
		return;
	}

	element.hidden = false;
	document.body.classList.add("modal-open");
}

function closeModal(element) {
	if (!element) {
		return;
	}

	element.hidden = true;
	syncModalBodyState();
}

function syncModalBodyState() {
	const openModalExists = [refs.startupScreen, refs.inventoryModal, refs.messageModal, refs.confirmModal]
		.filter(Boolean)
		.some((element) => !element.hidden);
	document.body.classList.toggle("modal-open", openModalExists);
}

function openStartupScreen() {
	if (!refs.startupScreen) {
		return;
	}

	openModal(refs.startupScreen);
}

function closeStartupScreen() {
	if (!refs.startupScreen) {
		return;
	}

	closeModal(refs.startupScreen);
}

function onStartupCandidateTableClick(event) {
	const row = event.target.closest("tr[data-action='open-startup-candidate'][data-id]");
	if (!row) {
		return;
	}

	openStartupCandidate(row.dataset.id);
}

function onStartupCandidateTableKeydown(event) {
	if (event.key !== "Enter" && event.key !== " ") {
		return;
	}

	const row = event.target.closest("tr[data-action='open-startup-candidate'][data-id]");
	if (!row) {
		return;
	}

	event.preventDefault();
	openStartupCandidate(row.dataset.id);
}

function openStartupCandidate(id) {
	if (!id) {
		return;
	}

	closeStartupScreen();
	showSection("dashboard");
	focusDashboardRow(id);
}

function focusDashboardRow(id) {
	if (!id) {
		return;
	}

	const targetRow = refs.dashboardRows.querySelector(`tr[data-dashboard-row-id="${id}"]`);
	if (!targetRow) {
		return;
	}

	targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
	targetRow.classList.remove("row-focus-target");
	void targetRow.offsetWidth;
	targetRow.classList.add("row-focus-target");
	targetRow.focus({ preventScroll: true });

	window.setTimeout(() => {
		targetRow.classList.remove("row-focus-target");
	}, 1700);
}

function onVendorTableClick(event) {
	const button = event.target.closest("button[data-action][data-id]");
	if (!button) {
		return;
	}

	const { action, id } = button.dataset;
	if (action === "edit-vendor") {
		editVendor(id);
		return;
	}

	if (action === "delete-vendor") {
		deleteVendor(id);
	}
}

function onItemTableClick(event) {
	const button = event.target.closest("button[data-action][data-id]");
	if (!button) {
		return;
	}

	const { action, id } = button.dataset;
	if (action === "edit-item") {
		editItem(id);
		return;
	}

	if (action === "delete-item") {
		deleteItem(id);
	}
}

function onDashboardTableClick(event) {
	const button = event.target.closest("button[data-action][data-id]");
	if (!button) {
		return;
	}

	const { action, id } = button.dataset;
	if (action === "save-inline-inventory") {
		saveInventoryInlineEdits(id);
		return;
	}

	if (action === "cancel-inline-inventory") {
		cancelInventoryInlineEdits(id);
		return;
	}

	if (action === "edit-inventory") {
		editInventory(id);
		return;
	}

	if (action === "delete-inventory") {
		deleteInventory(id);
	}
}

function onDashboardTableEdit(event) {
	const { inlineField: field, id } = event.target.dataset;
	if (!field || !id) {
		return;
	}
	stageInventoryInlineField(id, field, event.target.value);
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
		showIssueModal("Vendor is used by one or more items. Update or delete those items first.", "Cannot Delete");
		return;
	}

	showDeleteConfirm("Delete this vendor?", () => {
		state.vendors = state.vendors.filter((entry) => entry.id !== id);
		persist("vendors");
		renderAll();
	});
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
		showIssueModal("Item is used by inventory rows. Delete those rows first.", "Cannot Delete");
		return;
	}

	showDeleteConfirm("Delete this item?", () => {
		state.items = state.items.filter((entry) => entry.id !== id);
		persist("items");
		renderAll();
	});
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
		expiryDate: monthInputToDateString(refs.inventoryExpiry.value),
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
	refs.inventoryExpiry.value = dateStringToMonthInput(row.expiryDate);
	refs.inventoryRemarks.value = REMARK_OPTIONS.includes(row.remarks) ? row.remarks : "";
	refs.inventoryComment.value = row.comment || "";
}

function deleteInventory(id) {
	showDeleteConfirm("Delete this inventory row?", () => {
		state.inventory = state.inventory.filter((entry) => entry.id !== id);
		state.inventoryDrafts.delete(id);
		persist("inventory");
		renderDashboardRows();
	});
}

function stageInventoryInlineField(id, field, value, options = {}) {
	const { rerenderIfNeeded = true } = options;
	const row = state.inventory.find((entry) => entry.id === id);
	if (!row) {
		return;
	}
	const item = state.items.find((entry) => entry.id === row.itemId);
	const basePulloutDate = resolvePulloutDate(row, item);
	const hadDraft = state.inventoryDrafts.has(id);

	const draft = state.inventoryDrafts.get(id) || {
		pulloutDate: basePulloutDate,
		remarks: row.remarks || "",
		comment: row.comment || ""
	};

	draft[field] = value;

	const hasChanges = (draft.pulloutDate || "") !== basePulloutDate
		|| (draft.remarks || "") !== (row.remarks || "")
		|| (draft.comment || "") !== (row.comment || "");

	if (hasChanges) {
		state.inventoryDrafts.set(id, {
			pulloutDate: draft.pulloutDate || "",
			remarks: draft.remarks || "",
			comment: draft.comment || ""
		});
	} else {
		state.inventoryDrafts.delete(id);
	}

	if (rerenderIfNeeded) {
		const hasDraft = state.inventoryDrafts.has(id);
		if (hadDraft !== hasDraft) {
			updateDashboardRowActionButtons(id, hasDraft);
		}
	}
}

function updateDashboardRowActionButtons(id, isInlineEditing) {
	const actionCell = refs.dashboardRows.querySelector(`td.actions[data-row-actions-id="${id}"]`);
	if (!actionCell) {
		return;
	}

	actionCell.innerHTML = buildDashboardRowActions(id, isInlineEditing);
}

function buildActionButtons(id, actions) {
	return actions.map(({ action, label, title, icon, danger = false }) => `
		<button type="button" data-action="${action}" data-id="${id}" class="icon-btn${danger ? " danger" : ""}" aria-label="${label}" title="${title}">
			${icon}
		</button>
	`).join("");
}

function buildDashboardRowActions(id, isInlineEditing) {
	return isInlineEditing
		? buildActionButtons(id, [
			{ action: "save-inline-inventory", label: "Save inline changes", title: "Save", icon: ICONS.save },
			{ action: "cancel-inline-inventory", label: "Cancel inline changes", title: "Cancel", icon: ICONS.cancel, danger: true }
		])
		: buildActionButtons(id, [
			{ action: "edit-inventory", label: "Edit inventory row", title: "Edit", icon: ICONS.edit },
			{ action: "delete-inventory", label: "Delete inventory row", title: "Delete", icon: ICONS.delete, danger: true }
		]);
}

function saveInventoryInlineEdits(id) {
	const row = state.inventory.find((entry) => entry.id === id);
	const draft = state.inventoryDrafts.get(id);
	if (!row || !draft) {
		return;
	}

	row.pulloutDate = monthYearToMonthYearFormat(draft.pulloutDate);
	row.remarks = draft.remarks || "";
	row.comment = draft.comment || "";
	state.inventoryDrafts.delete(id);
	persist("inventory");
	renderDashboardRows();
}

function cancelInventoryInlineEdits(id) {
	if (!state.inventoryDrafts.has(id)) {
		return;
	}

	state.inventoryDrafts.delete(id);
	renderDashboardRows();
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
				${buildActionButtons(vendor.id, [
					{ action: "edit-vendor", label: "Edit vendor", title: "Edit", icon: ICONS.edit },
					{ action: "delete-vendor", label: "Delete vendor", title: "Delete", icon: ICONS.delete, danger: true }
				])}
			</td>
		`;
		refs.vendorRows.appendChild(tr);
	}
}

function renderItemRows() {
	refs.itemRows.innerHTML = "";
	const vendorMap = createMapById(state.vendors);

	for (const item of state.items) {
		const vendor = vendorMap.get(item.vendorId);
		const tr = document.createElement("tr");
		tr.innerHTML = `
			<td>${escapeHtml(item.sku)}</td>
			<td>${escapeHtml(item.description)}</td>
			<td>${escapeHtml(vendor ? vendor.name : "-")}</td>
			<td>${escapeHtml(policyLabel(item))}</td>
			<td class="actions">
				${buildActionButtons(item.id, [
					{ action: "edit-item", label: "Edit item", title: "Edit", icon: ICONS.edit },
					{ action: "delete-item", label: "Delete item", title: "Delete", icon: ICONS.delete, danger: true }
				])}
			</td>
		`;
		refs.itemRows.appendChild(tr);
	}
}

function renderDashboardRows() {
	refs.dashboardRows.innerHTML = "";
	const dashboardEntries = collectDashboardEntries();

	for (const entry of dashboardEntries) {
		const { row, item, vendorName, pulloutDate, policyParts, rowStatus } = entry;
		const draft = state.inventoryDrafts.get(row.id);
		const inlineRemarks = draft ? draft.remarks : (row.remarks || "");
		const inlineComment = draft ? draft.comment : (row.comment || "");
		const isInlineEditing = Boolean(draft);
		const tr = document.createElement("tr");
		tr.dataset.dashboardRowId = row.id;
		tr.tabIndex = -1;
		applyRowStatusClass(tr, rowStatus);
		tr.innerHTML = `
			<td>${escapeHtml(item.sku)}</td>
			<td>
				<div class="item-summary">
					<div class="item-summary-main">${escapeHtml(item.description)}</div>
					<div class="item-summary-sub">${escapeHtml(vendorName)}</div>
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
			<td>${formatPulloutDate(pulloutDate)}</td>
			<td>
				<select class="dashboard-inline-select" data-inline-field="remarks" data-id="${row.id}" aria-label="Edit remarks">
					<option value="" ${inlineRemarks ? "" : "selected"}></option>
					<option value="Yes, Intact" ${inlineRemarks === "Yes, Intact" ? "selected" : ""}>Yes, Intact</option>
					<option value="Yes, Loose" ${inlineRemarks === "Yes, Loose" ? "selected" : ""}>Yes, Loose</option>
					<option value="No, Loose" ${inlineRemarks === "No, Loose" ? "selected" : ""}>No, Loose</option>
				</select>
			</td>
			<td>
				<textarea class="dashboard-inline-comment" data-inline-field="comment" data-id="${row.id}" rows="1">${escapeHtml(inlineComment)}</textarea>
			</td>
			<td class="actions" data-row-actions-id="${row.id}">
				${buildDashboardRowActions(row.id, isInlineEditing)}
			</td>
		`;
		refs.dashboardRows.appendChild(tr);
	}

	if (!dashboardEntries.length) {
		const tr = document.createElement("tr");
		tr.innerHTML = `<td colspan="9" class="empty-state-cell">No dashboard rows.</td>`;
		refs.dashboardRows.appendChild(tr);
	}
}

function applyRowStatusClass(rowElement, rowStatus) {
	if (rowStatus === "expired") {
		rowElement.classList.add("row-expired");
		return;
	}

	if (rowStatus === "pullout") {
		rowElement.classList.add("row-pullout");
	}
}

function renderStartupCandidateRows() {
	if (!refs.startupCandidateRows || !refs.startupScreenSummary) {
		return;
	}

	refs.startupCandidateRows.innerHTML = "";
	const candidates = collectPulloutCandidates();
	refs.startupScreenSummary.textContent = candidates.length
		? `${candidates.length} inventory entr${candidates.length === 1 ? "y is" : "ies are"} candidate${candidates.length === 1 ? "" : "s"} for pull-out. Click a row to open its inventory entry.`
		: "No pull-out candidates found right now.";

	for (const entry of candidates) {
		const { row, item, vendorName, pulloutDate, rowStatus } = entry;
		const tr = document.createElement("tr");
		tr.className = "startup-candidate-row";
		tr.dataset.action = "open-startup-candidate";
		tr.dataset.id = row.id;
		tr.tabIndex = 0;
		tr.setAttribute("role", "button");
		tr.setAttribute("aria-label", `Open inventory entry for ${item.description}`);
		applyRowStatusClass(tr, rowStatus);
		tr.innerHTML = `
			<td>
				<div class="item-summary">
					<div class="item-summary-main">${escapeHtml(item.description)}</div>
					<div class="item-summary-sub">${escapeHtml(vendorName)}</div>
				</div>
			</td>
			<td>
				<div class="startup-date-pair">
					<div class="startup-date-main">Expiry: ${formatDateMonthYear(row.expiryDate)}</div>
					<div class="startup-date-main">Pull-out: ${formatPulloutDate(pulloutDate)}</div>
				</div>
			</td>
		`;
		refs.startupCandidateRows.appendChild(tr);
	}

	if (!candidates.length) {
		const tr = document.createElement("tr");
		tr.innerHTML = `<td colspan="2" class="empty-state-cell">No pull-out candidates found.</td>`;
		refs.startupCandidateRows.appendChild(tr);
	}
}

function bindComboBox(combo, inputEl, popupEl, hiddenEl) {
	function closePopup() {
		popupEl.hidden = true;
		popupEl.innerHTML = "";
		combo.highlightedIndex = -1;
	}

	function updateHighlight() {
		popupEl.querySelectorAll("button[data-id]").forEach((btn, i) => {
			btn.classList.toggle("active", i === combo.highlightedIndex);
		});
	}

	function select(id) {
		hiddenEl.value = id;
		inputEl.value = combo.idToLabel.get(id) || "";
		closePopup();
	}

	function renderPopup(rawQuery) {
		if (inputEl.disabled) {
			closePopup();
			return;
		}
		const query = rawQuery.trim().toLowerCase();
		if (!query) {
			closePopup();
			return;
		}
		const matches = combo.options.filter((o) => o.lower.includes(query)).slice(0, 8);
		popupEl.innerHTML = "";
		if (!matches.length) {
			closePopup();
			return;
		}
		for (const match of matches) {
			const li = document.createElement("li");
			const btn = document.createElement("button");
			btn.type = "button";
			btn.dataset.id = match.id;
			btn.textContent = match.label;
			li.appendChild(btn);
			popupEl.appendChild(li);
		}
		combo.highlightedIndex = 0;
		popupEl.hidden = false;
		updateHighlight();
	}

	function onTyped() {
		const label = inputEl.value.trim().toLowerCase();
		hiddenEl.value = combo.labelToId.get(label) || "";
		renderPopup(inputEl.value);
	}

	function onKeydown(event) {
		if (popupEl.hidden) {
			if (event.key === "ArrowDown" && inputEl.value.trim()) {
				renderPopup(inputEl.value);
			}
			return;
		}
		const buttons = popupEl.querySelectorAll("button[data-id]");
		if (!buttons.length) {
			if (event.key === "Escape") {
				closePopup();
			}
			return;
		}
		if (event.key === "ArrowDown") {
			event.preventDefault();
			combo.highlightedIndex = Math.min(combo.highlightedIndex + 1, buttons.length - 1);
			updateHighlight();
			return;
		}
		if (event.key === "ArrowUp") {
			event.preventDefault();
			combo.highlightedIndex = Math.max(combo.highlightedIndex - 1, 0);
			updateHighlight();
			return;
		}
		if (event.key === "Enter") {
			event.preventDefault();
			const btn = buttons[combo.highlightedIndex] || buttons[0];
			if (btn) {
				select(btn.dataset.id);
			}
			return;
		}
		if (event.key === "Escape") {
			event.preventDefault();
			closePopup();
		}
	}

	inputEl.addEventListener("input", onTyped);
	inputEl.addEventListener("change", onTyped);
	inputEl.addEventListener("focus", () => renderPopup(inputEl.value));
	inputEl.addEventListener("keydown", onKeydown);
	popupEl.addEventListener("mousedown", (event) => {
		event.preventDefault();
		const btn = event.target.closest("button[data-id]");
		if (btn) {
			select(btn.dataset.id);
		}
	});

	return { close: closePopup, renderPopup };
}

function populateLookupOptions(combo, entries, getLabel) {
	combo.options = [];
	combo.labelToId.clear();
	combo.idToLabel.clear();
	combo.highlightedIndex = -1;

	for (const entry of entries) {
		const label = getLabel(entry);
		combo.options.push({ id: entry.id, label, lower: label.toLowerCase() });
		combo.labelToId.set(label.toLowerCase(), entry.id);
		combo.idToLabel.set(entry.id, label);
	}
}

function renderItemVendorOptions() {
	const previous = refs.itemVendor.value;
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
	populateLookupOptions(itemVendorLookup, state.vendors, (vendor) => vendor.name);

	refs.itemVendor.value = previous && state.vendors.some((entry) => entry.id === previous)
		? previous
		: "";
	refs.itemVendorInput.value = refs.itemVendor.value
		? itemVendorLookup.idToLabel.get(refs.itemVendor.value) || ""
		: "";
	closeItemVendorPopup();
}

function renderInventoryItemOptions() {
	const previous = refs.inventoryItem.value;
	const vendorMap = createMapById(state.vendors);
	refs.inventoryItemPopup.innerHTML = "";

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
	populateLookupOptions(inventoryCombo, state.items, (item) => {
		const vendor = vendorMap.get(item.vendorId);
		return `${item.sku} - ${item.description} (${vendor ? vendor.name : "No vendor"})`;
	});

	refs.inventoryItem.value = previous && state.items.some((entry) => entry.id === previous)
		? previous
		: "";
	refs.inventoryItemInput.value = refs.inventoryItem.value
		? inventoryCombo.idToLabel.get(refs.inventoryItem.value) || ""
		: "";
	closeInventoryPopup();
}

function openInventoryModal() {
	openModal(refs.inventoryModal);
}

function closeInventoryModal() {
	closeModal(refs.inventoryModal);
}

function showIssueModal(message, title = "Unable to Save") {
	refs.messageModalTitle.textContent = title;
	refs.messageModalText.textContent = message;
	openModal(refs.messageModal);
}

function closeMessageModal() {
	closeModal(refs.messageModal);
}

function showDeleteConfirm(message, onConfirm) {
	pendingDeleteAction = typeof onConfirm === "function" ? onConfirm : null;
	refs.confirmModalText.textContent = message;
	openModal(refs.confirmModal);
}

function closeConfirmModal() {
	pendingDeleteAction = null;
	closeModal(refs.confirmModal);
}

function confirmDelete() {
	const action = pendingDeleteAction;
	closeConfirmModal();
	if (typeof action === "function") {
		action();
	}
}

function exportDashboardExcel() {
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

	for (const entry of collectDashboardEntries()) {
		const { row, item, vendorName, policyText, pulloutDate } = entry;
		dataRows.push([
			item.sku,
			item.description,
			vendorName,
			row.quantity ?? 0,
			row.expiryDate || "",
			policyText,
			formatPulloutDate(pulloutDate),
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
	const itemMap = createMapById(state.items);
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
		...state.inventory.map((entry) => buildInventoryCsvRow(entry, itemMap))
	];

	downloadCsv("joanni_pharma_export.csv", header, rows);
}

function buildInventoryCsvRow(entry, itemMap) {
	const item = itemMap.get(entry.itemId);
	const pulloutDate = resolvePulloutDate(entry, item);

	return [
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
			pulloutDate,
			entry.remarks || "",
			entry.comment || ""
	];
}

function collectDashboardEntries() {
	const itemMap = createMapById(state.items);
	const vendorMap = createMapById(state.vendors);
	const entries = [];

	for (const row of state.inventory) {
		const item = itemMap.get(row.itemId);
		if (!item) {
			continue;
		}

		const vendor = vendorMap.get(item.vendorId);
		const vendorName = vendor ? vendor.name : "-";
		const pulloutDate = resolvePulloutDate(row, item);
		const policyText = policyLabel(item);

		if (state.pulloutDateFilter) {
			const pulloutMonthInput = dateStringToMonthInput(monthYearToDateString(pulloutDate));
			if (pulloutMonthInput !== state.pulloutDateFilter) {
				continue;
			}
		}

		entries.push({
			row,
			item,
			vendorName,
			pulloutDate,
			policyText,
			policyParts: policyLines(item),
			rowStatus: getInventoryRowStatus(row.expiryDate, pulloutDate)
		});
	}

	entries.sort((a, b) => {
		const pulloutA = monthYearSortValue(a.pulloutDate);
		const pulloutB = monthYearSortValue(b.pulloutDate);
		if (pulloutA !== pulloutB) {
			return pulloutA - pulloutB;
		}

		const vendorCompare = a.vendorName.localeCompare(b.vendorName, undefined, { sensitivity: "base" });
		if (vendorCompare !== 0) {
			return vendorCompare;
		}

		return a.item.description.localeCompare(b.item.description, undefined, { sensitivity: "base" });
	});

	return entries;
}

function collectPulloutCandidates() {
	return collectDashboardEntries().filter((entry) => entry.rowStatus !== "normal");
}

function monthYearSortValue(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return Number.POSITIVE_INFINITY;
	}

	const [monthPart, yearPart] = raw.split("/");
	const month = Number(monthPart);
	const year = Number(yearPart);
	if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12) {
		return Number.POSITIVE_INFINITY;
	}

	const fullYear = year < 100 ? 2000 + year : year;
	return (fullYear * 100) + month;
}

function createMapById(entries) {
	return new Map(entries.map((entry) => [entry.id, entry]));
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
			showIssueModal("CSV imported successfully.", "Import Complete");
		} catch (error) {
			showIssueModal(`Import failed: ${error.message}`, "Import Failed");
		} finally {
			refs.csvFileInput.value = "";
		}
	};
	reader.readAsText(file);
}

function importCsvText(text) {
	const cleanText = String(text || "").replace(/^\uFEFF/, "");
	const rows = parseCsv(cleanText);
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
				pulloutDate: normalizeMonthYear((row[11] || "").trim()),
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
			pulloutDate: normalizeMonthYear((row[4] || "").trim()),
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
		.replace(/^\uFEFF/, "")
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, "_");
}

function matchesHeader(actual, expected) {
	const normalized = [...actual];
	while (normalized.length > 0 && !normalized[normalized.length - 1]) {
		normalized.pop();
	}

	if (normalized.length !== expected.length) {
		return false;
	}

	return expected.every((entry, index) => normalized[index] === entry);
}

function policyLabel(item) {
	if (item.returnPolicyType === "expiry_month") {
		return "Month of expiry";
	}
	return `${item.returnPolicyMonths || 0} month(s) before expiry`;
}

function policyLines(item) {
	if (item.returnPolicyType === "expiry_month") {
		return ["Month", "of expiry"];
	}
	return [`${item.returnPolicyMonths || 0} month(s)`, "before expiry"];
}

function calculatePulloutDate(expiryDate, item) {
	if (!expiryDate || !item) {
		return "";
	}

	const parts = String(expiryDate).split("-");
	if (parts.length < 2) {
		return "";
	}
	const year = Number(parts[0]);
	const monthIndex = Number(parts[1]) - 1;
	if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
		return "";
	}

	const baseDate = new Date(year, monthIndex, 1);

	const pullout = new Date(baseDate);
	pullout.setMonth(pullout.getMonth() - 1);
	if (item.returnPolicyType === "months_before_expiry") {
		const monthsBefore = Number(item.returnPolicyMonths || 0);
		if (monthsBefore > 0) {
			pullout.setMonth(pullout.getMonth() - monthsBefore);
		}
	}

	const pulloutYear = pullout.getFullYear();
	const pulloutMonth = String(pullout.getMonth() + 1).padStart(2, "0");
	const twoDigitYear = String(pulloutYear % 100).padStart(2, "0");
	return `${pulloutMonth}/${twoDigitYear}`;
}

function resolvePulloutDate(row, item) {
	const manual = normalizeMonthYear(row && row.pulloutDate);
	if (manual) {
		return manual;
	}
	return calculatePulloutDate(row && row.expiryDate, item);
}

function normalizeMonthYear(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}

	const [month, year] = raw.split("/");
	const monthNumber = Number(month);
	const yearNumber = Number(year);
	if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
		return "";
	}

	const twoDigitYear = yearNumber % 100;
	return `${String(monthNumber).padStart(2, "0")}/${String(twoDigitYear).padStart(2, "0")}`;
}

function monthYearToDateString(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}

	const [month, year] = raw.split("/");
	const monthNumber = Number(month);
	const yearNumber = Number(year);
	if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
		return "";
	}

	const fullYear = yearNumber < 100 ? (yearNumber < 50 ? 2000 + yearNumber : 1900 + yearNumber) : yearNumber;
	return `${fullYear}-${String(monthNumber).padStart(2, "0")}-01`;
}

function monthInputToDateString(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}

	const [year, month] = raw.split("-");
	const yearNumber = Number(year);
	const monthNumber = Number(month);
	if (!Number.isInteger(yearNumber) || !Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
		return "";
	}

	return `${yearNumber}-${String(monthNumber).padStart(2, "0")}-01`;
}

function dateStringToMonthInput(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}

	const parts = raw.split("-");
	if (parts.length < 2) {
		return "";
	}

	const year = Number(parts[0]);
	const month = Number(parts[1]);
	if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
		return "";
	}

	return `${year}-${String(month).padStart(2, "0")}`;
}

function monthYearToMonthInput(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}

	const [month, year] = raw.split("/");
	const monthNumber = Number(month);
	const yearNumber = Number(year);
	if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
		return "";
	}

	const fullYear = yearNumber < 100 ? (yearNumber < 50 ? 2000 + yearNumber : 1900 + yearNumber) : yearNumber;
	return `${fullYear}-${String(monthNumber).padStart(2, "0")}`;
}

function monthYearToMonthYearFormat(value) {
	const raw = String(value || "").trim();
	if (!raw) {
		return "";
	}

	const [month, year] = raw.split("/");
	const monthNumber = Number(month);
	const yearNumber = Number(year);
	if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
		return "";
	}

	const twoDigitYear = yearNumber % 100;
	return `${String(monthNumber).padStart(2, "0")}/${String(twoDigitYear).padStart(2, "0")}`;
}

function formatMonthYear(value) {
	if (!value) {
		return "-";
	}

	const [month, year] = String(value).split("/");
	const monthNumber = Number(month);
	if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) {
		return value;
	}

	const yearNumber = Number(year);
	if (!Number.isInteger(yearNumber)) {
		return value;
	}

	return `${String(monthNumber).padStart(2, "0")}/${String(yearNumber % 100).padStart(2, "0")}`;
}

function formatPulloutDate(value) {
	const normalizedDate = monthYearToDateString(value);
	return normalizedDate ? formatDate(normalizedDate) : formatMonthYear(value);
}

function getInventoryRowStatus(expiryDate, pulloutDate) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const expiry = new Date(expiryDate);
	if (!Number.isNaN(expiry.valueOf())) {
		expiry.setHours(0, 0, 0, 0);
		if (expiry < today) {
			return "expired";
		}
	}

	const pulloutKey = monthYearKey(pulloutDate);
	if (!pulloutKey) {
		return "normal";
	}

	const currentMonth = String(today.getMonth() + 1).padStart(2, "0");
	const currentKey = `${today.getFullYear()}-${currentMonth}`;
	if (pulloutKey <= currentKey) {
		return "pullout";
	}

	return "normal";
}

function monthYearKey(monthYear) {
	const value = String(monthYear || "").trim();
	const [month, year] = value.split("/");
	if (!month || !year) {
		return "";
	}

	const monthNumber = Number(month);
	const yearNumber = Number(year);
	if (!Number.isInteger(monthNumber) || !Number.isInteger(yearNumber) || monthNumber < 1 || monthNumber > 12) {
		return "";
	}

	const fullYear = yearNumber < 100 ? (yearNumber < 50 ? 2000 + yearNumber : 1900 + yearNumber) : yearNumber;
	return `${fullYear}-${String(monthNumber).padStart(2, "0")}`;
}

function formatDate(value) {
	if (!value) {
		return "-";
	}

	const date = new Date(value);
	if (Number.isNaN(date.valueOf())) {
		return value;
	}

	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = String(date.getFullYear() % 100).padStart(2, "0");
	return `${month}/${year}`;
}

function formatDateMonthYear(value) {
	return formatDate(value);
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
