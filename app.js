document.addEventListener("DOMContentLoaded", () => {
  loadTeachers();
});

function loadTeachers() {
  const table = document.getElementById("teachersTable").querySelector("tbody");
  table.innerHTML = "";

  db.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const data = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${child.key}</td>
        <td>${data.name}</td>
        <td>${data.subject}</td>
        <td>${data.class}</td>
        <td>${data.phone}</td>
        <td>
          <button onclick="openEditModal('${child.key}', '${data.name}', '${data.subject}', '${data.class}', '${data.phone}')">Edit</button>
          <button onclick="confirmDelete('${child.key}')">Delete</button>
        </td>
      `;
      table.appendChild(row);
    });
  });
}

function openEditModal(uid, name, subject, className, phone) {
  document.getElementById("editUid").value = uid;
  document.getElementById("editName").value = name;
  document.getElementById("editSubject").value = subject;
  document.getElementById("editClass").value = className;
  document.getElementById("editPhone").value = phone;
  document.getElementById("editModal").style.display = "block";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

document.getElementById("editForm").addEventListener("submit", e => {
  e.preventDefault();
  const uid = document.getElementById("editUid").value;
  const name = document.getElementById("editName").value;
  const subject = document.getElementById("editSubject").value;
  const className = document.getElementById("editClass").value;
  const phone = document.getElementById("editPhone").value;

  db.ref("teachers/" + uid).update({
    name,
    subject,
    class: className,
    phone
  }).then(() => {
    alert("✅ Teacher info updated.");
    closeEditModal();
    loadTeachers();
  });
});

function confirmDelete(uid) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    db.ref("teachers/" + uid).remove().then(() => {
      alert("🗑️ Teacher deleted.");
      loadTeachers();
    });
  }
}
