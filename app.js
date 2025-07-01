// Smart Teacher Attendance Dashboard JS

// Firebase is assumed to be initialized via firebase-config.js

function fetchSummary() {
  const today = new Date().toLocaleDateString("en-CA"); // local time e.g. 2025-07-02
  const attendanceRef = database.ref("attendance/" + today);

  console.log("📅 Reading attendance for:", today);

  attendanceRef.once("value", snapshot => {
    let present = 0, absent = 0, late = 0;

    snapshot.forEach(child => {
      const data = child.val();
      const status = data.status;
      console.log("🔍", child.key, "→", status);

      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "late") late++;
    });

    document.getElementById("present-count").innerText = present;
    document.getElementById("absent-count").innerText = absent;
    document.getElementById("late-count").innerText = late;

    showToast("📊 Summary updated.");
  });
}

function showToast(message = "Summary updated") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

window.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  fetchSummary();
  setInterval(fetchSummary, 30000);

  loadTeachers();
  loadAttendance();
  loadSubstitutions();
  loadSchedule();
  populateTeacherDropdown();

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  document.getElementById("addTeacherForm").addEventListener("submit", e => {
    e.preventDefault();
    const uid = document.getElementById("newUID").value.trim();
    const name = document.getElementById("newName").value.trim();
    const subject = document.getElementById("newSubject").value.trim();
    const role = document.getElementById("newRole").value.trim();

    if (!uid || !name || !subject || !role) {
      alert("Please fill in all fields.");
      return;
    }

    const data = { name, subject, role };

    database.ref("teachers/" + uid).set(data).then(() => {
      alert("✅ Teacher added!");
      e.target.reset();
      loadTeachers();
    });
  });

  document.getElementById("addScheduleForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const teacherUID = document.getElementById("scheduleTeacherSelect").value;
    const teacherName = document.getElementById("scheduleTeacherSelect").selectedOptions[0].textContent;
    const day = document.getElementById("scheduleDay").value;
    const time = document.getElementById("scheduleTime").value;
    const className = document.getElementById("scheduleClass").value;
    const subject = document.getElementById("scheduleSubject").value;

    if (!teacherUID || !day || !time || !className || !subject) {
      alert("⚠️ Please fill out all fields.");
      return;
    }

    const scheduleData = { teacher: teacherName, teacherUID, day, time, class: className, subject };

    database.ref("schedule").push(scheduleData).then(() => {
      alert("✅ Schedule added!");
      e.target.reset();
      loadSchedule();
    });
  });

  document.getElementById("scheduleTeacherSelect").addEventListener("change", function () {
    const selectedUID = this.value;
    database.ref("teachers/" + selectedUID).once("value", snapshot => {
      const teacher = snapshot.val();
      if (teacher?.subject) {
        document.getElementById("scheduleSubject").value = teacher.subject;
      }
    });
  });
});

function loadTeachers() {
  const tableBody = document.getElementById("teacher-table-body");
  tableBody.innerHTML = "";

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" id="uid-${uid}" value="${uid}" disabled></td>
        <td><input type="text" id="name-${uid}" value="${teacher.name || ""}" disabled></td>
        <td><input type="text" id="subject-${uid}" value="${teacher.subject || ""}" disabled></td>
        <td><input type="text" id="role-${uid}" value="${teacher.role || ""}" disabled></td>
        <td>
          <button onclick="toggleEdit('${uid}', this)">Edit</button>
          <button onclick="deleteTeacher('${uid}')">Delete</button>
        </td>`;
      tableBody.appendChild(row);
    });
  });
}

function toggleEdit(uid, button) {
  const inputs = ["uid", "name", "subject", "role"].map(id => document.getElementById(`${id}-${uid}`));
  const isDisabled = inputs[0].disabled;

  if (isDisabled) {
    inputs.forEach(input => input.disabled = false);
    button.textContent = "Save";
  } else {
    const [uidInput, nameInput, subjectInput, roleInput] = inputs;
    const newUid = uidInput.value.trim();
    const updatedData = {
      name: nameInput.value.trim(),
      subject: subjectInput.value.trim(),
      role: roleInput.value.trim()
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
  if (confirm("Are you sure to delete this teacher?")) {
    database.ref("teachers/" + uid).remove().then(loadTeachers);
  }
}

function renderTimetable() {
   const selectedDay = document.getElementById("timetableDaySelect").value;
  const timetableHead = document.getElementById("timetableHead");
  const timetableBody = document.getElementById("timetableBody");
  
  database.ref("schedule").once("value", snapshot => {
    const scheduleList = [];

    snapshot.forEach(child => {
      const data = child.val();
      if (data.day === selectedDay) {
        scheduleList.push(data);
      }
    });

    const classes = [...new Set(scheduleList.map(item => item.class))].sort();
    const times = [...new Set(scheduleList.map(item => item.time))].sort();

    // Build table header
    timetableHead.innerHTML = "";
    const headerRow = document.createElement("tr");
    headerRow.innerHTML = `<th>Time</th>` + classes.map(cls => `<th>${cls}</th>`).join("");
    timetableHead.appendChild(headerRow);

    // Build table body
    timetableBody.innerHTML = "";
    times.forEach(time => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${time}</td>`;

      classes.forEach(cls => {
        const match = scheduleList.find(item => item.time === time && item.class === cls);
        row.innerHTML += `<td>${match ? match.teacher + "<br><small>(" + match.subject + ")</small>" : ""}</td>`;
      });

      timetableBody.appendChild(row);
    });
  });
}


function loadAttendance() {
  const dateInput = document.getElementById("dateFilter");
  const date = dateInput?.value || new Date().toISOString().split("T")[0];
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "";

  database.ref("attendance/" + date).once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const record = child.val();
      if (!record.status) return;

      database.ref("teachers/" + uid + "/name").once("value", nameSnap => {
        const name = nameSnap.val() || uid;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${name}</td>
          <td>${record.status}</td>
          <td>${record.punch_in || "-"}</td>
          <td>${record.punch_out || "-"}</td>`;
        tbody.appendChild(row);
      });
    });
  });
}

function loadSubstitutions() {
  const tbody = document.getElementById("substitutionTableBody");
  tbody.innerHTML = "";

  database.ref("substitutions").once("value", snapshot => {
    snapshot.forEach(child => {
      const sub = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sub.absent_teacher || "-"}</td>
        <td>${sub.class || "-"}</td>
        <td>${sub.substitute_teacher || "-"}</td>`;
      tbody.appendChild(row);
    });
  });
}

function loadSchedule() {
  const tbody = document.getElementById("scheduleTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  database.ref("schedule").once("value", snapshot => {
    snapshot.forEach(child => {
      const entry = child.val();
      const key = child.key;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="text" id="teacher-${key}" value="${entry.teacher || "-"}" disabled></td>
        <td><input type="text" id="day-${key}" value="${entry.day || "-"}" disabled></td>
        <td><input type="text" id="time-${key}" value="${entry.time || "-"}" disabled></td>
        <td><input type="text" id="class-${key}" value="${entry.class || "-"}" disabled></td>
        <td><input type="text" id="subject-${key}" value="${entry.subject || "-"}" disabled></td>
        <td>
          <button onclick="toggleEditSchedule('${key}', this)">Edit</button>
          <button onclick="deleteSchedule('${key}')">Delete</button>
        </td>`;
      tbody.appendChild(row);
    });
  });
}

function populateTeacherDropdown() {
  const teacherSelect = document.getElementById("scheduleTeacherSelect");
  teacherSelect.innerHTML = `<option disabled selected value="">Select Teacher</option>`;

  database.ref("teachers").once("value", snapshot => {
    snapshot.forEach(child => {
      const uid = child.key;
      const teacher = child.val();
      const option = document.createElement("option");
      option.value = uid;
      option.textContent = teacher.name || uid;
      teacherSelect.appendChild(option);
    });
  });
}

function toggleEditSchedule(key, button) {
  const fields = ["teacher", "day", "time", "class", "subject"].map(id => document.getElementById(`${id}-${key}`));
  const isDisabled = fields[0].disabled;

  if (isDisabled) {
    fields.forEach(f => f.disabled = false);
    button.textContent = "Save";
  } else {
    const [teacherInput, dayInput, timeInput, classInput, subjectInput] = fields;
    const updated = {
      teacher: teacherInput.value.trim(),
      day: dayInput.value.trim(),
      time: timeInput.value.trim(),
      class: classInput.value.trim(),
      subject: subjectInput.value.trim()
    };
    database.ref("schedule/" + key).update(updated).then(loadSchedule);
  }
}

function deleteSchedule(key) {
  if (confirm("Delete this schedule?")) {
    database.ref("schedule/" + key).remove().then(loadSchedule);
  }
}

// Smart Teacher Attendance Dashboard - Auto Substitution Logic (Patched)

function generateSubstitutions() {
  const today = new Date().toISOString().split("T")[0];
  const attendanceRef = database.ref("attendance/" + today);
  const scheduleRef = database.ref("schedule");
  const teacherRef = database.ref("teachers");

  Promise.all([
    attendanceRef.once("value"),
    scheduleRef.once("value"),
    teacherRef.once("value")
  ]).then(([attSnap, schedSnap, teacherSnap]) => {
    const absentTeachers = {};
    attSnap.forEach(child => {
      const status = child.val().status;
      if (status === "absent" || status === "late") {
        absentTeachers[child.key] = status;
      }
    });

    const teacherList = {};
    teacherSnap.forEach(child => {
      teacherList[child.key] = { ...child.val(), uid: child.key };
    });

    const schedule = [];
    const busyTeachers = new Set();

    schedSnap.forEach(child => {
      const entry = child.val();
      const key = child.key;
      schedule.push({ ...entry, key });

      const uid = entry.teacherUID;
      if (entry.day === "Monday") {
        busyTeachers.add(uid + "-" + entry.time);
      }
    });

    const substitutions = [];
    const alreadyAssigned = new Set();

    const todaysSchedule = schedule.filter(e => absentTeachers[e.teacherUID] && e.day === "Monday");

    todaysSchedule.forEach(entry => {
      const { teacherUID, day, time, class: cls, subject } = entry;
      console.log("\n🔍 Looking for sub for", teacherList[teacherUID].name, "Class", cls, "Subject", subject);

      let substitute = null;

      // 1. Same subject + regular
      const candidates = Object.values(teacherList);
      for (const t of candidates) {
        const slotKey = `${t.uid}-${day}-${time}`;
        const isBusy = busyTeachers.has(slotKey);
        const isUsed = alreadyAssigned.has(slotKey);
        const subjectMatch = t.subject === subject;
        const isValid = !isBusy && !isUsed && t.role === "regular" && subjectMatch && t.uid !== teacherUID;

        console.log(`🔄 Check (same subject) ${t.name} (${t.uid}) → busy: ${isBusy}, used: ${isUsed}, subjectMatch: ${subjectMatch}, role: ${t.role}`);

        if (isValid) {
          console.log(`✅ Assigned (same subject): ${t.name}`);
          substitute = t;
          break;
        } else {
          console.log(`❌ Not assigning ${t.name} → Conditions:`, {
            isBusy,
            isUsed,
            role: t.role,
            subject: t.subject,
            expectedSubject: subject,
            uid: t.uid
          });
        }
      }

      // 2. Any available regular
      if (!substitute) {
        for (const t of candidates) {
          const slotKey = `${t.uid}-${day}-${time}`;
          const isBusy = busyTeachers.has(slotKey);
          const isUsed = alreadyAssigned.has(slotKey);
          const isValid = !isBusy && !isUsed && t.role === "regular" && t.uid !== teacherUID;

          if (isValid) {
            console.log(`✅ Assigned (any regular): ${t.name}`);
            substitute = t;
            break;
          }
        }
      }

      // 3. Wildcard fallback
      if (!substitute) {
        for (const t of candidates) {
          const slotKey = `${t.uid}-${day}-${time}`;
          const isBusy = busyTeachers.has(slotKey);
          const isUsed = alreadyAssigned.has(slotKey);
          const isValid = !isBusy && !isUsed && t.role === "wildcard" && t.uid !== teacherUID;

          if (isValid) {
            console.log(`✅ Assigned (wildcard): ${t.name}`);
            substitute = t;
            break;
          }
        }
      }

      const subName = substitute ? substitute.name : "❌ No Available Sub";

      if (substitute) {
        const slotKey = `${substitute.uid}-${day}-${time}`;
        alreadyAssigned.add(slotKey);
      }

      substitutions.push({
        absent_teacher: teacherList[teacherUID].name,
        class: cls,
        substitute_teacher: subName
      });
    });

    console.log("\n📦 Final Substitutions:", substitutions);

    // Store to Firebase
    const updates = {};
    substitutions.forEach((s, i) => {
      updates[`substitutions/${i}`] = s;
    });

    database.ref().update(updates).then(() => {
      alert("✅ Substitutions generated!");
      loadSubstitutions();
    });
  });
}
