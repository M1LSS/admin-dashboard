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

  document.querySelector(".tab-btn.active")?.click();

  // Setup date picker (allow only yesterday, today, tomorrow)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const dateInput = document.getElementById("dateFilter");
  if (dateInput) {
    dateInput.setAttribute("min", formatDate(yesterday));
    dateInput.setAttribute("max", formatDate(tomorrow));
    dateInput.value = formatDate(today);
    dateInput.addEventListener("change", loadAttendance);
  }

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
  const formattedDate = input;

  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  db.ref("attendance/" + formattedDate).once("value", snapshot => {
    if (!snapshot.exists()) {
      tbody.innerHTML = "<tr><td colspan='4'>No records found.</td></tr>";
      return;
    }

    const seen = new Set();

    snapshot.forEach(child => {
      const d = child.val();
      const uid = d.uid || child.key;

      if (!seen.has(uid)) {
        seen.add(uid);
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${uid}</td>
          <td>${d.status || "Absent"}</td>
          <td>${d.punch_in || "-"}</td>
          <td>${d.punch_out || "-"}</td>
        `;
        tbody.appendChild(row);
      }
    });
  });
}

function assignSubstitutes() {
  const date = document.getElementById("dateFilter").value;

  db.ref("attendance/" + date).once("value", snapshot => {
    const available = [], absent = [];

    snapshot.forEach(child => {
      const d = child.val();
      if ((d.status || '').toLowerCase() === "present") available.push(d.uid);
      else absent.push(child.key);
    });

    absent.forEach((absentKey, i) => {
      const sub = available[i % available.length];
      db.ref(`attendance/${date}/${absentKey}/substituted_by`).set(sub);
    });

    alert("✅ Substitutes assigned.");
    loadSubstitutions();
  });
}

function loadSubstitutions() {
  const date = document.getElementById("dateFilter").value;
  const table = document.getElementById("substitutionTableBody");
  table.innerHTML = "";

  db.ref("attendance/" + date).once("value", snapshot => {
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
