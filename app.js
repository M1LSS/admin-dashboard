// app.js

const db = firebase.database();

// TAB NAVIGATION
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// FETCH TEACHERS
function fetchTeachers() {
  const tbody = document.querySelector("#teachersTable tbody");
  tbody.innerHTML = "";

  db.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const t = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${child.key}</td>
        <td>${t.name}</td>
        <td>${t.subject}</td>
        <td>${t.class}</td>
        <td>${t.phone}</td>
        <td>
          <button onclick="editTeacher('${child.key}')">Edit</button>
          <button onclick="deleteTeacher('${child.key}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

// ADD TEACHER
const addTeacherForm = document.getElementById("addTeacherForm");
addTeacherForm.addEventListener("submit", e => {
  e.preventDefault();
  const uid = addTeacherForm.uid.value;
  const name = addTeacherForm.name.value;
  const subject = addTeacherForm.subject.value;
  const tclass = addTeacherForm.class.value;
  const phone = addTeacherForm.phone.value;

  db.ref("teachers/" + uid).set({ name, subject, class: tclass, phone }, () => {
    addTeacherForm.reset();
    fetchTeachers();
  });
});

// DELETE TEACHER
function deleteTeacher(uid) {
  if (confirm("Delete this teacher?")) {
    db.ref("teachers/" + uid).remove(fetchTeachers);
  }
}

// FETCH ATTENDANCE
function fetchAttendance(date = new Date().toISOString().split("T")[0]) {
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  db.ref("attendance/" + date).once("value", snapshot => {
    snapshot.forEach(child => {
      const record = child.val();
      db.ref("teachers/" + child.key + "/name").once("value", snap => {
        const name = snap.val() || child.key;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${name}</td>
          <td>${record.status || "-"}</td>
          <td>${record.punch_in || "-"}</td>
          <td>${record.punch_out || "-"}</td>
        `;
        tbody.appendChild(row);
      });
    });
  });
}

document.getElementById("dateFilter").addEventListener("change", e => {
  fetchAttendance(e.target.value);
});

// INITIAL LOAD
window.onload = () => {
  fetchTeachers();
  fetchAttendance();
};
