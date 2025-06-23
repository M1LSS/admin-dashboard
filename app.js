let attendanceChart;
  let chartInitialized = false;

  document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".tab-btn");
    const tabs = document.querySelectorAll(".tab-content");

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");

        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tabs.forEach(tab => {
          tab.classList.remove("active");
          if (tab.id === tabId) tab.classList.add("active");
        });

        if (tabId === "overview" && !chartInitialized) {
          loadDashboardSummary();
          chartInitialized = true;
        }
      });
    });

    // Force initial tab load
    document.querySelector(".tab-btn.active")?.click();
  });

  function loadDashboardSummary() {
    const today = new Date().toISOString().split("T")[0];

    db.ref("attendance/" + today).once("value", snapshot => {
      let present = 0, absent = 0, substituted = 0;

      snapshot.forEach(child => {
        const d = child.val();
        if ((d.status || '').toLowerCase() === "present") present++;
        else absent++;
        if (d.substituted_by) substituted++;
      });

      document.getElementById("presentCount").textContent = present;
      document.getElementById("absentCount").textContent = absent;
      document.getElementById("subsCount").textContent = substituted;

      const ctx = document.getElementById("attendanceChart")?.getContext("2d");
      if (ctx) {
        if (attendanceChart) {
          attendanceChart.destroy();
        }
        attendanceChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Present', 'Absent', 'Substituted'],
            datasets: [{
              label: 'Today Summary',
              data: [present, absent, substituted],
              backgroundColor: ['#2ecc71', '#e74c3c', '#f1c40f']
            }]
          }
        });
      }
    });
  }
