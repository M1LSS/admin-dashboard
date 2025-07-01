// Firebase is assumed to be initialized from firebase-config.js

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
  loadSchedule();
  populateTeacherDropdown();

  document.getElementById("addTeacherForm").addEventListener("submit", e => {
    e.preventDefault();
    const uid = document.getElementById("newUID").value.trim();
    const name = document.getElementById("newName").value.trim();
    const subject = document.getElementById("newSubject").value.trim();
    const className = document.getElementById("newClass").value.trim();
    const phone = document.getElementById("newPhone").value.trim();

    if (!uid || !name || !subject || !className || !phone) {
      alert("Please fill in all fields.");
      return;
    }

    const data = { name, subject, class: className, phone };
    database.ref("teachers/" + uid).set(data).then(() => {
      alert("✅ Teacher added!");
      e.target.reset();
      loadTeachers();
      populateTeacherDropdown();
    });
  });

  document.getElementById("scheduleForm").addEventListener("submit", e => {
    e.preventDefault();
    const teacher = document.getElementById("scheduleTeacher").value;
    const day = document.getElementById("scheduleDay").value;
    const time = document.getElementById("scheduleTime").value;
    const className = document.getElementById("scheduleClass").value;
    const subject = document.getElementById("scheduleSubject").value;

    if (!teacher || !day || !time || !className || !subject) {
      alert("Please fill in all schedule fields.");
      return;
    }

    const newRef = database.ref("schedule").push();
    newRef.set({ teacher, day, time, class: className, subject })
      .then(() => {
        alert("✅ Schedule added!");
        e.target.reset();
        loadSchedule();
      });
  });
});

function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const ref = database.ref("attendance/" + today);

  ref.once("value", snapshot => {
    let present = 0, absent = 0, late = 0;
    snapshot.forEach(child => {
      const data = child.val();
      if (data.status === "present") present++;
      else if (data.status === "absent") absent++;
      else if (data.status === "late") late++;
    });
    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("late-count").innerText = late;
  });
}

function loadTeachers() {
  const tableBody = document.getElementById("teacher-table-body");
  tableBody.innerHTML = "";

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const t = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" id="uid-${uid}" value="${uid}" disabled></td>
        <td><input type="text" id="name-${uid}" value="${t.name || ''}" disabled></td>
        <td><input type="text" id="subject-${uid}" value="${t.subject || ''}" disabled></td>
        <td><input type="text" id="class-${uid}" value="${t.class || ''}" disabled></td>
        <td><input type="text" id="phone-${uid}" value="${t.phone || ''}" disabled></td>
        <td>
          <button onclick="toggleEdit('${uid}', this)">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>`;
      tableBody.appendChild(row);
    });
  });
}

function toggleEdit(uid, btn) {
  const inputs = ["uid", "name", "subject", "class", "phone"].map(id => document.getElementById(`${id}-${uid}`));
  const disabled = inputs[0].disabled;

  if (disabled) {
    inputs.forEach(i => i.disabled = false);
    btn.textContent = "Save";
  } else {
    const [uidInput, nameInput, subjectInput, classInput, phoneInput] = inputs;
    const newUid = uidInput.value.trim();
    const newData = {
      name: nameInput.value.trim(),
      subject: subjectInput.value.trim(),
      class: classInput.value.trim(),
      phone: phoneInput.value.trim()
    };

    if (newUid !== uid) {
      database.ref("teachers/" + newUid).set(newData)
        .then(() => database.ref("teachers/" + uid).remove())
        .then(() => loadTeachers());
    } else {
      database.ref("teachers/" + uid).update(newData)
        .then(() => loadTeachers());
    }
  }
}

function deleteTeacher(uid) {
  if (confirm("Are you sure?")) {
    database.ref("teachers/" + uid).remove().then(loadTeachers);
  }
}

function loadAttendance() {
  const date = document.getElementById("dateFilter").value || new Date().toISOString().split("T")[0];
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  database.ref("attendance/" + date).once("value", snapshot => {
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
          <td>${data.punch_in || '-'}</td>
          <td>${data.punch_out || '-'}</td>`;
        tbody.appendChild(row);
      });
    });
  });
}

function loadSubstitutions() {
  const tbody = document.getElementById("substitutionTableBody");
  tbody.innerHTML = "";
  database.ref("substitutions").once("value", snap => {
    snap.forEach(child => {
      const sub = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sub.absent_teacher || '-'}</td>
        <td>${sub.class || '-'}</td>
        <td>${sub.substitute_teacher || '-'}</td>`;
      tbody.appendChild(row);
    });
  });
}

function loadSchedule() {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  database.ref("schedule").once("value", snapshot => {
    snapshot.forEach(child => {
      const entry = child.val();
      const teacherUID = entry.teacher;

      // Fetch teacher details to get name and subject
      database.ref("teachers/" + teacherUID).once("value", teacherSnap => {
        const teacher = teacherSnap.val();
        const teacherName = teacher?.name || teacherUID;
        const subject = teacher?.subject || "-";

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${teacherName}</td>
          <td>${entry.day || "-"}</td>
          <td>${entry.time || "-"}</td>
          <td>${entry.class || "-"}</td>
          <td>${subject}</td>
        `;
        tbody.appendChild(row);
      });
    });
  });
}


function populateTeacherDropdown() {
  const select = document.getElementById("teacherSelect");
  if (!select) return;

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();
      const option = document.createElement("option");
      option.value = uid;
      option.textContent = teacher.name || uid;
      select.appendChild(option);
    });
  });
}

function addSchedule() {
  const teacherUID = document.getElementById("teacherSelect").value;
  const day = document.getElementById("scheduleDay").value;
  const time = document.getElementById("scheduleTime").value;
  const className = document.getElementById("scheduleClass").value;

  if (!teacherUID || !day || !time || !className) {
    alert("Please fill in all fields");
    return;
  }

  const scheduleData = {
    teacher: teacherUID,
    day,
    time,
    class: className
  };

  database.ref("schedule").push(scheduleData).then(() => {
    alert("✅ Schedule added");
    loadSchedule();
  });
}
