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

  const today = new Date();
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const defaultDate = formatDate(today);
  const dateInput = document.getElementById("dateFilter");
  if (dateInput) {
    dateInput.value = defaultDate;
    dateInput.addEventListener("change", loadAttendance);
  }

  loadDashboardSummary();
  loadAttendance();
  loadTeachers();
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
      loadTeachers();
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

  db.ref("teachers").once("value", teachersSnapshot => {
    const teacherMap = {};
    teachersSnapshot.forEach(child => {
      teacherMap[child.key] = child.val().name;
    });

    db.ref("attendance/" + formattedDate).once("value", snapshot => {
      if (!snapshot.exists()) {
        tbody.innerHTML = "<tr><td colspan='4'>No records found.</td></tr>";
        return;
      }

      const displayedUIDs = new Set();
      snapshot.forEach(child => {
        const d = child.val();
        const uid = d.uid || child.key;

        if (!displayedUIDs.has(uid)) {
          displayedUIDs.add(uid);
          const teacherName = teacherMap[uid] || uid;

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${teacherName}</td>
            <td>${d.status || "Absent"}</td>
            <td>${d.punch_in || "-"}</td>
            <td>${d.punch_out || "-"}</td>`;
          tbody.appendChild(row);
        }
      });
    });
  });
}

function assignSubstitutes() {
  const date = document.getElementById("dateFilter").value;
  const formattedDate = date;

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
  const formattedDate = date;

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

function loadTeachers() {
  const table = document.getElementById("teachersTable").querySelector("tbody");
  table.innerHTML = "";

  db.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const data = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span class="display">${child.key}</span><input class="edit" type="text" value="${child.key}" style="display:none"></td>
        <td><span class="display">${data.name}</span><input class="edit" type="text" value="${data.name}" style="display:none"></td>
        <td><span class="display">${data.subject}</span><input class="edit" type="text" value="${data.subject}" style="display:none"></td>
        <td><span class="display">${data.class}</span><input class="edit" type="text" value="${data.class}" style="display:none"></td>
        <td><span class="display">${data.phone}</span><input class="edit" type="text" value="${data.phone}" style="display:none"></td>
        <td>
          <button class="editBtn">Edit</button>
          <button class="saveBtn" style="display:none">Update</button>
          <button class="deleteBtn">Delete</button>
        </td>
      `;
      table.appendChild(row);

      const editBtn = row.querySelector(".editBtn");
      const saveBtn = row.querySelector(".saveBtn");
      const deleteBtn = row.querySelector(".deleteBtn");

      editBtn.addEventListener("click", () => {
        row.querySelectorAll(".display").forEach(e => e.style.display = "none");
        row.querySelectorAll(".edit").forEach(e => e.style.display = "inline-block");
        editBtn.style.display = "none";
        saveBtn.style.display = "inline-block";
      });

      saveBtn.addEventListener("click", () => {
        const inputs = row.querySelectorAll("input.edit");
        const [uidInput, nameInput, subjectInput, classInput, phoneInput] = inputs;

        const oldUid = child.key;
        const newUid = uidInput.value.trim();
        const updatedData = {
          name: nameInput.value.trim(),
          subject: subjectInput.value.trim(),
          class: classInput.value.trim(),
          phone: phoneInput.value.trim()
        };

        if (newUid !== oldUid) {
          db.ref("teachers/" + newUid).set(updatedData).then(() => {
            db.ref("teachers/" + oldUid).remove().then(loadTeachers);
          });
        } else {
          db.ref("teachers/" + oldUid).set(updatedData).then(loadTeachers);
        }
      });

      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure to delete this teacher?")) {
          db.ref("teachers/" + child.key).remove().then(loadTeachers);
        }
      });
    });
  });
}
