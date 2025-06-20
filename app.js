document.addEventListener("DOMContentLoaded", () => {
  // === Tab Switching ===
  const buttons = document.querySelectorAll(".tab-btn");
  const tabs = document.querySelectorAll(".tab-content");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      tabs.forEach(tab => {
        tab.classList.toggle("active", tab.id === tabId);
      });
    });
  });

  // Show default tab
  document.querySelector(".tab-btn.active")?.click();

  // === Attendance Chart (Dummy Data for now) ===
  const ctx = document.getElementById('attendanceChart')?.getContext('2d');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Today Summary',
          data: [0, 0, 0, 0, 0],
          backgroundColor: '#e74c3c'
        }]
      }
    });
  }

  // === Load Summary from Firebase ===
  loadTodaySummary();

  // === Add Teacher Logic ===
  const addTeacherForm = document.getElementById("addTeacherForm");
  if (addTeacherForm) {
    addTeacherForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const uid = document.getElementById("uid").value.trim();
      const name = document.getElementById("name").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const className = document.getElementById("class").value.trim();
      const phone = document.getElementById("phone").value.trim();

      if (!uid || !name || !subject || !className || !phone) {
        alert("Please fill in all fields.");
        return;
      }

      const teacherData = { uid, name, subject, class: className, phone };

      db.ref("teachers").push(teacherData)
        .then(() => {
          alert("✅ Teacher added successfully!");
          e.target.reset();
        })
        .catch((error) => {
          console.error("❌ Error storing teacher:", error);
          alert("❌ Failed to store teacher's information.");
        });
    });
  }
});

// === Load Today’s Summary from Firebase ===
function loadTodaySummary() {
  const today = new Date().toISOString().split("T")[0];
  const ref = firebase.database().ref("attendance/" + today);

  ref.once("value", snapshot => {
    let present = 0, absent = 0, substituted = 0;

    snapshot.forEach(child => {
      const data = child.val();
      if (data.status?.toLowerCase() === "present") {
        present++;
      } else {
        absent++;
      }
      if (data.substituted_by) substituted++;
    });

    document.getElementById("presentCount").textContent = present;
    document.getElementById("absentCount").textContent = absent;
    document.getElementById("subsCount").textContent = substituted;

    const chart = Chart.getChart("attendanceChart");
    if (chart) {
      chart.data.datasets[0].data = [present, absent, substituted];
      chart.update();
    }
  });
}
