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

  // === Attendance Table (Demo Data) ===
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "<tr><td>2291FE22</td><td>Present</td><td>08:01</td><td>13:32</td></tr>";

  // === Chart Initialization ===
  const ctx = document.getElementById('attendanceChart')?.getContext('2d');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
          label: 'Attendance',
          data: [10, 9, 8, 9, 7],
          backgroundColor: '#3498db'
        }]
      }
    });
  }

  // === Add Teacher Logic with Popup ===
  const form = document.getElementById("addTeacherForm");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();

      const uid = document.getElementById("uid").value.trim();
      const name = document.getElementById("name").value.trim();
      const subject = document.getElementById("subject").value.trim();
      const className = document.getElementById("class").value.trim();
      const phone = document.getElementById("phone").value.trim();

      if (!uid || !name || !subject || !className || !phone) {
        showPopup("⚠️ Please fill in all fields.", "error");
        return;
      }

      const teacherData = { name, subject, class: className, phone };

      db.ref("teachers/" + uid).set(teacherData)
        .then(() => {
          showPopup("✅ Teacher added successfully!", "success");
          form.reset();
        })
        .catch((error) => {
          console.error("❌ Error:", error);
          showPopup("❌ Failed to store teacher's information.", "error");
        });
    });
  }
});

// === Popup Function ===
function showPopup(message, type) {
  const popup = document.createElement("div");
  popup.className = `popup ${type}`;
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => popup.remove(), 3000);
}
