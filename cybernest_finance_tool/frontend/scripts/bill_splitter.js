let participants = [];
let expenses = [];

function addParticipant() {
  const name = document.getElementById("participantName").value.trim();
  if (name && !participants.includes(name)) {
    participants.push(name);
    document.getElementById("participantName").value = "";
    renderParticipants();
  }
}

function renderParticipants() {
  const list = document.getElementById("participantList");
  const splitDiv = document.getElementById("splitParticipants");
  list.innerHTML = "";
  splitDiv.innerHTML = "";
  participants.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    list.appendChild(li);

    const checkbox = document.createElement("label");
    checkbox.className = "inline-flex items-center space-x-2 text-sm";
    checkbox.innerHTML = `
      <input type="checkbox" value="${name}" class="mr-1" />
      ${name}
    `;
    splitDiv.appendChild(checkbox);
  });
}

function addExpense() {
  const payer = document.getElementById("payer").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const checkboxes = document.querySelectorAll("#splitParticipants input:checked");
  const split = Array.from(checkboxes).map(c => c.value);

  if (!payer || isNaN(amount) || amount <= 0 || split.length === 0) {
    alert("Please fill all expense fields correctly.");
    return;
  }

  expenses.push({ payer, amount, split });
  document.getElementById("payer").value = "";
  document.getElementById("amount").value = "";
  checkboxes.forEach(cb => cb.checked = false);
  renderExpenses();
}

function renderExpenses() {
  const list = document.getElementById("expenseList");
  list.innerHTML = "";
  expenses.forEach((exp, i) => {
    const li = document.createElement("li");
    li.textContent = `${exp.payer} paid ₹${exp.amount} split among [${exp.split.join(', ')}]`;
    list.appendChild(li);
  });
}

function submitExpenses() {
  fetch("http://127.0.0.1:5000/split", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ people: participants, expenses })
  })
  .then(res => res.json())
  .then(data => {
    const div = document.getElementById("result");
    div.innerHTML = "<h2 class='text-2xl font-semibold'>Settlements:</h2>";
    data.settlements.forEach(s => {
      const p = document.createElement("p");
      p.textContent = `${s.from} ➜ ${s.to} : ₹${s.amount}`;
      div.appendChild(p);
    });
  })
  .catch(err => alert("Error calculating settlements."));
}
