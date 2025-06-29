// Firebase configuration (make sure firebase-config.js is correctly linked)
// Assumes firebase has already been initialized with firebase.initializeApp(firebaseConfig);

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");

      // Trigger functions based on tab
      if (tabId === "overview") fetchSummary();
      if (tabId === "teachers") loadTeachers();
      if (tabId === "attendance") loadAttendance();
      if (tabId === "substitution") loadSubstitutions();
    });
  });

  // Initial load
  fetchSummary();
  loadTeachers();
  loadAttendance();
  loadSubstitutions();
  setInterval(fetchSummary, 30000);
});

function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = firebase.database().ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, substitutions = 0;

    snapshot.forEach(child => {
      const data = child.val();
      const key = child.key;
      if (typeof data !== "object" || !data.status || key.length !== 8) return;
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
  const tableBody = document.querySelector("#teachersTable tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  firebase.database().ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();
      const row = `
        <tr>
          <td>${uid}</td>
          <td>${teacher.name || ""}</td>
          <td>${teacher.subject || ""}</td>
          <td>${teacher.class || ""}</td>
          <td>${teacher.phone || ""}</td>
          <td><button>Edit</button> <button>Delete</button></td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  });
}

function editTeacher(uid) {
  const ref = database.ref("teachers/" + uid);
  ref.once("value", snapshot => {
    const teacher = snapshot.val();
    if (!teacher) return alert("Teacher not found.");

    const name = prompt("Edit Name:", teacher.name || "") || teacher.name;
    const subject = prompt("Edit Subject:", teacher.subject || "") || teacher.subject;
    const teacherClass = prompt("Edit Class:", teacher.class || "") || teacher.class;
    const phone = prompt("Edit Phone:", teacher.phone || "") || teacher.phone;

    ref.set({
      name,
      subject,
      class: teacherClass,
      phone
    }).then(() => {
      alert("✅ Teacher info updated.");
      loadTeachers();
    }).catch(error => {
      console.error(error);
      alert("❌ Failed to update.");
    });
  });
}

function deleteTeacher(uid) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    database.ref("teachers/" + uid).remove()
      .then(() => {
        alert("🗑️ Teacher deleted.");
        loadTeachers();
      })
      .catch(error => {
        console.error(error);
        alert("❌ Failed to delete.");
      });
  }
}


function loadAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const tableBody = document.getElementById("attendanceTable");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  firebase.database().ref("attendance/" + today).once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const record = child.val();
      if (!record.status || uid.length !== 8) return;

      firebase.database().ref("teachers/" + uid + "/name").once("value", nameSnap => {
        const name = nameSnap.val() || uid;
        const row = `
          <tr>
            <td>${name}</td>
            <td>${record.status || ""}</td>
            <td>${record.punch_in || "-"}</td>
            <td>${record.punch_out || "-"}</td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });
    });
  });
}

function loadSubstitutions() {
  const tableBody = document.getElementById("substitutionTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  firebase.database().ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const assignment = child.val();
      const row = `
        <tr>
          <td>${assignment.absent_teacher || "-"}</td>
          <td>${assignment.class || "-"}</td>
          <td>${assignment.substitute_teacher || "-"}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  });
}
