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
        if (tab.id === tabId) {
          tab.classList.add("active");
        }
      });
    });
  });

  document.querySelector(".tab-btn.active")?.click();  // ✅ This should be inside the DOMContentLoaded

  const today = new Date();
  const formatDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const defaultDate = formatDate(today);
  const dateInput = document.getElementById("dateFilter");
  if (dateInput) {
    dateInput.value = defaultDate;
    dateInput.addEventListener("change", () => {
      loadAttendance();
      loadSubstitutions();
    });
  }

  loadDashboardSummary();
  loadAttendance();
  loadTeachers();
});
