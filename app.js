document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tabs.forEach(tab => tab.classList.toggle("active", tab.id === tabId));
    });
  });

  // Default tab
  document.querySelector(".tab-btn.active")?.click();

  // Setup date picker
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const formatDate = d => d.toISOString().split("T")[0];
  const maxDate = formatDate(today);
  const minDate = formatDate(yesterday);

  const dateInput = document.getElementById("dateFilter");
  if (dateInput) {
    dateInput.setAttribute("min", minDate);
    dateInput.setAttribute("max", maxDate);
    dateInput.value = maxDate;
    dateInput.addEventListener("change", loadAttendance);
  }

  // ✅ Moved here: Add Teacher Form listener
  const addTeacherForm = document.getElementById("addTeacherForm");
  if (addTeacherForm) {
    addTeacherForm.addEventListener("submit", e => {
      e.preventDefault();
      const uid = document.getElementById("uid").value.trim();
      const name = document.getElementById("name").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const className = document.getElementById("class").value.trim();
      const phone = document.getElementById("phone").value.trim();

      if (!uid || !name || !subject || !className || !phone) {
        alert("Please fill in all fields.");
        return;
      }

      db.ref("teachers/" + uid).set({ name, subject, class: className, phone })
        .then(() => {
          alert("✅ Teacher added!");
          addTeacherForm.reset();
        })
        .catch(err => {
          console.error("Error:", err);
          alert("❌ Failed to store teacher's information.");
        });
    });
  }

  // Load initial data
  loadDashboardSummary();
  loadAttendance();
});


function loadDashboardSummary() {
  const today = new Date().toISOString().split("T")[0];

  db.ref("attendance/" + today).once("value", snapshot => {
    let present = 0, absent = 0, substituted = 0;

    snapshot.forEach(child => {
      const d = child.val();
      if ((d.status || '').toLowerCase() === "present") present++;
      else absent++;
      if (d.substituted_by) substituted++;
    });

    document.getElementById("presentCount").textContent = present;
    document.getElementById("absentCount").textContent = absent;
    document.getElementById("subsCount").textContent = substituted;

    const ctx = document.getElementById("attendanceChart")?.getContext("2d");
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Present', 'Absent', 'Substituted'],
          datasets: [{
            label: 'Today Summary',
            data: [present, absent, substituted],
            backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f']
          }]
        }
      });
    }
  });
}

document.getElementById("addTeacherForm").addEventListener("submit", e => {
  e.preventDefault();
  const uid = document.getElementById("uid").value.trim();
  const name = document.getElementById("name").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const className = document.getElementById("class").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!uid || !name || !subject || !className || !phone) {
    alert("Please fill in all fields.");
    return;
  }

  db.ref("teachers/" + uid).set({ name, subject, class: className, phone })
    .then(() => {
      alert("✅ Teacher added!");
      e.target.reset();
    })
    .catch(err => {
      console.error("Error:", err);
      alert("❌ Failed to store teacher's information.");
    });
});

function loadAttendance() {
  const input = document.getElementById("dateFilter").value;
  const [yyyy, mm, dd] = input.split("-");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = ""; // Clear previous rows

  db.ref("attendance/" + formattedDate).once("value", snapshot => {
    if (!snapshot.exists()) {
      const row = tbody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 4;
      cell.textContent = "No records found.";
      return;
    }

    snapshot.forEach(child => {
      const d = child.val();
      const row = tbody.insertRow();
      row.insertCell().textContent = d.uid || child.key;
      row.insertCell().textContent = d.status || "Absent";
      row.insertCell().textContent = d.punch_in || "-";
      row.insertCell().textContent = d.punch_out || "-";
    });
  });
}



function assignSubstitutes() {
  const date = document.getElementById("dateFilter").value;
  const [yyyy, mm, dd] = date.split("-");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  db.ref("attendance/" + formattedDate).once("value", snapshot => {
    const available = [], absent = [];

    snapshot.forEach(child => {
      const d = child.val();
      if ((d.status || '').toLowerCase() === "present") available.push(d.uid);
      else absent.push(child.key);
    });

    absent.forEach((absentKey, i) => {
      const sub = available[i % available.length];
      db.ref(`attendance/${formattedDate}/${absentKey}/substituted_by`).set(sub);
    });

    alert("✅ Substitutes assigned.");
    loadSubstitutions();
  });
}

function loadSubstitutions() {
  const date = document.getElementById("dateFilter").value;
  const [yyyy, mm, dd] = date.split("-");
  const formattedDate = `${yyyy}-${mm}-${dd}`;

  const table = document.getElementById("substitutionTableBody");
  table.innerHTML = "";

  db.ref("attendance/" + formattedDate).once("value", snapshot => {
    snapshot.forEach(child => {
      const d = child.val();
      if ((d.status || '').toLowerCase() === "absent" && d.substituted_by) {
        table.innerHTML += `<tr>
          <td>${d.name || d.uid}</td>
          <td>${d.class || "-"}</td>
          <td>${d.substituted_by}</td>
        </tr>`;
      }
    });
  });
}
