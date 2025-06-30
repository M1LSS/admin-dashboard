// Smart Teacher Attendance Dashboard JS
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

  const dateInput = document.getElementById("dateFilter");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.addEventListener("change", loadAttendance);
  }
});

function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = database.ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, substitutions = 0;
    snapshot.forEach(child => {
      const data = child.val();
      const key = child.key;
      if (typeof data !== "object" || !data.status || key.length !== 8) return;
      if (data.status === "present") present++;
      else if (["absent", "late"].includes(data.status)) absent++;
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
  const inputs = ["uid", "name", "subject", "class", "phone"].map(field => document.getElementById(`${field}-${uid}`));
  const isDisabled = inputs[0].disabled;
  if (isDisabled) {
    inputs.forEach(input => input.disabled = false);
    button.textContent = "Save";
  } else {
    const [uidInput, name, subject, cls, phone] = inputs.map(i => i.value.trim());
    const updatedData = { name, subject, class: cls, phone };
    if (uidInput !== uid) {
      database.ref("teachers/" + uidInput).set(updatedData).then(() => database.ref("teachers/" + uid).remove()).then(loadTeachers);
    } else {
      database.ref("teachers/" + uid).update(updatedData).then(loadTeachers);
    }
  }
}

function deleteTeacher(uid) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    database.ref("teachers/" + uid).remove().then(loadTeachers);
  }
}

function loadAttendance() {
  const date = document.getElementById("dateFilter").value || new Date().toISOString().split('T')[0];
  const tableBody = document.getElementById("attendanceTable");
  tableBody.innerHTML = "";
  database.ref("attendance/" + selectedDate).once("value", snapshot => {
  snapshot.forEach(child => {
    const uid = child.key;
    const record = child.val();

    // Skip only clearly invalid data
    if (typeof record !== "object") return;

    database.ref("teachers/" + uid + "/name").once("value", nameSnap => {
      const name = nameSnap.val() || uid;

      const row = `
        <tr>
          <td>${name}</td>
          <td>${record.status || "-"}</td>
          <td>${record.punch_in || "-"}</td>
          <td>${record.punch_out || "-"}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  });
});


function loadSubstitutions() {
  const tableBody = document.getElementById("substitutionTableBody");
  tableBody.innerHTML = "";
  database.ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const sub = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `<td>${sub.absent_teacher || "-"}</td><td>${sub.class || "-"}</td><td>${sub.substitute_teacher || "-"}</td>`;
      tableBody.appendChild(row);
    });
  });
}
