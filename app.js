function loadAttendance() {
  const date = document.getElementById('dateFilter').value;
  document.getElementById('refreshTime').textContent = new Date().toLocaleString();
  document.getElementById('unapprovedLeave').textContent = Math.floor(Math.random() * 100);
  document.getElementById('absences').textContent = Math.floor(Math.random() * 300);
  document.getElementById('sickLeave').textContent = Math.floor(Math.random() * 50);
  document.getElementById('casualLeave').textContent = Math.floor(Math.random() * 50);
  drawCharts();
}
function drawCharts() {
  new Chart(document.getElementById('attendanceRateChart'), {
    type: 'doughnut',
    data: {
      labels: ['Attended', 'Missed'],
      datasets: [{ data: [76.27, 23.73], backgroundColor: ['#27ae60', '#e74c3c'] }]
    }, options: { cutout: '70%', plugins: { legend: { display: false } } }
  });
  new Chart(document.getElementById('hoursWorkedChart'), {
    type: 'doughnut',
    data: {
      labels: ['Worked', 'Remaining'],
      datasets: [{ data: [6.01, 3.99], backgroundColor: ['#2980b9', '#bdc3c7'] }]
    }, options: { cutout: '70%', plugins: { legend: { display: false } } }
  });
  new Chart(document.getElementById('attendanceStatsChart'), {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [
        { label: 'Available', data: [5,6,4,6,7], backgroundColor: '#2ecc71' },
        { label: 'Absent', data: [2,1,3,2,1], backgroundColor: '#e74c3c' },
        { label: 'Leave', data: [1,1,1,0,1], backgroundColor: '#f1c40f' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } }
    }
  });
}
window.onload = loadAttendance;