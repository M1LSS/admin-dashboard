// Fetch today's summary data
function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = database.ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, substitutions = 0;

    snapshot.forEach(child => {
      const data = child.val();
      const key = child.key;

      // Skip if it's not an attendance record
      if (typeof data !== "object" || !data.status || key.length !== 8) return;

      if (data.status === "present") present++;
      else if (data.status === "absent" || data.status === "late") absent++;

      // Optional: check if substitution assigned
      if (data.substitution) substitutions++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("substitution-count").innerText = substitutions;
  });
}

// Run on page load
window.onload = () => {
  const currentPage = window.location.pathname;

  if (currentPage.includes("overview.html")) {
    fetchSummary();
  }

  if (currentPage.includes("teachers.html")) {
    loadTeachers();
  }

  if (currentPage.includes("attendance.html")) {
    loadAttendance();
  }

  if (currentPage.includes("substitution.html")) {
    loadSubstitutions();
  }
};

// --- Add any other functions for Teachers, Attendance, Substitution below ---

function loadTeachers() {
  const tableBody = document.getElementById("teacher-table-body");
  tableBody.innerHTML = "";

  database.ref("teachers").once("value", snapshot => {
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
          <td>
            <!-- Action buttons can go here -->
          </td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  });
}

function loadAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const tableBody = document.getElementById("attendance-table-body");
  tableBody.innerHTML = "";

  database.ref("attendance/" + today).once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const record = child.val();

      if (!record.status) return;

      database.ref("teachers/" + uid + "/name").once("value", nameSnap => {
        const name = nameSnap.val() || uid;

        const row = `
          <tr>
            <td>${uid}</td>
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
  const tableBody = document.getElementById("substitution-table-body");
  tableBody.innerHTML = "";

  // You can replace this logic with actual substitution assignments from Firebase
  database.ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const assignment = child.val();
      const row = `
        <tr>
          <td>${assignment.absent_teacher || "-"}</td>
          <td>${assignment.substitute_teacher || "-"}</td>
          <td>${assignment.class || "-"}</td>
          <td>${assignment.time || "-"}</td>
        </tr>
      `;
      tableBody.innerHTML += row;
    });
  });
}
