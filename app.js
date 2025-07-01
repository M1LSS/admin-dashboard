// Minimal working app.js with 2-hour time range

function fetchSummary() {
  console.log("Fetching summary...");
  document.getElementById("present-count").textContent = "5";
  document.getElementById("absent-count").textContent = "2";
  document.getElementById("late-count").textContent = "1";
  showToast("✅ Summary refreshed");
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

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      buttons.forEach(b => b.classList.remove("active"));
      tabs.forEach(tab => tab.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Auto-fill end time as 2 hours after start time
  const startInput = document.getElementById("scheduleStartTime");
  const endInput = document.getElementById("scheduleEndTime");

  if (startInput && endInput) {
    startInput.addEventListener("change", () => {
      const start = startInput.value;
      if (!start) return;
      const [hour, minute] = start.split(":").map(Number);
      const endHour = (hour + 2) % 24;
      const end = `${String(endHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      endInput.value = end;
    });
  }

  fetchSummary();
});
