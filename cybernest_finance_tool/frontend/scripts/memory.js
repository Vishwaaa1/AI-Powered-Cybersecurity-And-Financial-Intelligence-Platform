// frontend/scripts/memory.js

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Memory JS: DOM Loaded"); // Log: Script start
    const grid = document.getElementById("vendor-grid");
    const searchBar = document.getElementById("search-bar");
    const loadingState = document.getElementById("loading-state");
    const noResultsState = document.getElementById("no-results-state");

    // Ensure grid element exists
    if (!grid) {
        console.error("Memory JS: vendor-grid element not found!");
        if (loadingState) loadingState.textContent = "Error: UI element missing.";
        return; // Stop script if grid is missing
    }

    let allVendors = [];

    const categoryOptions = [
        "Food", "Grocery", "Shopping", "Rent", "Income", "Medical", "Travel",
        "Utilities", "Subscription", "Friends", "Entertainment", "Fuel", "Others"
    ];

    function generateCategoryDropdown(selectedCategory) {
        let optionsHTML = categoryOptions.map(cat =>
            `<option value="${cat}" ${cat === selectedCategory ? "selected" : ""}>${cat}</option>`
        ).join("");
        optionsHTML += '<option value="add_new">-- Add New Category --</option>';
        return `<select class="category-select w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">${optionsHTML}</select>`;
    }

    function renderVendors(vendorsToRender) {
        console.log("Memory JS: Rendering vendors:", vendorsToRender.length); // Log: Rendering start
        grid.innerHTML = "";
        loadingState.classList.add("hidden");

        if (!vendorsToRender || vendorsToRender.length === 0) {
            noResultsState.classList.remove("hidden");
            console.log("Memory JS: No vendors to render."); // Log: No vendors
            return;
        }
        noResultsState.classList.add("hidden");

        vendorsToRender.forEach(vendor => {
            const card = document.createElement("div");
            card.className = "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm transition hover:shadow-md dark:hover:border-slate-600";
            card.dataset.originalVendor = vendor.original;

            const viewModeHTML = `
                <div class="view-mode">
                    <div class="mb-2">
                        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">Friendly Name</div>
                        <div class="text-base font-medium text-gray-800 dark:text-slate-100 friendly-name-text">${vendor.friendly}</div>
                    </div>
                    <div class="mb-4">
                        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">Category</div>
                        <div class="text-base font-medium text-gray-800 dark:text-slate-100 category-text">${vendor.category}</div>
                    </div>
                    <div class="text-xs text-gray-400 dark:text-slate-500 mb-3">Original: ${vendor.original}</div>
                    <div class="flex justify-end gap-2 actions">
                        <button class="edit-btn px-3 py-1 text-sm rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800">Edit</button>
                        <button class="delete-btn px-3 py-1 text-sm rounded bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800">Delete</button>
                    </div>
                </div>`;

            const editModeHTML = `
                <div class="edit-mode hidden">
                    <div class="mb-2">
                        <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Friendly Name</label>
                        <input type="text" class="friendly-name-input w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" value="${vendor.friendly}">
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs text-gray-500 dark:text-slate-400 mb-1">Category</label>
                        ${generateCategoryDropdown(vendor.category)}
                    </div>
                    <div class="new-category-container mt-2"></div>
                    <div class="flex justify-end gap-2 actions mt-4">
                        <button class="save-btn px-3 py-1 text-sm rounded bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800">Save</button>
                        <button class="cancel-btn px-3 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500">Cancel</button>
                    </div>
                </div>`;

            card.innerHTML = viewModeHTML + editModeHTML;
            grid.appendChild(card);
        });

        console.log("Memory JS: Rendering complete."); // Log: Rendering end
    }

    // --- Event Delegation ---
    console.log("Memory JS: Adding main click listener to grid."); // Log: Listener setup
    grid.addEventListener("click", async (e) => {
        console.log("Memory JS: Grid clicked. Target:", e.target); // Log: Click detected

        // Find the parent card
        const card = e.target.closest(".dark\\:bg-slate-800, .bg-white"); // Use specific background class
        if (!card) {
            console.log("Memory JS: Click was outside a card."); // Log: Click ignored
            return;
        }

        console.log("Memory JS: Found card for vendor:", card.dataset.originalVendor); // Log: Card found

        const originalVendor = card.dataset.originalVendor;
        const viewMode = card.querySelector(".view-mode");
        const editMode = card.querySelector(".edit-mode");

        if (!viewMode || !editMode) {
            console.error("Memory JS: View or Edit mode div missing in card:", originalVendor);
            return;
        }

        // --- Button Logic ---
        if (e.target.classList.contains("edit-btn")) {
            console.log("Memory JS: Edit button clicked for", originalVendor);
            viewMode.classList.add("hidden");
            editMode.classList.remove("hidden");
        } else if (e.target.classList.contains("cancel-btn")) {
            console.log("Memory JS: Cancel button clicked for", originalVendor);
            const vendorData = allVendors.find(v => v.original === originalVendor);
            if (vendorData) {
                card.querySelector(".friendly-name-input").value = vendorData.friendly;
                card.querySelector(".category-select").value = vendorData.category;
            }
            const newCatInputContainer = card.querySelector(".new-category-input-container");
            if (newCatInputContainer) newCatInputContainer.remove();
            viewMode.classList.remove("hidden");
            editMode.classList.add("hidden");
        } else if (e.target.classList.contains("delete-btn")) {
            console.log("Memory JS: Delete button clicked for", originalVendor);
            if (!confirm(`Delete "${originalVendor}"? This cannot be undone.`)) return;

            console.log("Memory JS: Sending delete request for", originalVendor);
            try {
                const response = await fetch("/delete-memory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ original_vendor: originalVendor }),
                });

                if (!response.ok) throw new Error(`Server error: ${response.status}`);
                console.log("Memory JS: Delete successful for", originalVendor);
                card.remove();
                allVendors = allVendors.filter(v => v.original !== originalVendor);
            } catch (error) {
                console.error("Memory JS: Delete failed:", error);
                alert("Failed to delete.");
            }
        } else if (e.target.classList.contains("save-btn")) {
            console.log("Memory JS: Save button clicked for", originalVendor);
            const friendlyNameInput = card.querySelector(".friendly-name-input");
            const categorySelect = card.querySelector(".category-select");
            const friendlyName = friendlyNameInput.value.trim();
            const category = categorySelect.value;

            if (!friendlyName) return alert("Friendly name needed.");
            if (category === 'add_new' || !category) return alert("Valid category needed.");

            console.log(`Memory JS: Sending update for ${originalVendor}: ${friendlyName}, ${category}`);
            try {
                const response = await fetch("/update-memory", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ original_vendor: originalVendor, friendly_name: friendlyName, category: category }),
                });

                if (!response.ok) throw new Error(`Server error: ${response.status}`);
                console.log("Memory JS: Update successful for", originalVendor);

                card.querySelector(".friendly-name-text").textContent = friendlyName;
                card.querySelector(".category-text").textContent = category;

                const vendorIndex = allVendors.findIndex(v => v.original === originalVendor);
                if (vendorIndex > -1) {
                    allVendors[vendorIndex] = { ...allVendors[vendorIndex], friendly: friendlyName, category: category };
                }

                const newCatInputContainer = card.querySelector(".new-category-input-container");
                if (newCatInputContainer) newCatInputContainer.remove();

                viewMode.classList.remove("hidden");
                editMode.classList.add("hidden");
            } catch (error) {
                console.error("Memory JS: Save failed:", error);
                alert("Failed to save.");
            }
        } else {
            console.log("Memory JS: Click inside card, but not on a specific button."); // Log: Click ignored
        }
    });

    // --- Handle "Add New Category" Inline ---
    grid.addEventListener("change", (e) => {
        const selectEl = e.target;
        if (selectEl.classList.contains("category-select") && selectEl.value === "add_new") {
            const card = selectEl.closest('.dark\\:bg-slate-800, .bg-white');
            if (!card) return;

            const editMode = card.querySelector('.edit-mode');
            const container = editMode.querySelector('.new-category-container');

            if (!container || container.querySelector(".new-category-input-container")) return;

            const inputContainer = document.createElement("div");
            inputContainer.className = "flex gap-2 mt-2 new-category-input-container";
            inputContainer.innerHTML = `
                <input type="text" placeholder="New category..." class="new-category-input flex-grow p-1 border rounded dark:bg-slate-600 dark:border-slate-500">
                <button class="confirm-new-cat-btn bg-green-500 text-white px-2 py-1 rounded text-sm">OK</button>
                <button class="cancel-new-cat-btn bg-gray-300 dark:bg-slate-600 text-gray-700 dark:text-gray-200 px-2 py-1 rounded text-sm">X</button>
            `;

            container.appendChild(inputContainer);
            selectEl.classList.add("hidden");
            inputContainer.querySelector('.new-category-input').focus();

            const confirmBtn = inputContainer.querySelector(".confirm-new-cat-btn");
            const cancelBtn = inputContainer.querySelector(".cancel-new-cat-btn");
            const newCatInput = inputContainer.querySelector(".new-category-input");

            const cleanup = (selectValue = null) => {
                inputContainer.remove();
                selectEl.classList.remove("hidden");
                const originalVendor = card.dataset.originalVendor;
                const vendorData = allVendors.find(v => v.original === originalVendor);
                selectEl.value = selectValue || (vendorData ? vendorData.category : categoryOptions[0]);
                if (!selectValue && !vendorData) selectEl.selectedIndex = 0;
            };

            confirmBtn.onclick = () => {
                const newCategoryName = newCatInput.value.trim();
                if (newCategoryName) {
                    const exists = categoryOptions.some(opt => opt.toLowerCase() === newCategoryName.toLowerCase());
                    let finalCategoryName = newCategoryName;
                    if (!exists) {
                        categoryOptions.push(newCategoryName);
                        const newOption = new Option(newCategoryName, newCategoryName, true, true);
                        selectEl.insertBefore(newOption, selectEl.querySelector('option[value="add_new"]'));

                        // Update all other dropdowns
                        document.querySelectorAll('.category-select').forEach(otherSelect => {
                            if (otherSelect !== selectEl) {
                                const existsInOther = Array.from(otherSelect.options).some(opt => opt.value === newCategoryName);
                                if (!existsInOther) {
                                    otherSelect.insertBefore(new Option(newCategoryName, newCategoryName), otherSelect.querySelector('option[value="add_new"]'));
                                }
                            }
                        });

                    } else {
                        finalCategoryName = categoryOptions.find(opt => opt.toLowerCase() === newCategoryName.toLowerCase());
                    }
                    cleanup(finalCategoryName);
                } else {
                    alert("Category name empty.");
                }
            };

            cancelBtn.onclick = () => cleanup();
        }
    });

    // --- Search Bar Logic ---
    if (searchBar) {
        searchBar.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredVendors = allVendors.filter(v =>
                (v.friendly && v.friendly.toLowerCase().includes(searchTerm)) ||
                (v.original && v.original.toLowerCase().includes(searchTerm))
            );
            renderVendors(filteredVendors);
        });
    } else {
        console.error("Memory JS: search-bar element not found!");
    }

    // --- Initial Data Fetch ---
    try {
        console.log("Memory JS: Fetching initial memory data...");
        const res = await fetch("/memory-data");
        console.log("Memory JS: Fetch response status:", res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Memory JS: Fetch failed:", res.status, errorText);
            throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }

        allVendors = await res.json();
        console.log("Memory JS: Fetched vendors:", allVendors ? allVendors.length : 0);

        if (!Array.isArray(allVendors)) {
            console.error("Memory JS: Fetched data is not an array:", allVendors);
            allVendors = [];
            throw new Error("Received invalid data format from server.");
        }

        allVendors.sort((a, b) => (a.friendly || "").localeCompare(b.friendly || ""));
        renderVendors(allVendors);

    } catch (error) {
        console.error("Memory JS: Failed to load or render vendor memory:", error);
        loadingState.classList.add("hidden");
        noResultsState.textContent = `Error loading data: ${error.message}. Please check console or try again.`;
        noResultsState.classList.remove("hidden");
    }
});
