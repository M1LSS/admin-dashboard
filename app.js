function loadAttendance() {
  const tbody = document.getElementById("attendanceTable");
  tbody.innerHTML = "<tr><td>2291FE22</td><td>Present</td><td>08:01</td><td>13:32</td></tr>";
}
window.onload = function () {
  const ctx = document.getElementById('attendanceChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{ label: 'Attendance', data: [10, 9, 8, 9, 7], backgroundColor: '#3498db' }]
    }
  });
};
