const db = firebase.database();

function $(id) {
  return document.getElementById(id);
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
    btn.classList.add("active");
    $(btn.dataset.tab).classList.add("active");
  });
});

// Additional logic to be added for teacher management, attendance, and substitution


// === Substitution Logic ===
function assignSubstitutes() {
  const date = new Date().toISOString().split('T')[0];
  firebase.database().ref('teachers').once('value', snapshot => {
    const teachers = snapshot.val();
    if (!teachers) return;

    const present = [];
    const absent = [];

    for (const uid in teachers) {
      const teacher = teachers[uid];
      firebase.database().ref(`attendance/${date}/${uid}/status`).once('value', statusSnap => {
        const status = statusSnap.val();
        if (status === 'present') present.push({ uid, ...teacher });
        else absent.push({ uid, ...teacher });

        // Once all teachers are classified
        if (present.length + absent.length === Object.keys(teachers).length) {
          const table = document.getElementById("substitutionTableBody");
          table.innerHTML = "";

          absent.forEach((absentTeacher, i) => {
            const substitute = present[i % present.length];
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${absentTeacher.name}</td>
              <td>${absentTeacher.class}</td>
              <td>${substitute.name}</td>
            `;
            table.appendChild(row);
          });

          document.getElementById("subsCount").innerText = absent.length;
        }
      });
    }
  });
}
