const db = firebase.database();
const teacherTableBody = document.querySelector("#teachersTable tbody");
const attendanceTableBody = document.querySelector("#attendanceTable");
const dateFilter = document.getElementById("dateFilter");

function loadTeachers() {
  db.ref("teachers").once("value", snapshot => {
    teacherTableBody.innerHTML = "";
    const data = snapshot.val();

    if (data) {
      Object.keys(data).forEach(uid => {
        const teacher = data[uid];
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${uid}</td>
          <td>${teacher.name || ""}</td>
          <td>${teacher.subject || ""}</td>
          <td>${teacher.class || ""}</td>
          <td>${teacher.phone || ""}</td>
          <td>
            <button onclick="editTeacher('${uid}')">Edit</button>
            <button onclick="deleteTeacher('${uid}')">Delete</button>
          </td>
        `;
        teacherTableBody.appendChild(row);
      });
    } else {
      teacherTableBody.innerHTML = "<tr><td colspan='6'>No teachers found.</td></tr>";
    }
  });
}

function addTeacher(event) {
  event.preventDefault();

  const uid = document.getElementById("uid").value.trim();
  const name = document.getElementById("name").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const teacherClass = document.getElementById("class").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (uid && name && subject && teacherClass && phone) {
    db.ref("teachers/" + uid).set({
      name,
      subject,
      class: teacherClass,
      phone
    }, (error) => {
      if (!error) {
        alert("Teacher added!");
        loadTeachers();
        document.getElementById("addTeacherForm").reset();
      } else {
        alert("Error adding teacher.");
      }
    });
  }
}

function deleteTeacher(uid) {
  if (confirm("Are you sure to delete teacher " + uid + "?")) {
    db.ref("teachers/" + uid).remove()
      .then(() => loadTeachers());
  }
}

function loadAttendance(dateStr) {
  attendanceTableBody.innerHTML = "<tr><td colspan='4'>Loading...</td></tr>";

  db.ref("attendance/" + dateStr).once("value", snapshot => {
    attendanceTableBody.innerHTML = "";
    const data = snapshot.val();

    if (data) {
      Object.keys(data).forEach(uid => {
        db.ref("teachers/" + uid).once("value", teacherSnap => {
          const teacher = teacherSnap.val();
          const record = data[uid];

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${teacher ? teacher.name : uid}</td>
            <td>${record.status || "--"}</td>
            <td>${record.punch_in || "--"}</td>
            <td>${record.punch_out || "--"}</td>
          `;
          attendanceTableBody.appendChild(row);
        });
      });
    } else {
      attendanceTableBody.innerHTML = "<tr><td colspan='4'>No attendance data found.</td></tr>";
    }
  });
}

document.getElementById("addTeacherForm").addEventListener("submit", addTeacher);
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

dateFilter.addEventListener("change", () => {
  if (dateFilter.value) {
    loadAttendance(dateFilter.value);
  }
});

loadTeachers();
const today = new Date().toISOString().split("T")[0];
dateFilter.value = today;
loadAttendance(today);
