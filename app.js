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
        <td><input type="text" id="uid-${uid}" value="${uid}" disabled /></td>
        <td><input type="text" id="name-${uid}" value="${teacher.name || ""}" disabled /></td>
        <td><input type="text" id="subject-${uid}" value="${teacher.subject || ""}" disabled /></td>
        <td><input type="text" id="class-${uid}" value="${teacher.class || ""}" disabled /></td>
        <td><input type="text" id="phone-${uid}" value="${teacher.phone || ""}" disabled /></td>
        <td>
          <button onclick="toggleEdit('${uid}', this)">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}


function toggleEdit(uid, button) {
  const uidInput = document.getElementById(`uid-${uid}`);
  const nameInput = document.getElementById(`name-${uid}`);
  const subjectInput = document.getElementById(`subject-${uid}`);
  const classInput = document.getElementById(`class-${uid}`);
  const phoneInput = document.getElementById(`phone-${uid}`);

  const isDisabled = uidInput.disabled;

  if (isDisabled) {
    // Enable fields
    uidInput.disabled = false;
    nameInput.disabled = false;
    subjectInput.disabled = false;
    classInput.disabled = false;
    phoneInput.disabled = false;
    button.textContent = "Save";
  } else {
    // Save logic
    const newUid = uidInput.value.trim();
    const updatedData = {
      name: nameInput.value.trim(),
      subject: subjectInput.value.trim(),
      class: classInput.value.trim(),
      phone: phoneInput.value.trim()
    };

    if (newUid !== uid) {
      database.ref("teachers/" + newUid).set(updatedData)
        .then(() => database.ref("teachers/" + uid).remove())
        .then(() => loadTeachers());
    } else {
      database.ref("teachers/" + uid).update(updatedData)
        .then(() => loadTeachers());
    }
  }
}


function deleteTeacher(uid) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    database.ref("teachers/" + uid).remove()
      .then(() => loadTeachers());
  }
}

function loadAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  database.ref("attendance/" + selectedDate).once("value", snapshot => {
    if (!snapshot.exists()) {
      tableBody.innerHTML = "<tr><td colspan='4'>No records found.</td></tr>";
      return;
    }

    const teacherMap = {};
    database.ref("teachers").once("value", teachersSnapshot => {
      teachersSnapshot.forEach(child => {
        teacherMap[child.key] = child.val().name;
      });

      snapshot.forEach(child => {
        const uid = child.key;
        const data = child.val();

        // Only show UIDs that are 8 characters (to skip invalid keys)
        if (uid.length !== 8 || typeof data !== "object") return;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${teacherMap[uid] || uid}</td>
          <td>${data.status || "absent"}</td>
          <td>${data.punch_in || "-"}</td>
          <td>${data.punch_out || "-"}</td>
        `;
        tableBody.appendChild(row);
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
