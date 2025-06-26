const db = firebase.database();

// Tab navigation
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");

    if (btn.dataset.tab === "teachers") loadTeachers();
    if (btn.dataset.tab === "overview") loadOverview();
    if (btn.dataset.tab === "attendance") loadAttendance();
  });
});

// Add teacher
document.getElementById("addTeacherForm").addEventListener("submit", e => {
  e.preventDefault();
  const uid = document.getElementById("uid").value;
  const name = document.getElementById("name").value;
  const subject = document.getElementById("subject").value;
  const class_ = document.getElementById("class").value;
  const phone = document.getElementById("phone").value;

  db.ref("teachers/" + uid).set({
    name, subject, class: class_, phone
  }).then(() => {
    alert("Teacher added");
    document.getElementById("addTeacherForm").reset();
    loadTeachers();
  });
});

// Load teachers
function loadTeachers() {
  const tableBody = document.querySelector("#teachersTable tbody");
  tableBody.innerHTML = "";

  db.ref("teachers").once("value", snapshot => {
    const teachers = snapshot.val();
    if (!teachers) return;

    Object.entries(teachers).forEach(([uid, data]) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${uid}</td>
        <td>${data.name}</td>
        <td>${data.subject}</td>
        <td>${data.class}</td>
        <td>${data.phone}</td>
        <td>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// Delete teacher
function deleteTeacher(uid) {
  if (confirm("Delete this teacher?")) {
    db.ref("teachers/" + uid).remove().then(loadTeachers);
  }
}

// Overview tab
function loadOverview() {
  const today = new Date().toISOString().split("T")[0];

  db.ref("attendance/" + today).once("value", snapshot => {
    const data = snapshot.val() || {};
    let present = 0, absent = 0, subs = 0;

    Object.values(data).forEach(record => {
      if (record.status === "present" || record.status === "late") present++;
      else absent++;
    });

    // Example substitution count (mock logic)
    subs = Math.floor(absent / 2);

    document.getElementById("presentCount").textContent = present;
    document.getElementById("absentCount").textContent = absent;
    document.getElementById("subsCount").textContent = subs;
  });
}

// Attendance tab
document.getElementById("dateFilter").addEventListener("change", loadAttendance);

function loadAttendance() {
  const selectedDate = document.getElementById("dateFilter").value;
  if (!selectedDate) return;

  const attendanceTable = document.getElementById("attendanceTable");
  attendanceTable.innerHTML = "";

  db.ref(`attendance/${selectedDate}`).once("value").then(snapshot => {
    const attendanceData = snapshot.val();
    if (!attendanceData) return;

    db.ref("teachers").once("value").then(teachersSnap => {
      const teachers = teachersSnap.val();

      Object.entries(attendanceData).forEach(([uid, record]) => {
        const teacher = teachers[uid] || {};
        const name = teacher.name || uid;

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${name}</td>
          <td>${record.status || 'N/A'}</td>
          <td>${record.punch_in || '-'}</td>
          <td>${record.punch_out || '-'}</td>
        `;
        attendanceTable.appendChild(row);
      });
    });
  });
}

// Substitution logic
function assignSubstitutes() {
  const today = new Date().toISOString().split("T")[0];

  Promise.all([
    db.ref(`attendance/${today}`).once("value"),
    db.ref("teachers").once("value")
  ]).then(([attendanceSnap, teachersSnap]) => {
    const attendance = attendanceSnap.val() || {};
    const teachers = teachersSnap.val() || {};

    const present = Object.keys(attendance).filter(uid => attendance[uid].status === "present" || attendance[uid].status === "late");
    const absent = Object.keys(attendance).filter(uid => attendance[uid].status === "absent");

    const tableBody = document.getElementById("substitutionTableBody");
    tableBody.innerHTML = "";

    absent.forEach((absentUid, index) => {
      const absentTeacher = teachers[absentUid];
      const substituteUid = present[index % present.length];
      const substitute = teachers[substituteUid];

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${absentTeacher?.name || absentUid}</td>
        <td>${absentTeacher?.class || '-'}</td>
        <td>${substitute?.name || substituteUid}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}
function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = database.ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, substitutions = 0;

    snapshot.forEach(child => {
      const data = child.val();
      if (typeof data !== "object" || !data.status) return;

      if (data.status === "present") present++;
      else if (data.status === "absent") absent++;
      else if (data.status === "late") absent++;

      // if you have substitution field
      if (data.substitution) substitutions++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("substitution-count").innerText = substitutions;
  });
}
window.onload = () => {
  fetchSummary();
};


