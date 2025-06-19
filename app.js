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

  // === Attendance Table ===
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
});
