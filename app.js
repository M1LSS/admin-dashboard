// Smart Teacher Attendance Dashboard JS

// Firebase configuration is assumed to be initialized from firebase-config.js

// Handle tab switching
window.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  fetchSummary();
  setInterval(fetchSummary, 30000);
  loadTeachers();
  loadAttendance();
  loadSubstitutions();
});

function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = database.ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, substitutions = 0;

    snapshot.forEach(child => {
      const data = child.val();
      const key = child.key;
      if (typeof data !== "object" || !data.status) return;
      if (data.status === "present") present++;
      else if (data.status === "absent" || data.status === "late") absent++;
      if (data.substitution) substitutions++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("substitution-count").innerText = substitutions;
  });
}

function loadTeachers() {
  const tableBody = document.getElementById("teacher-table-body");
  tableBody.innerHTML = "";

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span>${uid}</span></td>
        <td><input type="text" value="${teacher.name || ""}" id="name-${uid}" /></td>
        <td><input type="text" value="${teacher.subject || ""}" id="subject-${uid}" /></td>
        <td><input type="text" value="${teacher.class || ""}" id="class-${uid}" /></td>
        <td><input type="text" value="${teacher.phone || ""}" id="phone-${uid}" /></td>
        <td>
          <button onclick="updateTeacher('${uid}')">Update</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

function updateTeacher(uid) {
  const name = document.getElementById(`name-${uid}`).value.trim();
  const subject = document.getElementById(`subject-${uid}`).value.trim();
  const className = document.getElementById(`class-${uid}`).value.trim();
  const phone = document.getElementById(`phone-${uid}`).value.trim();

  if (!name || !subject || !className || !phone) {
    alert("Please fill in all fields.");
    return;
  }

  database.ref("teachers/" + uid).set({ name, subject, class: className, phone })
    .then(() => {
      alert("✅ Teacher updated successfully!");
      loadTeachers();
    })
    .catch(err => {
      console.error("❌ Error updating teacher:", err);
      alert("❌ Failed to update teacher.");
    });
}

function deleteTeacher(uid) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    database.ref("teachers/" + uid).remove()
      .then(() => {
        alert("🗑️ Teacher deleted successfully.");
        loadTeachers();
      })
      .catch(err => {
        console.error("❌ Error deleting teacher:", err);
        alert("❌ Failed to delete teacher.");
      });
  }
}



function loadAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  database.ref("attendance/" + today).once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const data = child.val();
      if (!data.status) return;

      database.ref("teachers/" + uid + "/name").once("value", snap => {
        const name = snap.val() || uid;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${name}</td>
          <td>${data.status}</td>
          <td>${data.punch_in || "-"}</td>
          <td>${data.punch_out || "-"}</td>
        `;
        tbody.appendChild(row);
      });
    });
  });
}

function loadSubstitutions() {
  const tableBody = document.getElementById("substitutionTableBody");
  tableBody.innerHTML = "";

  database.ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const sub = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sub.absent_teacher || "-"}</td>
        <td>${sub.class || "-"}</td>
        <td>${sub.substitute_teacher || "-"}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}
