document.getElementById("upload-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Please select a CSV file.");

  const formData = new FormData();
  formData.append("statement", file);

  const res = await fetch("/analyze", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  showChart(data.summary);
  fillTable(data.raw);
  document.getElementById("results").style.display = "block";

  // === Handle Uncategorized Vendors ===
  if (data.uncategorized && data.uncategorized.length > 0) {
    const container = document.getElementById("unknown-vendors");
    container.innerHTML = ""; // Clear previous if any

    const categories = [
      "Food", "Grocery", "Shopping", "Rent", "Income", "Medical",
      "Travel", "Utilities", "Subscription","Freinds", "Cash Withdrawal", "Card Bill", "Others", 
    ];

    data.uncategorized.forEach(vendor => {
      const div = document.createElement("div");
      div.style.marginTop = "10px";
      div.innerHTML = `
        <label><b>${vendor}</b>: </label>
        <select>
          <option disabled selected>Select Category</option>
          ${categories.map(c => `<option value="${c}">${c}</option>`).join("")}
        </select>
        <button>Save</button>
      `;

      const select = div.querySelector("select");
      const button = div.querySelector("button");

      button.addEventListener("click", async () => {
        const selectedCategory = select.value;
        if (!selectedCategory) return alert("Please choose a category!");

        await fetch("/learn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor: vendor,
            category: selectedCategory
          })
        });

        div.innerHTML = `✅ Learned: <b>${vendor}</b> → <i>${selectedCategory}</i>`;
      });

      container.appendChild(div);
    });

    document.getElementById("learn-section").style.display = "block";
  } else {
    document.getElementById("learn-section").style.display = "none";
  }
});

function showChart(summary) {
  const ctx = document.getElementById("summaryChart").getContext("2d");
  const categories = Object.keys(summary);
  const values = Object.values(summary);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: generateColors(values.length),
      }],
    },
  });
}

function fillTable(data) {
  const tbody = document.querySelector("#transactionsTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Description}</td>
      <td>₹${row.Amount}</td>
      <td>${row.Category}</td>
    `;
    tbody.appendChild(tr);
  });
}

function generateColors(n) {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#66BB6A', '#BA68C8',
    '#FFA726', '#26A69A', '#EF5350', '#5C6BC0', '#9CCC65'
  ];
  return Array.from({ length: n }, (_, i) => colors[i % colors.length]);
}

// Reset button logic
const resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", () => {
  document.getElementById("fileInput").value = "";
  document.getElementById("results").style.display = "none";
  document.getElementById("summaryChart").remove();
  const canvas = document.createElement("canvas");
  canvas.id = "summaryChart";
  document.querySelector("#results").insertBefore(canvas, document.querySelector("h2 + canvas + h2"));
});

// Clear memory button logic
const clearMemoryBtn = document.getElementById("clearMemoryBtn");
clearMemoryBtn.addEventListener("click", async () => {
  const confirmClear = confirm("Are you sure you want to clear all learned categories?");
  if (!confirmClear) return;
  await fetch("/clear-memory", { method: "POST" });
  alert("Vendor memory cleared.");
  location.reload();
});
