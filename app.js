// Load teachers from Firebase
function loadTeachers() {
  const tbody = document.querySelector('#teachersTable tbody');
  tbody.innerHTML = '';

  const teachersRef = firebase.database().ref("teachers");
  teachersRef.once("value", (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const uid = childSnapshot.key;
      const teacher = childSnapshot.val();

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${uid}</td>
        <td>${teacher.name || '-'}</td>
        <td>${teacher.subject || '-'}</td>
        <td>${teacher.class || '-'}</td>
        <td>${teacher.phone || '-'}</td>
        <td>
          <button onclick="editTeacher('${uid}')">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>
      `;

      tbody.appendChild(row);
    });
  });
}

// Handle tab switching and call loadTeachers when "Teachers" tab is opened
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = document.getElementById(btn.dataset.tab);
    if (tab) tab.classList.add("active");

    if (btn.dataset.tab === "teachers") {
      loadTeachers();
    }
  });
});

// Handle adding a new teacher
document.getElementById("addTeacherForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const uid = document.getElementById("uid").value.trim();
  const name = document.getElementById("name").value.trim();
  const subject = document.getElementById("subject").value.trim();
  const cls = document.getElementById("class").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!uid || !name) return;

  firebase.database().ref("teachers/" + uid).set({
    name: name,
    subject: subject,
    class: cls,
    phone: phone
  }).then(() => {
    loadTeachers();
    document.getElementById("addTeacherForm").reset();
  });
});

// Optional: placeholder functions for edit/delete
function editTeacher(uid) {
  alert("Edit function not implemented for UID: " + uid);
}

function deleteTeacher(uid) {
  if (confirm("Delete teacher with UID: " + uid + "?")) {
    firebase.database().ref("teachers/" + uid).remove().then(() => {
      loadTeachers();
    });
  }
}
