const db = firebase.database();
const teacherTableBody = document.querySelector("#teachersTable tbody");

function loadTeachers() {
  db.ref("teachers").once("value", snapshot => {
    teacherTableBody.innerHTML = ""; // Clear existing rows
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

document.getElementById("addTeacherForm").addEventListener("submit", addTeacher);

// Tabs
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

loadTeachers(); // Initial call
