// frontend/scripts/dashboard.js

const form = document.getElementById("upload-form");
const fileInput = document.getElementById("fileInput");

// Set up initial chart and placeholder cards
window.addEventListener("DOMContentLoaded", () => {
    const stored = localStorage.getItem("cybernest-transactions");
    const summary = localStorage.getItem("cybernest-summary");
    const balance = localStorage.getItem("cybernest-balance");
    const lastSession = parseInt(localStorage.getItem("cybernest-last-session") || 0);
    const now = new Date().getTime();
    const minutesElapsed = (now - lastSession) / 1000 / 60;

    if (stored && summary && minutesElapsed > 5) {
        const keep = confirm("Restore previous session data?");
        if (keep) {
            const transactions = JSON.parse(stored);
            const parsedSummary = JSON.parse(summary);
            updateSummary(transactions, parseFloat(balance || 0));
            renderChart(parsedSummary);
            renderTransactions(transactions);
            showUncategorized([]); // Don't show old uncategorized items on restore
        } else {
            localStorage.clear();
            renderChart({ Waiting: 1 });
            renderTransactions([]);
            updateSummary([], 0); // Use empty array for consistency
        }
    } else if (stored && summary) {
        // Session is recent, silently restore
        const transactions = JSON.parse(stored);
        const parsedSummary = JSON.parse(summary);
        updateSummary(transactions, parseFloat(balance || 0));
        renderChart(parsedSummary);
        renderTransactions(transactions);
        showUncategorized([]); // Don't show old uncategorized items on restore
    } else {
        renderChart({ Waiting: 1 });
        renderTransactions([]);
        updateSummary([], 0); // Use empty array for consistency
    }
});

form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return alert("Please upload a file.");

    const formData = new FormData();
    formData.append("statement", file);

    const res = await fetch("/analyze", {
        method: "POST",
        body: formData,
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    localStorage.setItem("cybernest-transactions", JSON.stringify(data.raw));
    localStorage.setItem("cybernest-last-session", new Date().getTime());
    localStorage.setItem("cybernest-summary", JSON.stringify(data.summary));
    localStorage.setItem("cybernest-balance", data.balance || 0);

    updateSummary(data.raw, data.balance || 0);
    renderChart(data.summary);
    renderTransactions(data.raw);
    showUncategorized(data.items_to_categorize);
});

// This function calculates and displays the summary cards
function updateSummary(rawTransactions, balance = 0) {
    let totalExpense = 0;
    let totalIncome = 0;

    // Ensure rawTransactions is an array before looping
    if (!Array.isArray(rawTransactions)) {
        rawTransactions = [];
    }

    rawTransactions.forEach(tx => {
        const amount = parseFloat(tx.Amount);
        if (amount < 0) {
            totalExpense += amount;
        } else {
            totalIncome += amount;
        }
    });

    const netChange = totalIncome + totalExpense;
    const startingBalance = balance - netChange;

    document.getElementById("current-balance").innerText = `₹${balance.toFixed(2)}`;
    document.getElementById("starting-balance").innerText = `₹${startingBalance.toFixed(2)}`;
    document.getElementById("total-expense").innerText = `₹${Math.abs(totalExpense).toFixed(2)}`;
    document.getElementById("total-income").innerText = `₹${totalIncome.toFixed(2)}`;
}

// This function renders the bar chart
// This function renders the bar chart
// This function renders the bar chart
// This function renders the bar chart
// This function renders the bar chart
// This function renders the bar chart
function renderChart(summary) {
    const ctx = document.getElementById("expenseChart").getContext("2d");

    // --- Determine Colors Based on Theme ---
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.log("renderChart - isDarkMode:", isDarkMode); // Verify theme detection

    const gridColor = isDarkMode ? 'rgba(100, 116, 139, 0.5)' : 'rgba(209, 213, 219, 0.5)'; // slate-500 @ 50%
    // ** Force text color to WHITE in dark mode **
    const textColor = isDarkMode ? '#FFFFFF' : '#374151'; // White vs gray-700

    // Tooltip colors (remain the same)
    const tooltipTitleColor = isDarkMode ? '#F1F5F9' : '#1F2937';
    const tooltipBodyColor = isDarkMode ? '#F1F5F9' : '#1F2937';
    const tooltipBgColor = isDarkMode ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)';

    const chartData = Object.entries(summary).filter(([key]) => key.toLowerCase() !== 'income');
    const labels = chartData.map(([key]) => key);
    const values = chartData.map(([, val]) => Math.abs(val));
    const colors = labels.map((_, i) => `hsl(${(i * 60) % 360}, 70%, 55%)`);

    // Destroy previous chart instance if it exists
    if (window.expenseChartInstance) {
        window.expenseChartInstance.destroy();
    }

    window.expenseChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels.length ? labels : ["Waiting"],
            datasets: [{
                label: "Spending",
                data: values.length ? values : [1],
                backgroundColor: values.length ? colors : ["#ccc"],
                borderColor: values.length ? colors.map(c => c.replace('55%)', '70%)')) : ["#bbb"],
                borderWidth: 1
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: tooltipBgColor,
                    titleColor: tooltipTitleColor,
                    bodyColor: tooltipBodyColor,
                    padding: 10, cornerRadius: 4, displayColors: false,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor // Apply text color (now White in dark mode)
                    },
                    grid: {
                        color: gridColor,
                        borderColor: gridColor // Match grid border to grid lines
                    }
                },
                x: {
                    ticks: {
                        color: textColor // Apply text color (now White in dark mode)
                    },
                    grid: {
                        display: false, // Keep vertical lines off
                        borderColor: gridColor // Match axis border to grid lines
                    }
                }
            }
        },
    });
}

// This is the SINGLE, CORRECT version of this function
// This is the SINGLE, CORRECT version of this function
function renderTransactions(data) {
    const container = document.getElementById("recent-transactions");
    container.innerHTML = "";

    if (!data || data.length === 0) {
        container.innerHTML = `<p class="text-sm text-gray-500 dark:text-gray-400">No transactions yet. Upload your statement.</p>`; // Added dark text color here too
        return;
    }

    container.style.maxHeight = "300px"; // You might adjust this height
    container.style.overflowY = "auto";
    container.classList.add("pr-2"); // Padding for scrollbar

    data.forEach((tx) => {
        const div = document.createElement("div");
        // Added dark:border-gray-700 for the bottom border
        div.className = "flex justify-between items-center py-2 border-b dark:border-gray-700";

        const amount = parseFloat(tx.Amount);
        const isPositive = amount >= 0;
        // Keep existing color logic for amount (red/green)
        const amountColorClass = isPositive ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
        const formattedAmount = isPositive ? `+${amount.toFixed(2)}` : amount.toFixed(2);

        // ** ADDED dark:text-gray-100 and dark:text-gray-400 for better contrast **
        div.innerHTML = `
            <div>
                <p class="font-medium text-gray-700 dark:text-gray-100">${tx.Description}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">${tx.Category}</p>
            </div>
            <p class="text-sm font-medium ${amountColorClass}">
                ₹${formattedAmount}
            </p>
        `;
        container.appendChild(div);
    });
}

// This function displays the categorization cards for unknown vendors
// frontend/scripts/dashboard.js

// frontend/scripts/dashboard.js

function showUncategorized(items) {
    const container = document.getElementById("unknown-vendors");
    const learnSection = document.getElementById("learn-section");

    if (!items || items.length === 0) {
        learnSection.style.display = "none";
        return;
    }

    learnSection.style.display = "block";
    container.innerHTML = ""; // Clear previous cards

    const toTitleCase = (str) => {
        return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    };

    const categoryOptions = [ /* Your category list */
        "Food", "Travel", "Income", "Grocery", "Medical", "Subscription",
        "Utilities", "Shopping", "Friends", "Rent", "Entertainment", "Fuel", "Others"
    ];

    // Create the datalist HTML once
    const datalistHTML = `
      <datalist id="category-list">
        ${categoryOptions.map(cat => `<option value="${cat}"></option>`).join("")}
      </datalist>
    `;
    // Use insertAdjacentHTML to add the datalist without clearing content if needed later
    container.insertAdjacentHTML('afterbegin', datalistHTML);

    items.forEach((item) => {
        const vendor = item.vendor;
        const suggestion = item.suggestion;
        const defaultFriendlyName = toTitleCase(vendor.trim());
        const card = document.createElement("div");

        // ** Add dark theme classes to the card itself **
        card.className = "bg-white dark:bg-gray-800 dark:border dark:border-gray-700 p-4 rounded-lg shadow w-72 flex-shrink-0 transition-colors duration-300";

        // ** Add dark theme classes to labels, inputs, selects, and text **
        card.innerHTML = `
            <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">Original: ${vendor}</p>
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rename Vendor (Optional)</label>
                <input type="text" value="${defaultFriendlyName}" class="friendly-name-input w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            </div>
            <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select or Type Category</label>
                <input list="category-list" class="category-input w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="-- Choose or type --">
            </div>
            <button class="save-btn w-full bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">Save</button>
        `;

        container.appendChild(card); // Append card AFTER datalist

        const categoryInput = card.querySelector(".category-input");
        if (suggestion && suggestion !== "Uncategorized" && categoryOptions.includes(suggestion)) {
            categoryInput.value = suggestion;
        }

        card.querySelector(".save-btn").onclick = async () => {
            const friendlyName = card.querySelector(".friendly-name-input").value;
            const category = categoryInput.value.trim(); // Trim the input value

            if (!category) { // Check if empty after trimming
                return alert("Please choose or type a category.");
            }

            await fetch("/learn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ vendor, category, friendly_name: friendlyName }),
            });

            alert(`✅ Learned: "${friendlyName}" is now categorized as "${category}". Re-analyzing statement...`);
            // Find the form and submit it to trigger re-analysis
            const uploadForm = document.getElementById("upload-form");
            if (uploadForm && fileInput.files[0]) { // Check if form and file exist
                uploadForm.requestSubmit();
            } else {
                console.warn("Could not automatically re-analyze. Upload form or file missing.");
                // Optionally force a page reload if re-submit isn't reliable
                // window.location.reload();
            }
        };
    });
}

// Inactivity timer to clear local storage
let inactivityTimer;
function resetTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        localStorage.clear();
        alert("Your session has expired due to inactivity.");
        window.location.reload();
    }, 30 * 60 * 1000); // 30 mins
}

["click", "mousemove", "keydown"].forEach(evt => {
    window.addEventListener(evt, resetTimer);
});

resetTimer(); // Initialize timer