document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById('attendanceChart').getContext('2d');

  db.ref("attendance").once("value", snapshot => {
    let present = 0;
    let absent = 0;

    snapshot.forEach(daySnap => {
      daySnap.forEach(recordSnap => {
        const status = recordSnap.child("status").val();
        if (status === "Present") present++;
        else absent++;
      });
    });

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Present', 'Absent'],
        datasets: [{
          label: 'Attendance',
          data: [present, absent],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true
      }
    });
  });
});