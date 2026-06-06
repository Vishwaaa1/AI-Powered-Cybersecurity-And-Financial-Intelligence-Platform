document.addEventListener("click", async function (e) {
  if (e.target.classList.contains("save-category")) {
    const row = e.target.closest("div");
    const select = row.querySelector("select");
    const vendor = select.getAttribute("data-vendor");
    const category = select.value;

    if (!category || category === "Select Category") {
      alert("⚠️ Please select a category before saving.");
      return;
    }

    const res = await fetch("/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor, category }),
    });

    const data = await res.json();
    if (data.status === "learned") {
      alert(`✅ Learned: "${vendor}" is now categorized as "${category}"`);
    } else {
      alert("❌ Something went wrong.");
    }
  }
});
