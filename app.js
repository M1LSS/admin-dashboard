// Smart Teacher Attendance Dashboard JS

// Firebase is assumed to be initialized via firebase-config.js

// Global Functions (accessible from HTML)
function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = database.ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, late = 0;

    snapshot.forEach(child => {
      const data = child.val();
      if (!data.status) return;
      if (data.status === "present") present++;
      else if (data.status === "absent") absent++;
      else if (data.status === "late") late++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("late-count").innerText = late;

    showToast();
  });
}

function showToast(message = "Summary updated") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Run after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  fetchSummary();
  setInterval(fetchSummary, 30000);

  loadTeachers();
  loadAttendance();
  loadSubstitutions();
  loadSchedule();
  populateTeacherDropdown();

  // Tab navigation
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Teacher form submit
  document.getElementById("addTeacherForm").addEventListener("submit", e => {
    e.preventDefault();

    const uid = document.getElementById("newUID").value.trim();
    const name = document.getElementById("newName").value.trim();
    const subject = document.getElementById("newSubject").value.trim();
    const role = document.getElementById("newRole").value.trim();

    if (!uid || !name || !subject || !role) {
      alert("Please fill in all fields.");
      return;
    }

    const data = { name, subject, role };

    database.ref("teachers/" + uid).set(data).then(() => {
      alert("✅ Teacher added!");
      e.target.reset();
      loadTeachers();
    });
  });

  // Schedule form submit
  document.getElementById("addScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const teacherUID = document.getElementById("scheduleTeacherSelect").value;
    const teacherName = document.getElementById("scheduleTeacherSelect").selectedOptions[0].textContent;
    const day = document.getElementById("scheduleDay").value;
    const time = document.getElementById("scheduleTime").value;
    const className = document.getElementById("scheduleClass").value;
    const subject = document.getElementById("scheduleSubject").value;

    if (!teacherUID || !day || !time || !className || !subject) {
      alert("⚠️ Please fill out all fields.");
      return;
    }

    const scheduleData = {
      teacher: teacherName,
      teacherUID,
      day,
      time,
      class: className,
      subject
    };

    database.ref("schedule").push(scheduleData).then(() => {
      alert("✅ Schedule added!");
      e.target.reset();
      loadSchedule();
    });
  });

  // Autofill subject on teacher selection
  document.getElementById("scheduleTeacherSelect").addEventListener("change", function () {
    const selectedUID = this.value;
    database.ref("teachers/" + selectedUID).once("value", snapshot => {
      const teacher = snapshot.val();
      if (teacher?.subject) {
        document.getElementById("scheduleSubject").value = teacher.subject;
      }
    });
  });
});

// Load teachers into table
function loadTeachers() {
  const tableBody = document.getElementById("teacher-table-body");
  tableBody.innerHTML = "";

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" id="uid-${uid}" value="${uid}" disabled></td>
        <td><input type="text" id="name-${uid}" value="${teacher.name || ""}" disabled></td>
        <td><input type="text" id="subject-${uid}" value="${teacher.subject || ""}" disabled></td>
        <td><input type="text" id="role-${uid}" value="${teacher.role || ""}" disabled></td>
        <td>
          <button onclick="toggleEdit('${uid}', this)">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>`;
      tableBody.appendChild(row);
    });
  });
}

// Inline edit
function toggleEdit(uid, button) {
  const inputs = ["uid", "name", "subject", "role"].map(id => document.getElementById(`${id}-${uid}`));
  const isDisabled = inputs[0].disabled;

  if (isDisabled) {
    inputs.forEach(input => input.disabled = false);
    button.textContent = "Save";
  } else {
    const [uidInput, nameInput, subjectInput, roleInput] = inputs;
    const newUid = uidInput.value.trim();
    const updatedData = {
      name: nameInput.value.trim(),
      subject: subjectInput.value.trim(),
      role: roleInput.value.trim()
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

// Delete teacher
function deleteTeacher(uid) {
  if (confirm("Are you sure to delete this teacher?")) {
    database.ref("teachers/" + uid).remove().then(loadTeachers);
  }
}

// Load attendance
function loadAttendance() {
  const dateInput = document.getElementById("dateFilter");
  const date = dateInput?.value || new Date().toISOString().split("T")[0];

  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  database.ref("attendance/" + date).once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const record = child.val();
      if (!record.status) return;

      database.ref("teachers/" + uid + "/name").once("value", nameSnap => {
        const name = nameSnap.val() || uid;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${name}</td>
          <td>${record.status}</td>
          <td>${record.punch_in || "-"}</td>
          <td>${record.punch_out || "-"}</td>`;
        tbody.appendChild(row);
      });
    });
  });
}

// Load substitutions
function loadSubstitutions() {
  const tbody = document.getElementById("substitutionTableBody");
  tbody.innerHTML = "";

  database.ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const sub = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sub.absent_teacher || "-"}</td>
        <td>${sub.class || "-"}</td>
        <td>${sub.substitute_teacher || "-"}</td>`;
      tbody.appendChild(row);
    });
  });
}

// Load schedule
function loadSchedule() {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  database.ref("schedule").once("value", snapshot => {
    snapshot.forEach(child => {
      const entry = child.val();
      const key = child.key;
      const row = document.createElement("tr");

      row.innerHTML = `
        <td><input type="text" id="teacher-${key}" value="${entry.teacher || "-"}" disabled></td>
        <td><input type="text" id="day-${key}" value="${entry.day || "-"}" disabled></td>
        <td><input type="text" id="time-${key}" value="${entry.time || "-"}" disabled></td>
        <td><input type="text" id="class-${key}" value="${entry.class || "-"}" disabled></td>
        <td><input type="text" id="subject-${key}" value="${entry.subject || "-"}" disabled></td>
        <td>
          <button onclick="toggleEditSchedule('${key}', this)">Edit</button>
          <button onclick="deleteSchedule('${key}')">Delete</button>
        </td>`;
      tbody.appendChild(row);
    });
  });
}

// Populate teacher dropdown
function populateTeacherDropdown() {
  const teacherSelect = document.getElementById("scheduleTeacherSelect");
  teacherSelect.innerHTML = `<option disabled selected value="">Select Teacher</option>`;

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();
      const option = document.createElement("option");
      option.value = uid;
      option.textContent = teacher.name || uid;
      teacherSelect.appendChild(option);
    });
  });
}

// Edit schedule entry
function toggleEditSchedule(key, button) {
  const fields = ["teacher", "day", "time", "class", "subject"].map(id => document.getElementById(`${id}-${key}`));
  const isDisabled = fields[0].disabled;

  if (isDisabled) {
    fields.forEach(f => f.disabled = false);
    button.textContent = "Save";
  } else {
    const [teacherInput, dayInput, timeInput, classInput, subjectInput] = fields;
    const updated = {
      teacher: teacherInput.value.trim(),
      day: dayInput.value.trim(),
      time: timeInput.value.trim(),
      class: classInput.value.trim(),
      subject: subjectInput.value.trim()
    };
    database.ref("schedule/" + key).update(updated).then(loadSchedule);
  }
}

// Delete schedule entry
function deleteSchedule(key) {
  if (confirm("Delete this schedule?")) {
    database.ref("schedule/" + key).remove().then(loadSchedule);
  }
}
