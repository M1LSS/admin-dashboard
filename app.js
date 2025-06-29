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
          <button onclick="toggleEdit('${uid}')">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

function toggleEdit(uid) {
  const uidInput = document.getElementById(`uid-${uid}`);
  const nameInput = document.getElementById(`name-${uid}`);
  const subjectInput = document.getElementById(`subject-${uid}`);
  const classInput = document.getElementById(`class-${uid}`);
  const phoneInput = document.getElementById(`phone-${uid}`);
  const editButton = event.target;

  const isDisabled = uidInput.disabled;

  if (isDisabled) {
    // Enable editing
    uidInput.disabled = false;
    nameInput.disabled = false;
    subjectInput.disabled = false;
    classInput.disabled = false;
    phoneInput.disabled = false;
    editButton.textContent = "Save";
  } else {
    // Save changes
    const newUid = uidInput.value.trim();
    const name = nameInput.value.trim();
    const subject = subjectInput.value.trim();
    const className = classInput.value.trim();
    const phone = phoneInput.value.trim();

    if (!newUid || !name || !subject || !className || !phone) {
      alert("All fields are required.");
      return;
    }

    const updatedData = {
      name,
      subject,
      class: className,
      phone
    };

    if (newUid !== uid) {
      // UID changed → create new, delete old
      database.ref("teachers/" + newUid).set(updatedData)
        .then(() => database.ref("teachers/" + uid).remove())
        .then(() => loadTeachers());
    } else {
      // UID same → update existing
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
