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

  document.querySelector(".tab-btn.active").click();

  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("dateFilter");
  if (dateInput) {
    dateInput.setAttribute("max", today);
    dateInput.value = today;
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
      const status = d.status?.toLowerCase();
      if (status === "present") present++;
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

  const teacherData = { uid, name, subject, class: className, phone };

  db.ref("teachers").push(teacherData)
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
  const date = document.getElementById("dateFilter").value;
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  db.ref("attendance/" + date).once("value", snapshot => {
    if (!snapshot.exists()) {
      tbody.innerHTML = "<tr><td colspan='4'>No records found.</td></tr>";
      return;
    }

    snapshot.forEach(child => {
      const d = child.val();
      tbody.innerHTML += `<tr>
        <td>${d.uid}</td>
        <td>${d.status || "Absent"}</td>
        <td>${d["punch-in timestamp"] || d.punch_in || "-"}</td>
        <td>${d["punch-out timestamp"] || d.punch_out || "-"}</td>
      </tr>`;
    });
  });
}

function assignSubstitutes() {
  const date = document.getElementById("dateFilter").value;
  db.ref("attendance/" + date).once("value", snapshot => {
    const available = [], absent = [];

    snapshot.forEach(child => {
      const d = child.val();
      if (d.status?.toLowerCase() === "present") available.push(d.uid);
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
      if (d.status?.toLowerCase() === "absent" && d.substituted_by) {
        table.innerHTML += `<tr>
          <td>${d.name || d.uid}</td>
          <td>${d.class || "-"}</td>
          <td>${d.substituted_by}</td>
        </tr>`;
      }
    });
  });
}
