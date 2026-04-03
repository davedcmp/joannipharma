"use strict";

const menuButton = document.getElementById("menu-button");
const menuOverlay = document.getElementById("menu-overlay");
const maintenanceItem = document.querySelector(".has-submenu");
const maintenanceToggle = document.querySelector(".submenu-toggle");
const vendorMenuItem = document.getElementById("vendor-menu-item");
const vendorView = document.getElementById("vendor-view");
const vendorViewClose = document.getElementById("vendor-view-close");
const vendorForm = document.getElementById("vendor-form");
const vendorNameInput = document.getElementById("vendor-name");
const vendorList = document.getElementById("vendor-list");
const vendorEmptyState = document.getElementById("vendor-empty-state");
const vendorSearch = document.getElementById("vendor-search");
let selectedVendorItem = null;

const inventoryMenuItem = document.getElementById("inventory-menu-item");
const inventoryView = document.getElementById("inventory-view");
const inventoryViewClose = document.getElementById("inventory-view-close");
const inventoryForm = document.getElementById("inventory-form");
const inventorySkuInput = document.getElementById("inventory-sku");
const inventoryVendorSelect = document.getElementById("inventory-vendor");
const inventoryReturnPolicyLeadInput = document.getElementById("inventory-return-policy-lead");
const inventoryReturnPolicyTypeSelect = document.getElementById("inventory-return-policy-type");
const inventoryDescriptionInput = document.getElementById("inventory-description");
const inventoryList = document.getElementById("inventory-list");
const inventoryEmptyState = document.getElementById("inventory-empty-state");
const inventorySearch = document.getElementById("inventory-search");
const addInventoryBtn = document.getElementById("add-inventory-btn");
const mainGridSearch = document.getElementById("main-grid-search");
const mainGridBody = document.querySelector(".main-grid-table tbody");
let selectedInventoryItem = null;

const confirmationModal = document.getElementById("confirmation-modal");
const confirmationMessage = document.getElementById("confirmation-message");
const confirmationConfirmButton = document.getElementById("confirmation-confirm");
const confirmationCancelButton = document.getElementById("confirmation-cancel");
let activeConfirmPromise = null;

const VENDORS_STORAGE_KEY = "expiration-tracker.vendors";
const INVENTORY_STORAGE_KEY = "expiration-tracker.inventory";
const POLICY_MONTH_OF_EXPIRY = "month of expiry";

const parseReturnPolicy = (returnPolicyText) => {
	const normalizedPolicy = String(returnPolicyText ?? "").trim().toLowerCase();

	if (normalizedPolicy === POLICY_MONTH_OF_EXPIRY) {
		return {
			leadTime: "",
			policyType: POLICY_MONTH_OF_EXPIRY,
		};
	}

	const policyMatch = normalizedPolicy.match(/^(\d+)\s+(month before)$/);
	if (policyMatch) {
		return {
			leadTime: policyMatch[1],
			policyType: policyMatch[2],
		};
	}

	return {
		leadTime: "",
		policyType: "",
	};
};

const buildReturnPolicy = (leadTime, policyType) => {
	if (!policyType) {
		return "";
	}

	if (policyType === POLICY_MONTH_OF_EXPIRY) {
		return POLICY_MONTH_OF_EXPIRY;
	}

	return `${leadTime} ${policyType}`;
};

const readArrayFromLocalStorage = (key) => {
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
};

const writeArrayToLocalStorage = (key, data) => {
	try {
		window.localStorage.setItem(key, JSON.stringify(data));
	} catch (error) {
		console.error("Failed to write to local storage", error);
		showAlert("Saving failed in this browser. Check storage settings and try again.");
		throw error;
	}
};

const getVendorsFromStorage = () => Promise.resolve(readArrayFromLocalStorage(VENDORS_STORAGE_KEY));

const saveVendorsToStorage = async () => {
	if (!vendorList) return;
	const vendors = Array.from(vendorList.querySelectorAll(".vendor-label")).map((label) => label.textContent);
	try {
		writeArrayToLocalStorage(VENDORS_STORAGE_KEY, vendors);
	} catch (error) {
		console.error("Failed to save vendors to browser local storage", error);
		throw error;
	}
};

const populateVendorDropdown = () => {
	if (!inventoryVendorSelect) {
		return;
	}

	const vendors = vendorList
		? Array.from(vendorList.querySelectorAll(".vendor-label")).map(
			(label) => label.textContent ?? ""
		)
		: [];
	const currentValue = inventoryVendorSelect.value;

	const options = inventoryVendorSelect.querySelectorAll("option");
	options.forEach((option, index) => {
		if (index > 0) {
			option.remove();
		}
	});

	vendors.forEach((vendor) => {
		const option = document.createElement("option");
		option.value = vendor;
		option.textContent = vendor;
		inventoryVendorSelect.appendChild(option);
	});

	inventoryVendorSelect.value = currentValue;
};

const getInventoryFromStorage = () => Promise.resolve(readArrayFromLocalStorage(INVENTORY_STORAGE_KEY));

const saveInventoryToStorage = async () => {
	if (!inventoryList) return;
	const inventory = Array.from(inventoryList.querySelectorAll("li")).map((li) => ({
		sku: li.querySelector(".inventory-sku")?.textContent ?? "",
		description: li.querySelector(".inventory-desc")?.textContent ?? "",
		vendor: li.dataset.vendor ?? "",
		returnPolicy: li.dataset.returnPolicy ?? "",
		quantity: li.dataset.quantity ?? "",
		expiryDate: li.dataset.expiryDate ?? "",
		pullOutDate: li.dataset.pullOutDate ?? "",
		remarks: li.dataset.remarks ?? "",
	}));
	try {
		writeArrayToLocalStorage(INVENTORY_STORAGE_KEY, inventory);
	} catch (error) {
		console.error("Failed to save inventory to browser local storage", error);
		throw error;
	}
};

const CLOSE_FADE_MS = 220;

const showConfirmationModal = (message, isAlert = false) => {
	return new Promise((resolve) => {
		if (activeConfirmPromise) {
			return;
		}

		confirmationMessage.textContent = message;
		confirmationModal.classList.remove("view-closing");
		confirmationModal.hidden = false;

		// Show/hide cancel button and update confirm button text
		confirmationCancelButton.hidden = isAlert;
		confirmationConfirmButton.textContent = isAlert ? "OK" : "Confirm";

		const handleConfirm = () => {
			cleanup();
			resolve(true);
		};

		const handleCancel = () => {
			cleanup();
			resolve(false);
		};

		const handleKeydown = (event) => {
			if (event.key === "Enter") {
				handleConfirm();
			} else if (event.key === "Escape" && !isAlert) {
				handleCancel();
			}
		};

		const cleanup = () => {
			confirmationConfirmButton.removeEventListener("click", handleConfirm);
			confirmationCancelButton.removeEventListener("click", handleCancel);
			document.removeEventListener("keydown", handleKeydown);
			activeConfirmPromise = null;
		};

		confirmationConfirmButton.addEventListener("click", handleConfirm);
		confirmationCancelButton.addEventListener("click", handleCancel);
		document.addEventListener("keydown", handleKeydown);
		confirmationConfirmButton.focus();

		activeConfirmPromise = Promise.resolve();
	});
};

const hideConfirmationModal = async () => {
	if (confirmationModal.hidden) {
		return;
	}

	confirmationModal.classList.add("view-closing");
	await new Promise((resolve) => {
		window.setTimeout(resolve, CLOSE_FADE_MS);
	});
	confirmationModal.hidden = true;
	confirmationModal.classList.remove("view-closing");
};

const showAlert = async (message) => {
	await showConfirmationModal(message, true);
	await hideConfirmationModal();
};

const showConfirm = async (message) => {
	const result = await showConfirmationModal(message, false);
	await hideConfirmationModal();
	return result;
};

if (menuButton && menuOverlay) {
	const setSubmenuState = (isOpen) => {
		if (!maintenanceItem || !maintenanceToggle) {
			return;
		}

		maintenanceItem.classList.toggle("submenu-open", isOpen);
		maintenanceToggle.setAttribute("aria-expanded", String(isOpen));
	};

	const setMenuState = (isOpen) => {
		document.body.classList.toggle("menu-open", isOpen);
		menuButton.setAttribute("aria-expanded", String(isOpen));

		if (!isOpen) {
			setSubmenuState(false);
		}
	};

	const CLOSE_FADE_MS = 220;

	const toggleView = (viewElement, show, nextFocusElement) => {
		if (!viewElement) return;

		const activeCloseTimer = viewElement.dataset.closeTimerId;
		if (activeCloseTimer) {
			window.clearTimeout(Number(activeCloseTimer));
			delete viewElement.dataset.closeTimerId;
		}

		if (show) {
			viewElement.classList.remove("view-closing");
			viewElement.hidden = false;
		} else {
			if (viewElement.hidden) {
				return;
			}
			viewElement.classList.add("view-closing");
			const timerId = window.setTimeout(() => {
				viewElement.hidden = true;
				viewElement.classList.remove("view-closing");
				delete viewElement.dataset.closeTimerId;
			}, CLOSE_FADE_MS);
			viewElement.dataset.closeTimerId = String(timerId);
		}

		const card = viewElement.querySelector(".form-card");
		if (card) {
			card.classList.toggle("zoom-in", show);
		}
		if (show && nextFocusElement) {
			nextFocusElement.focus();
		}
	};

	const showVendorView = () => {
		hideInventoryView();
		clearSelectedVendor();
		if (vendorNameInput) {
			vendorNameInput.value = "";
		}
		toggleView(vendorView, true, vendorNameInput);
		setMenuState(false);
	};

	const hideVendorView = () => {
		toggleView(vendorView, false);
	};

	const showInventoryView = () => {
		hideVendorView();
		clearSelectedInventory();
		if (inventorySkuInput) {
			inventorySkuInput.value = "";
		}
		if (inventoryDescriptionInput) {
			inventoryDescriptionInput.value = "";
		}
		if (inventoryVendorSelect) {
			inventoryVendorSelect.value = "";
		}
		if (inventoryReturnPolicyLeadInput) {
			inventoryReturnPolicyLeadInput.value = "";
		}
		if (inventoryReturnPolicyTypeSelect) {
			inventoryReturnPolicyTypeSelect.value = "";
		}
		updatePolicyLeadTimeState();
		toggleView(inventoryView, true, inventorySkuInput);
		setMenuState(false);
	};

	const hideInventoryView = () => {
		toggleView(inventoryView, false);
	};

	const getMainGridQuery = () => mainGridSearch?.value.trim().toLowerCase() ?? "";

	const itemMatchesMainGridQuery = (item, query) => {
		if (!query) {
			return true;
		}

		const haystack = [
			item.sku,
			item.description,
			item.vendor,
			item.returnPolicy,
			item.quantity,
			item.expiryDate,
			item.pullOutDate,
			item.remarks,
		]
			.map((value) => String(value ?? "").toLowerCase())
			.join(" ");

		return haystack.includes(query);
	};

	const renderMainGridEmpty = () => {
		if (!mainGridBody) {
			return;
		}

		mainGridBody.innerHTML = "";
		const row = document.createElement("tr");
		const cell = document.createElement("td");
		cell.colSpan = 9;
		cell.className = "main-grid-empty";
		cell.textContent = "No records yet.";
		row.appendChild(cell);
		mainGridBody.appendChild(row);
	};

	const rebuildInventoryListFromStorage = (inventoryItems) => {
		if (!inventoryList || !inventoryEmptyState) {
			return;
		}

		inventoryList.innerHTML = "";
		clearSelectedInventory();
		inventoryItems.forEach((item) => {
			createInventoryRow(item.sku, item.vendor, item.returnPolicy, item.description, false, item);
		});
		sortInventoryByDescription();
		filterInventoryBySearch();
	};

	const renderMainGridFromData = (inventoryItems) => {
		if (!mainGridBody) {
			return;
		}

		const query = getMainGridQuery();
		const visibleItems = inventoryItems.filter((item) => itemMatchesMainGridQuery(item, query));

		if (visibleItems.length === 0) {
			renderMainGridEmpty();
			return;
		}

		mainGridBody.innerHTML = "";

		visibleItems.forEach((item) => {
			const row = document.createElement("tr");

			const checkboxCell = document.createElement("td");
			checkboxCell.className = "checkbox-cell";
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.className = "grid-checkbox";
			checkboxCell.appendChild(checkbox);
			row.appendChild(checkboxCell);

			const values = [
				{ label: "SKU", value: item.sku || "-" },
				{ label: "Description", value: item.description || "-" },
				{ label: "Quantity", value: item.quantity || "-" },
				{ label: "Return Policy", value: item.returnPolicy || "-" },
				{ label: "Expiry Date", value: item.expiryDate || "-" },
				{ label: "Pull-out Date", value: item.pullOutDate || "-" },
				{ label: "Remarks", value: item.remarks || "-" },
			];

			values.forEach((entry) => {
				const cell = document.createElement("td");
				cell.setAttribute("data-label", entry.label);
				cell.textContent = entry.value;
				row.appendChild(cell);
			});

			const actionCell = document.createElement("td");
			actionCell.setAttribute("data-label", "Actions");
			const editButton = document.createElement("button");
			editButton.type = "button";
			editButton.className = "grid-action-btn";
			editButton.textContent = "Edit";
			editButton.addEventListener("click", () => {
				renderMainGridEditRow(item.sku, item);
			});

			const deleteButton = document.createElement("button");
			deleteButton.type = "button";
			deleteButton.className = "grid-action-btn delete";
			deleteButton.textContent = "Delete";
			deleteButton.addEventListener("click", async () => {
				if (!(await showConfirm(`Delete item "${item.sku}"?`))) {
					return;
				}

				const inventoryItemsLatest = await getInventoryFromStorage();
				const nextItems = inventoryItemsLatest.filter((entry) => String(entry.sku).toLowerCase() !== String(item.sku).toLowerCase());
				writeArrayToLocalStorage(INVENTORY_STORAGE_KEY, nextItems);
				rebuildInventoryListFromStorage(nextItems);
				renderMainGridFromData(nextItems);
			});

			actionCell.append(editButton, deleteButton);
			row.appendChild(actionCell);
			mainGridBody.appendChild(row);
		});
	};

	const renderMainGridFromStorage = async () => {
		const inventoryItems = await getInventoryFromStorage();
		renderMainGridFromData(inventoryItems);
	};

	const renderMainGridEditRow = async (originalSku = "", seedItem = {}) => {
		if (!mainGridBody) {
			return;
		}

		mainGridBody.innerHTML = "";
		const row = document.createElement("tr");
		row.className = "main-grid-edit-row";

		const checkboxCell = document.createElement("td");
		checkboxCell.className = "checkbox-cell";
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "grid-checkbox";
		checkboxCell.appendChild(checkbox);
		row.appendChild(checkboxCell);

		const skuCell = document.createElement("td");
		skuCell.setAttribute("data-label", "SKU");
		const skuWrapper = document.createElement("div");
		skuWrapper.className = "sku-input-wrapper";
		const skuInput = document.createElement("input");
		skuInput.type = "text";
		skuInput.className = "grid-input";
		skuInput.placeholder = "SKU#";
		skuInput.value = seedItem.sku ?? "";
		const suggestionsList = document.createElement("div");
		suggestionsList.className = "sku-suggestions";
		suggestionsList.hidden = true;
		skuWrapper.append(skuInput, suggestionsList);
		skuCell.appendChild(skuWrapper);
		row.appendChild(skuCell);

		const descriptionCell = document.createElement("td");
		descriptionCell.setAttribute("data-label", "Description");
		const descriptionInput = document.createElement("input");
		descriptionInput.type = "text";
		descriptionInput.className = "grid-input";
		descriptionInput.placeholder = "Description";
		descriptionInput.value = seedItem.description ?? "";
		descriptionCell.appendChild(descriptionInput);
		row.appendChild(descriptionCell);

		const quantityCell = document.createElement("td");
		quantityCell.setAttribute("data-label", "Quantity");
		const quantityInput = document.createElement("input");
		quantityInput.type = "number";
		quantityInput.className = "grid-input";
		quantityInput.placeholder = "Qty";
		quantityInput.value = seedItem.quantity ?? "";
		quantityCell.appendChild(quantityInput);
		row.appendChild(quantityCell);

		const policyCell = document.createElement("td");
		policyCell.setAttribute("data-label", "Return Policy");
		const policyInput = document.createElement("input");
		policyInput.type = "text";
		policyInput.className = "grid-input";
		policyInput.placeholder = "Policy";
		policyInput.value = seedItem.returnPolicy ?? "";
		policyCell.appendChild(policyInput);
		row.appendChild(policyCell);

		const expiryCell = document.createElement("td");
		expiryCell.setAttribute("data-label", "Expiry Date");
		const expiryInput = document.createElement("input");
		expiryInput.type = "date";
		expiryInput.className = "grid-input";
		expiryInput.value = seedItem.expiryDate ?? "";
		expiryCell.appendChild(expiryInput);
		row.appendChild(expiryCell);

		const pullOutCell = document.createElement("td");
		pullOutCell.setAttribute("data-label", "Pull-out Date");
		const pullOutInput = document.createElement("input");
		pullOutInput.type = "date";
		pullOutInput.className = "grid-input";
		pullOutInput.value = seedItem.pullOutDate ?? "";
		pullOutCell.appendChild(pullOutInput);
		row.appendChild(pullOutCell);

		const remarksCell = document.createElement("td");
		remarksCell.setAttribute("data-label", "Remarks");
		const remarksInput = document.createElement("input");
		remarksInput.type = "text";
		remarksInput.className = "grid-input";
		remarksInput.placeholder = "Remarks";
		remarksInput.value = seedItem.remarks ?? "";
		remarksCell.appendChild(remarksInput);
		row.appendChild(remarksCell);

		const actionCell = document.createElement("td");
		actionCell.setAttribute("data-label", "Actions");
		const saveButton = document.createElement("button");
		saveButton.type = "button";
		saveButton.className = "grid-action-btn";
		saveButton.textContent = "Save";
		const cancelButton = document.createElement("button");
		cancelButton.type = "button";
		cancelButton.className = "grid-action-btn";
		cancelButton.textContent = "Cancel";
		actionCell.append(saveButton, cancelButton);
		row.appendChild(actionCell);

		mainGridBody.appendChild(row);

		let selectedVendorValue = seedItem.vendor ?? "";

		const hideSuggestions = () => {
			suggestionsList.hidden = true;
			suggestionsList.innerHTML = "";
		};

		const showSuggestions = async (query) => {
			if (!query.trim()) {
				hideSuggestions();
				return;
			}

			const allInventory = await getInventoryFromStorage();
			const filtered = allInventory.filter((item) => String(item.sku ?? "").toLowerCase().includes(query.toLowerCase()));
			if (filtered.length === 0) {
				hideSuggestions();
				return;
			}

			suggestionsList.innerHTML = "";
			filtered.forEach((item) => {
				const div = document.createElement("div");
				div.className = "sku-suggestion-item";
				div.innerHTML = `
					<div class="sku-suggestion-main">
						<strong>${item.sku ?? ""}</strong>
						<span>${item.description || "No description"}</span>
					</div>
					<div class="sku-suggestion-meta">
						<span>Vendor: ${item.vendor || "N/A"}</span>
						<span>Policy: ${item.returnPolicy || "N/A"}</span>
					</div>
				`;
				div.addEventListener("click", () => {
					skuInput.value = item.sku ?? "";
					descriptionInput.value = item.description ?? "";
					selectedVendorValue = item.vendor ?? selectedVendorValue;
					policyInput.value = item.returnPolicy ?? "";
					hideSuggestions();
				});
				suggestionsList.appendChild(div);
			});

			suggestionsList.hidden = false;
		};

		skuInput.addEventListener("input", (event) => {
			showSuggestions(event.target.value);
		});

		skuInput.addEventListener("blur", () => {
			window.setTimeout(hideSuggestions, 160);
		});

		saveButton.addEventListener("click", async () => {
			const nextItem = {
				sku: skuInput.value.trim(),
				description: descriptionInput.value.trim(),
				vendor: selectedVendorValue,
				returnPolicy: policyInput.value.trim(),
				quantity: quantityInput.value.trim(),
				expiryDate: expiryInput.value,
				pullOutDate: pullOutInput.value,
				remarks: remarksInput.value.trim(),
			};

			if (!nextItem.sku) {
				await showAlert("SKU is required.");
				skuInput.focus();
				return;
			}

			const inventoryItems = await getInventoryFromStorage();
			const duplicateSku = inventoryItems
				.filter((entry) => String(entry.sku).toLowerCase() !== String(originalSku).toLowerCase())
				.some((entry) => String(entry.sku).toLowerCase() === String(nextItem.sku).toLowerCase());

			if (duplicateSku) {
				await showAlert("SKU already exists. Use a unique SKU.");
				skuInput.focus();
				skuInput.select();
				return;
			}

			let nextItems = inventoryItems;
			const editIndex = inventoryItems.findIndex((entry) => String(entry.sku).toLowerCase() === String(originalSku).toLowerCase());
			if (editIndex >= 0) {
				nextItems = inventoryItems.map((entry, index) => (index === editIndex ? { ...entry, ...nextItem } : entry));
			} else {
				nextItems = [...inventoryItems, nextItem];
			}

			writeArrayToLocalStorage(INVENTORY_STORAGE_KEY, nextItems);
			rebuildInventoryListFromStorage(nextItems);
			renderMainGridFromData(nextItems);
		});

		cancelButton.addEventListener("click", async () => {
			renderMainGridFromStorage();
		});

		skuInput.focus();
	};

	const addEditableRowToMainGrid = () => {
		renderMainGridEditRow("", {});
	};

	menuButton.addEventListener("click", () => {
		const nextState = !document.body.classList.contains("menu-open");
		setMenuState(nextState);
	});

	menuOverlay.addEventListener("click", () => {
		setMenuState(false);
	});

	if (maintenanceToggle) {
		maintenanceToggle.addEventListener("click", () => {
			const nextState = !maintenanceItem.classList.contains("submenu-open");
			setSubmenuState(nextState);
		});
	}

	if (vendorMenuItem) {
		vendorMenuItem.addEventListener("click", () => {
			showVendorView();
		});
	}

	vendorViewClose?.addEventListener("click", () => {
		hideVendorView();
	});

	if (inventoryMenuItem) {
		inventoryMenuItem.addEventListener("click", () => {
			showInventoryView();
		});
	}

	inventoryViewClose?.addEventListener("click", () => {
		hideInventoryView();
	});

	addInventoryBtn?.addEventListener("click", () => {
		addEditableRowToMainGrid();
	});

	mainGridSearch?.addEventListener("input", () => {
		renderMainGridFromStorage();
	});

	const clearSelectedVendor = () => {
		if (!selectedVendorItem) {
			return;
		}

		selectedVendorItem.classList.remove("vendor-selected");
		selectedVendorItem = null;
	};

	const selectVendor = (listItem) => {
		if (!vendorNameInput) {
			return;
		}

		clearSelectedVendor();
		selectedVendorItem = listItem;
		selectedVendorItem.classList.add("vendor-selected");

		const vendorLabel = listItem.querySelector(".vendor-label");
		vendorNameInput.value = vendorLabel?.textContent ?? "";
		vendorNameInput.focus();
		vendorNameInput.select();
	};

	const filterVendorsBySearch = () => {
		if (!vendorList || !vendorEmptyState) {
			return;
		}

		const query = vendorSearch?.value.trim().toLowerCase() ?? "";
		let visibleCount = 0;

		Array.from(vendorList.querySelectorAll("li")).forEach((li) => {
			const name = li.querySelector(".vendor-label")?.textContent?.toLowerCase() ?? "";
			const matches = !query || name.includes(query);
			li.hidden = !matches;
			if (matches) {
				visibleCount++;
			}
		});

		vendorEmptyState.hidden = visibleCount > 0;
	};

	vendorSearch?.addEventListener("input", filterVendorsBySearch);

	const createVendorRow = (vendorName, persist = true) => {
		if (!vendorList || !vendorEmptyState) {
			return;
		}

		const listItem = document.createElement("li");
		const vendorLabel = document.createElement("span");
		vendorLabel.className = "vendor-label";
		vendorLabel.textContent = vendorName;

		const deleteButton = document.createElement("button");
		deleteButton.type = "button";
		deleteButton.className = "vendor-delete";
		deleteButton.setAttribute("aria-label", `Delete ${vendorName}`);
		deleteButton.innerHTML = "×";
		deleteButton.addEventListener("click", async (event) => {
			event.stopPropagation();
			
			// Check if vendor is in use in any inventory records
			const inventoryItems = Array.from(inventoryList.querySelectorAll("li"));
			const isVendorInUse = inventoryItems.some((item) => item.dataset.vendor === vendorName);
			
			if (isVendorInUse) {
				await showAlert(`Cannot delete vendor "${vendorName}" because it is in use in inventory records.`);
				return;
			}
			
			if (!(await showConfirm(`Delete vendor "${vendorName}"?`))) {
				return;
			}
			if (selectedVendorItem === listItem) {
				clearSelectedVendor();
				if (vendorNameInput) {
					vendorNameInput.value = "";
				}
			}

			listItem.remove();
			vendorEmptyState.hidden = vendorList.children.length > 0;
			await saveVendorsToStorage();
			filterVendorsBySearch();
			populateVendorDropdown();
		});

		listItem.addEventListener("click", () => {
			selectVendor(listItem);
		});

		listItem.append(vendorLabel, deleteButton);
		vendorList.appendChild(listItem);
		vendorEmptyState.hidden = true;
		filterVendorsBySearch();
		if (persist) {
			saveVendorsToStorage();
		}
	};

	vendorForm?.addEventListener("submit", async (event) => {
		event.preventDefault();

		if (!vendorNameInput || !vendorList || !vendorEmptyState) {
			return;
		}

		const vendorName = vendorNameInput.value.trim();
		if (!vendorName) {
			vendorNameInput.focus();
			return;
		}

		if (!(await showConfirm(`Save vendor "${vendorName}"?`))) {
			return;
		}

		if (selectedVendorItem) {
			const vendorLabel = selectedVendorItem.querySelector(".vendor-label");
			const oldVendorName = vendorLabel?.textContent ?? "";
			
			// Update vendor name in the vendor list
			if (vendorLabel) {
				vendorLabel.textContent = vendorName;
			}
			const vendorDelete = selectedVendorItem.querySelector(".vendor-delete");
			if (vendorDelete) {
				vendorDelete.setAttribute("aria-label", `Delete ${vendorName}`);
			}
			
			// Update inventory items that reference this vendor
			if (oldVendorName && oldVendorName !== vendorName) {
				const inventoryItems = Array.from(inventoryList.querySelectorAll("li"));
				inventoryItems.forEach((item) => {
					if (item.dataset.vendor === oldVendorName) {
						item.dataset.vendor = vendorName;
						const vendorMetaSpan = item.querySelector(".inventory-meta-vendor");
						if (vendorMetaSpan) {
							vendorMetaSpan.textContent = vendorName;
						}
					}
				});
				await saveInventoryToStorage();
				renderMainGridFromStorage();
			}
			
			clearSelectedVendor();
			await saveVendorsToStorage();
			filterVendorsBySearch();
		} else {
			createVendorRow(vendorName);
		}

		vendorNameInput.value = "";
		vendorNameInput.focus();
		populateVendorDropdown();
	});

	const clearSelectedInventory = () => {
		if (!selectedInventoryItem) {
			return;
		}

		selectedInventoryItem.classList.remove("inventory-selected");
		selectedInventoryItem = null;
	};

	const updatePolicyLeadTimeState = () => {
		if (!inventoryReturnPolicyLeadInput || !inventoryReturnPolicyTypeSelect) {
			return;
		}

		const policyType = inventoryReturnPolicyTypeSelect.value;
		const shouldDisableLeadTime = !policyType || policyType === POLICY_MONTH_OF_EXPIRY;
		inventoryReturnPolicyLeadInput.disabled = shouldDisableLeadTime;
		if (shouldDisableLeadTime) {
			inventoryReturnPolicyLeadInput.value = "";
		}
	};

	inventoryReturnPolicyTypeSelect?.addEventListener("change", () => {
		updatePolicyLeadTimeState();
	});

	updatePolicyLeadTimeState();

	const selectInventory = (listItem) => {
		if (!inventorySkuInput || !inventoryVendorSelect || !inventoryReturnPolicyLeadInput || !inventoryReturnPolicyTypeSelect || !inventoryDescriptionInput) {
			return;
		}

		clearSelectedInventory();
		selectedInventoryItem = listItem;
		selectedInventoryItem.classList.add("inventory-selected");

		const vendorValue = listItem.dataset.vendor ?? "";
		const returnPolicyValue = listItem.dataset.returnPolicy ?? "";
		const parsedPolicy = parseReturnPolicy(returnPolicyValue);
		inventorySkuInput.value = listItem.querySelector(".inventory-sku")?.textContent ?? "";
		inventoryDescriptionInput.value = listItem.querySelector(".inventory-desc")?.textContent ?? "";
		inventoryVendorSelect.value = vendorValue;
		inventoryReturnPolicyLeadInput.value = parsedPolicy.leadTime;
		inventoryReturnPolicyTypeSelect.value = parsedPolicy.policyType;
		updatePolicyLeadTimeState();
		inventorySkuInput.focus();
		inventorySkuInput.select();
	};

	const createInventoryRow = (sku, vendor, returnPolicy, description, persist = true, extras = {}) => {
		if (!inventoryList || !inventoryEmptyState) {
			return;
		}

		const listItem = document.createElement("li");
		listItem.dataset.vendor = vendor;
		listItem.dataset.returnPolicy = returnPolicy;
		listItem.dataset.quantity = extras.quantity ?? "";
		listItem.dataset.expiryDate = extras.expiryDate ?? "";
		listItem.dataset.pullOutDate = extras.pullOutDate ?? "";
		listItem.dataset.remarks = extras.remarks ?? "";

		const skuSpan = document.createElement("span");
		skuSpan.className = "inventory-sku";
		skuSpan.textContent = sku;

		const detailCell = document.createElement("div");
		detailCell.className = "inventory-detail-cell";

		const descSpan = document.createElement("span");
		descSpan.className = "inventory-desc";
		descSpan.textContent = description;

		const metaRow = document.createElement("div");
		metaRow.className = "inventory-meta";

		const vendorMetaSpan = document.createElement("span");
		vendorMetaSpan.className = "inventory-meta-vendor";
		vendorMetaSpan.textContent = vendor;

		metaRow.append(vendorMetaSpan);
		detailCell.append(descSpan, metaRow);

		const policyMetaSpan = document.createElement("span");
		policyMetaSpan.className = "inventory-meta-policy";
		policyMetaSpan.textContent = returnPolicy;

		const deleteButton = document.createElement("button");
		deleteButton.type = "button";
		deleteButton.className = "inventory-delete";
		deleteButton.setAttribute("aria-label", `Delete ${sku}`);
		deleteButton.innerHTML = "×";
		deleteButton.addEventListener("click", async (event) => {
			event.stopPropagation();
			if (!(await showConfirm(`Delete item "${sku}"?`))) {
				return;
			}
			if (selectedInventoryItem === listItem) {
				clearSelectedInventory();
				if (inventorySkuInput) {
					inventorySkuInput.value = "";
					inventoryVendorSelect.value = "";
					if (inventoryReturnPolicyLeadInput) {
						inventoryReturnPolicyLeadInput.value = "";
					}
					if (inventoryReturnPolicyTypeSelect) {
						inventoryReturnPolicyTypeSelect.value = "";
					}
					updatePolicyLeadTimeState();
					inventoryDescriptionInput.value = "";
				}
			}

			listItem.remove();
			inventoryEmptyState.hidden = inventoryList.children.length > 0;
			await saveInventoryToStorage();
			renderMainGridFromStorage();
		});

		listItem.addEventListener("click", () => {
			selectInventory(listItem);
		});

		listItem.append(skuSpan, detailCell, policyMetaSpan, deleteButton);
		inventoryList.appendChild(listItem);
		inventoryEmptyState.hidden = true;
		if (persist) {
			saveInventoryToStorage();
		}
	};

	inventoryForm?.addEventListener("submit", async (event) => {
		event.preventDefault();

		if (!inventorySkuInput || !inventoryVendorSelect || !inventoryReturnPolicyLeadInput || !inventoryReturnPolicyTypeSelect || !inventoryDescriptionInput || !inventoryList || !inventoryEmptyState) {
			return;
		}

		const sku = inventorySkuInput.value.trim();
		const vendor = inventoryVendorSelect.value;
		const returnPolicyLeadTime = inventoryReturnPolicyLeadInput.value.trim();
		const returnPolicyType = inventoryReturnPolicyTypeSelect.value;
		const description = inventoryDescriptionInput.value.trim();

		if (!sku || !vendor) {
			inventorySkuInput.focus();
			return;
		}

		if (!(await showConfirm(`Save inventory item "${sku}"?`))) {
			return;
		}

		if (returnPolicyType && returnPolicyType !== POLICY_MONTH_OF_EXPIRY && !/^\d+$/.test(returnPolicyLeadTime)) {
			inventoryReturnPolicyLeadInput.focus();
			inventoryReturnPolicyLeadInput.select();
			return;
		}

		const returnPolicy = buildReturnPolicy(returnPolicyLeadTime, returnPolicyType);

		// Check for duplicate SKU (excluding currently selected item)
		const existingSKU = Array.from(inventoryList.querySelectorAll("li"))
			.filter((li) => li !== selectedInventoryItem)
			.some((li) => li.querySelector(".inventory-sku")?.textContent?.toLowerCase() === sku.toLowerCase());

		if (existingSKU) {
			alert("SKU# already exists. Each item must have a unique SKU#.");
			inventorySkuInput.focus();
			inventorySkuInput.select();
			return;
		}

		if (selectedInventoryItem) {
			selectedInventoryItem.querySelector(".inventory-sku").textContent = sku;
			selectedInventoryItem.querySelector(".inventory-desc").textContent = description;
			selectedInventoryItem.dataset.vendor = vendor;
			selectedInventoryItem.dataset.returnPolicy = returnPolicy;
			const editedMeta = selectedInventoryItem.querySelector(".inventory-meta");
		const editedPolicy = selectedInventoryItem.querySelector(".inventory-meta-policy");
		if (editedMeta) {
			const v = editedMeta.querySelector(".inventory-meta-vendor");
			if (v) v.textContent = vendor;
		}
		if (editedPolicy) editedPolicy.textContent = returnPolicy;
			clearSelectedInventory();
			await saveInventoryToStorage();
			sortInventoryByDescription();
			renderMainGridFromStorage();
		} else {
			createInventoryRow(sku, vendor, returnPolicy, description);
			sortInventoryByDescription();
			renderMainGridFromStorage();
		}

		inventorySkuInput.value = "";
		inventoryVendorSelect.value = "";
		inventoryReturnPolicyLeadInput.value = "";
		inventoryReturnPolicyTypeSelect.value = "";
		updatePolicyLeadTimeState();
		inventoryDescriptionInput.value = "";
		inventorySkuInput.focus();
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			if (inventoryView && !inventoryView.hidden) {
				hideInventoryView();
				return;
			}

			if (vendorView && !vendorView.hidden) {
				hideVendorView();
				return;
			}

			setMenuState(false);
		}
	});

	const sortInventoryByDescription = () => {
		if (!inventoryList) return;
		const items = Array.from(inventoryList.querySelectorAll("li"));
		items.sort((a, b) => {
		const descA = a.querySelector(".inventory-desc")?.textContent?.toLowerCase() ?? "";
		const descB = b.querySelector(".inventory-desc")?.textContent?.toLowerCase() ?? "";
			return descA.localeCompare(descB);
		});
		items.forEach((item) => inventoryList.appendChild(item));
	};

	const filterInventoryBySearch = () => {
		if (!inventoryList) return;
		const query = inventorySearch?.value.trim().toLowerCase() ?? "";
		let visibleCount = 0;
		Array.from(inventoryList.querySelectorAll("li")).forEach((li) => {
		const sku = li.querySelector(".inventory-sku")?.textContent.toLowerCase() ?? "";
		const desc = li.querySelector(".inventory-desc")?.textContent.toLowerCase() ?? "";
			const vendor = (li.dataset.vendor ?? "").toLowerCase();
			const policy = (li.dataset.returnPolicy ?? "").toLowerCase();
			const matches = !query || sku.includes(query) || desc.includes(query) || vendor.includes(query) || policy.includes(query);
			li.hidden = !matches;
			if (matches) visibleCount++;
		});
		if (inventoryEmptyState) {
			inventoryEmptyState.hidden = inventoryList.children.length === 0 ? false : visibleCount > 0;
		}
	};

	inventorySearch?.addEventListener("input", filterInventoryBySearch);

	const initializeData = async () => {
		const storedVendors = await getVendorsFromStorage();
		storedVendors.forEach((vendorName) => {
			createVendorRow(vendorName, false);
		});
		filterVendorsBySearch();
		populateVendorDropdown();

		const storedInventory = await getInventoryFromStorage();
		storedInventory.forEach((item) => {
			createInventoryRow(item.sku, item.vendor, item.returnPolicy, item.description, false, item);
		});
		sortInventoryByDescription();
		renderMainGridFromData(storedInventory);
	};

	initializeData();
}
