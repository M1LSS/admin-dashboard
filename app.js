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
    });
  });
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
      else if (data.status === "absent" || data.status === "late") absent++;
      if (data.substitution) substitutions++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("substitution-count").innerText = substitutions;
  });
}

window.onload = () => {
  fetchSummary();
  setInterval(fetchSummary, 30000);
  loadTeachers();
  loadAttendance();
  loadSubstitutions();
};

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
          <td></td>
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
      if (!record.status || uid.length !== 8) return;
      database.ref("teachers/" + uid + "/name").once("value", nameSnap => {
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
  const tableBody = document.getElementById("substitution-table-body");
  tableBody.innerHTML = "";
  database.ref("substitutions").once("value", snapshot => {
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
