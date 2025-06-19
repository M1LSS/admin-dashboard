document.addEventListener("DOMContentLoaded", () => {
  const teacherTable = document.getElementById("teacherTableBody");
  const addForm = document.getElementById("addTeacherForm");

  const loadTeachers = () => {
    teacherTable.innerHTML = "";
    db.ref("teachers").once("value", snapshot => {
      snapshot.forEach(child => {
        const key = child.key;
        const t = child.val();
        const row = document.createElement("tr");
        row.dataset.date = new Date().toISOString().split('T')[0];
        row.innerHTML = `
          <td>${t.uid}</td>
          <td>${t.name}</td>
          <td>${t.subject}</td>
          <td>${t.phone}</td>
          <td>${t.class}</td>
          <td><button onclick="deleteTeacher('${key}')">Delete</button></td>
        `;
        teacherTable.appendChild(row);
      });
    });
  };

  window.deleteTeacher = (key) => {
    db.ref("teachers/" + key).remove().then(loadTeachers);
  };

  addForm.onsubmit = e => {
    e.preventDefault();
    const newTeacher = {
      uid: addForm.uid.value,
      name: addForm.name.value,
      subject: addForm.subject.value,
      phone: addForm.phone.value,
      class: addForm.class.value
    };
    db.ref("teachers").push(newTeacher).then(() => {
      addForm.reset();
      loadTeachers();
    });
  };

  loadTeachers();
});