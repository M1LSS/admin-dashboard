// Smart Teacher Attendance Dashboard JS

// Firebase is assumed to be initialized via firebase-config.js

// Tab switching
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
  
});

function fetchSummary() {
  const today = new Date().toISOString().split('T')[0];
  const attendanceRef = database.ref("attendance/" + today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, late = 0;

    snapshot.forEach(child => {
      const data = child.val();
      const key = child.key;
      if (typeof data !== "object" || !data.status) return;

      if (data.status === "present") present++;
      else if (data.status === "absent") absent++;
      else if (data.status === "late") late++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("late-count").innerText = late;

    showToast("Summary updated");
  });
}


function loadTeachers() {
  const tableBody = document.getElementById("teacher-table-body");
  tableBody.innerHTML = "";

  database.ref("teachers").once("value", snapshot => {
    if (!snapshot.exists()) {
      tableBody.innerHTML = `<tr><td colspan="6">No teacher data found</td></tr>`;
      return;
    }

    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();

      // Skip invalid entries (e.g. if value is not an object)
      if (typeof teacher !== "object" || !teacher.name) return;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" id="uid-${uid}" value="${uid}" disabled /></td>
        <td><input type="text" id="name-${uid}" value="${teacher.name || ""}" disabled /></td>
        <td><input type="text" id="subject-${uid}" value="${teacher.subject || ""}" disabled /></td>
        <td><input type="text" id="class-${uid}" value="${teacher.class || ""}" disabled /></td>
        <td><input type="text" id="phone-${uid}" value="${teacher.phone || ""}" disabled /></td>
        <td>
          <button onclick="toggleEdit('${uid}', this)">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  });
}


function toggleEdit(uid, button) {
  const fields = ["uid", "name", "subject", "class", "phone"].map(field =>
    document.getElementById(`${field}-${uid}`)
  );

  const isDisabled = fields[0].disabled;

  if (isDisabled) {
    fields.forEach(input => input.disabled = false);
    button.textContent = "Save";
  } else {
    const newUid = fields[0].value.trim();
    const updatedData = {
      name: fields[1].value.trim(),
      subject: fields[2].value.trim(),
      class: fields[3].value.trim(),
      phone: fields[4].value.trim()
    };

    if (newUid !== uid) {
      database.ref("teachers/" + newUid).set(updatedData)
        .then(() => database.ref("teachers/" + uid).remove())
        .then(() => loadTeachers());
    } else {
      database.ref("teachers/" + uid).update(updatedData)
        .then(() => loadTeachers());
    }
  }
}

function deleteTeacher(uid) {
  if (confirm("Are you sure you want to delete this teacher?")) {
    database.ref("teachers/" + uid).remove()
      .then(() => loadTeachers());
  }
}

function loadAttendance() {
  const dateInput = document.getElementById("dateFilter");
  const selectedDate = dateInput?.value || new Date().toISOString().split('T')[0];
  const tableBody = document.getElementById("attendanceTable");
  tableBody.innerHTML = "";

  database.ref("attendance/" + selectedDate).once("value", snapshot => {
    if (!snapshot.exists()) {
      tableBody.innerHTML = `<tr><td colspan="4">No data found for ${selectedDate}</td></tr>`;
      return;
    }

    snapshot.forEach(child => {
      const uid = child.key;
      const record = child.val();

      // Skip if not a proper record
      if (!record || typeof record !== 'object') return;

      // Get teacher name (fallback to UID if name not found)
      database.ref("teachers/" + uid + "/name").once("value", nameSnap => {
        const name = nameSnap.exists() ? nameSnap.val() : uid;

        const row = `
          <tr>
            <td>${name}</td>
            <td>${record.status || "absent"}</td>
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
  tableBody.innerHTML = "";

  database.ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const sub = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sub.absent_teacher || "-"}</td>
        <td>${sub.class || "-"}</td>
        <td>${sub.substitute_teacher || "-"}</td>
      `;
      tableBody.appendChild(row);
    });
  });
}

document.getElementById("addTeacherForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const uid = document.getElementById("newUID").value.trim().toUpperCase();
  const name = document.getElementById("newName").value.trim();
  const subject = document.getElementById("newSubject").value.trim();
  const className = document.getElementById("newClass").value.trim();
  const phone = document.getElementById("newPhone").value.trim();

  // Basic validation
  if (!uid || !name || !subject || !className || !phone) {
    alert("❗ Please fill in all fields.");
    return;
  }

  // Check if UID already exists
  database.ref("teachers/" + uid).get().then(snapshot => {
    if (snapshot.exists()) {
      alert("⚠️ A teacher with this UID already exists.");
    } else {
      database.ref("teachers/" + uid).set({
        name: name,
        subject: subject,
        class: className,
        phone: phone
      }).then(() => {
        alert("✅ Teacher added successfully.");
        document.getElementById("addTeacherForm").reset();
        loadTeachers();
      }).catch(error => {
        alert("❌ Error adding teacher: " + error.message);
      });
    }
  });
});

function showToast(message = "Summary updated") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000); // Show for 2 seconds
}
