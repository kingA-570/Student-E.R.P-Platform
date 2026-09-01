let user = JSON.parse(localStorage.getItem('user') || '{}');
let currentPayFeeId = null;

if (!localStorage.getItem('token')) {
  window.location.href = '/';
}

api.token = localStorage.getItem('token');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(n) {
  return '\u20B9' + n.toLocaleString('en-IN');
}

function initUser() {
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('userAvatar').textContent = user.name?.charAt(0).toUpperCase();
  document.getElementById('sidebarRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const badge = document.getElementById('roleBadge');
  badge.textContent = user.role;
  badge.className = 'role-badge role-' + user.role;

  if (user.role === 'student') {
    document.getElementById('bookSessionBtn').style.display = 'inline-flex';
  }
  if (user.role === 'admin') {
    document.getElementById('addFeeBtn').style.display = 'inline-flex';
  }
  if (user.role === 'admin' || user.role === 'faculty') {
    document.getElementById('addRecordBtn').style.display = 'inline-flex';
  }
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    item.classList.add('active');
    const section = item.dataset.section;
    document.getElementById(section).classList.add('active');
    document.getElementById('pageTitle').textContent = item.textContent.trim();
    loadSection(section);
  });
});

async function loadSection(section) {
  switch (section) {
    case 'overview': await loadOverview(); break;
    case 'fees': await loadFees(); break;
    case 'scheduling': await loadSchedules(); break;
    case 'academics': await loadAcademics(); break;
  }
}

async function loadOverview() {
  try {
    const [feeSummary, schedules, academics] = await Promise.all([
      api.getFeeSummary(),
      api.getSchedules(),
      api.getAcademics()
    ]);

    const upcoming = schedules.filter(s => s.status === 'confirmed' || s.status === 'pending').length;

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card primary">
        <div class="label">Total Fees</div>
        <div class="value">${formatCurrency(feeSummary.totalAmount)}</div>
      </div>
      <div class="stat-card success">
        <div class="label">Paid</div>
        <div class="value">${formatCurrency(feeSummary.paidAmount)}</div>
      </div>
      <div class="stat-card warning">
        <div class="label">Pending Fees</div>
        <div class="value">${feeSummary.pending}</div>
      </div>
      <div class="stat-card primary">
        <div class="label">Upcoming Sessions</div>
        <div class="value">${upcoming}</div>
      </div>
    `;

    let activity = '';
    schedules.slice(0, 3).forEach(s => {
      const partnerName = user.role === 'student' ? s.faculty?.name : s.student?.name;
      activity += `<div style="padding:12px 0; border-bottom:1px solid var(--border);">
        Session with ${escapeHtml(partnerName)} — ${escapeHtml(s.subject)} (${escapeHtml(s.status)})
      </div>`;
    });
    if (academics.length) {
      activity += `<div style="padding:12px 0; border-bottom:1px solid var(--border);">
        Latest semester: ${escapeHtml(academics[0].semester)} — GPA: ${academics[0].gpa}
      </div>`;
    }
    document.getElementById('recentActivity').innerHTML = activity ||
      '<div class="empty-state"><div class="icon">&#128203;</div><p>No recent activity</p></div>';
  } catch (err) {
    console.error(err);
  }
}

async function loadFees() {
  try {
    const [fees, summary] = await Promise.all([api.getFees(), api.getFeeSummary()]);

    document.getElementById('feeStats').innerHTML = `
      <div class="stat-card warning"><div class="label">Pending</div><div class="value">${summary.pending}</div></div>
      <div class="stat-card success"><div class="label">Paid</div><div class="value">${summary.paid}</div></div>
      <div class="stat-card danger"><div class="label">Outstanding</div><div class="value">${formatCurrency(summary.pendingAmount)}</div></div>
    `;

    if (!fees.length) {
      document.getElementById('feesTable').innerHTML =
        '<div class="empty-state"><div class="icon">&#36;</div><p>No fee records found</p></div>';
      return;
    }

    let html = `<table><thead><tr>
      ${user.role !== 'student' ? '<th>Student</th>' : ''}
      <th>Semester</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody>`;

    fees.forEach(f => {
      const studentName = f.student?.name || 'N/A';
      const feeId = escapeHtml(f._id);
      const sem = escapeHtml(f.semester);
      const status = escapeHtml(f.status);
      html += `<tr>
        ${user.role !== 'student' ? `<td>${escapeHtml(studentName)}</td>` : ''}
        <td>${sem}</td>
        <td>${formatCurrency(f.amount)}</td>
        <td>${formatDate(f.dueDate)}</td>
        <td><span class="status-badge status-${status}">${status}</span></td>
        <td>${f.status === 'pending' && user.role === 'student'
          ? `<button class="btn btn-success btn-sm" onclick="openPayModal('${feeId}', '${sem}', ${f.amount})">Pay Now</button>`
          : f.transactionId ? `<small>${escapeHtml(f.transactionId)}</small>` : '\u2014'
        }</td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('feesTable').innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

function openPayModal(id, semester, amount) {
  currentPayFeeId = id;
  document.getElementById('payFeeDetails').innerHTML = `
    <p><strong>Semester:</strong> ${escapeHtml(semester)}</p>
    <p><strong>Amount:</strong> ${formatCurrency(amount)}</p>
  `;
  openModal('payModal');
}

document.getElementById('confirmPayBtn').addEventListener('click', async () => {
  try {
    const result = await api.payFee(currentPayFeeId, document.getElementById('paymentMethod').value);
    closeModal('payModal');
    alert('Payment successful! Transaction ID: ' + result.fee.transactionId);
    loadFees();
  } catch (err) {
    alert(err.message);
  }
});

async function loadSchedules() {
  try {
    const schedules = await api.getSchedules();

    if (!schedules.length) {
      document.getElementById('schedulesTable').innerHTML =
        '<div class="empty-state"><div class="icon">&#128197;</div><p>No sessions scheduled</p></div>';
      return;
    }

    let html = `<table><thead><tr>
      <th>${user.role === 'student' ? 'Faculty' : 'Student'}</th>
      <th>Subject</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody>`;

    schedules.forEach(s => {
      const partner = user.role === 'student' ? s.faculty : s.student;
      const status = escapeHtml(s.status);
      let actions = '';

      if (user.role === 'faculty' && s.status === 'pending') {
        actions = `<button class="btn btn-success btn-sm" onclick="updateStatus('${escapeHtml(s._id)}','confirmed')">Confirm</button>
          <button class="btn btn-danger btn-sm" onclick="updateStatus('${escapeHtml(s._id)}','cancelled')">Decline</button>`;
      } else if (s.status === 'confirmed') {
        actions = `<button class="btn btn-primary btn-sm" onclick="updateStatus('${escapeHtml(s._id)}','completed')">Complete</button>`;
      }
      if (s.status !== 'completed' && s.status !== 'cancelled') {
        actions += ` <button class="btn btn-outline btn-sm" onclick="cancelSchedule('${escapeHtml(s._id)}')">Cancel</button>`;
      }

      html += `<tr>
        <td>${escapeHtml(partner?.name || 'N/A')}<br><small>${escapeHtml(partner?.department || partner?.studentId || '')}</small></td>
        <td>${escapeHtml(s.subject)}</td>
        <td>${formatDate(s.date)}</td>
        <td>${escapeHtml(s.startTime)} - ${escapeHtml(s.endTime)}</td>
        <td><span class="status-badge status-${status}">${status}</span></td>
        <td>${actions || '\u2014'}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('schedulesTable').innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

async function updateStatus(id, status) {
  try {
    await api.updateScheduleStatus(id, status);
    loadSchedules();
  } catch (err) {
    alert(err.message);
  }
}

async function cancelSchedule(id) {
  if (!confirm('Cancel this session?')) return;
  try {
    await api.deleteSchedule(id);
    loadSchedules();
  } catch (err) {
    alert(err.message);
  }
}

async function loadAcademics() {
  try {
    const records = await api.getAcademics();

    if (!records.length) {
      document.getElementById('academicsContent').innerHTML =
        '<div class="empty-state"><div class="icon">&#127891;</div><p>No academic records found</p></div>';
      return;
    }

    let html = '';
    records.forEach(r => {
      html += `<div class="card" style="margin-bottom:16px;">
        <div class="card-header">
          <div>
            <h3>${escapeHtml(r.semester)}</h3>
            ${user.role !== 'student' ? `<small>${escapeHtml(r.student?.name)} (${escapeHtml(r.student?.studentId)})</small>` : ''}
          </div>
          <div><strong>GPA: ${r.gpa}</strong> | Credits: ${r.totalCredits}</div>
        </div>
        <div class="grade-grid">`;

      r.subjects.forEach(sub => {
        html += `<div class="grade-card">
          <h4>${escapeHtml(sub.name)}</h4>
          <div class="meta">${escapeHtml(sub.code)} | ${sub.credits} credits</div>
          <div style="margin-top:8px;">
            ${sub.grade ? `<span class="status-badge status-completed">${escapeHtml(sub.grade)}</span>` : '<span class="status-badge status-pending">Pending</span>'}
            ${sub.marks ? ` \u2014 ${sub.marks}/${sub.maxMarks}` : ''}
          </div>
        </div>`;
      });

      html += '</div></div>';
    });

    document.getElementById('academicsContent').innerHTML = html;
  } catch (err) {
    console.error(err);
  }
}

document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api.createSchedule({
      facultyId: document.getElementById('facultySelect').value,
      subject: document.getElementById('scheduleSubject').value,
      date: document.getElementById('scheduleDate').value,
      startTime: document.getElementById('scheduleStart').value,
      endTime: document.getElementById('scheduleEnd').value,
      notes: document.getElementById('scheduleNotes').value
    });
    closeModal('scheduleModal');
    document.getElementById('scheduleForm').reset();
    loadSchedules();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('feeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api.createFee({
      studentId: document.getElementById('feeStudent').value,
      semester: document.getElementById('feeSemester').value,
      amount: Number(document.getElementById('feeAmount').value),
      dueDate: document.getElementById('feeDueDate').value
    });
    closeModal('feeModal');
    document.getElementById('feeForm').reset();
    loadFees();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('academicForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api.createAcademicRecord({
      studentId: document.getElementById('academicStudent').value,
      semester: document.getElementById('academicSemester').value,
      subjects: [{
        name: document.getElementById('subjectName').value,
        code: document.getElementById('subjectCode').value,
        credits: Number(document.getElementById('subjectCredits').value),
        grade: document.getElementById('subjectGrade').value,
        marks: Number(document.getElementById('subjectMarks').value) || 0
      }]
    });
    closeModal('academicModal');
    document.getElementById('academicForm').reset();
    loadAcademics();
  } catch (err) {
    alert(err.message);
  }
});

async function loadDropdowns() {
  try {
    const [faculty, students] = await Promise.all([
      api.getFaculty().catch(() => []),
      api.getStudents().catch(() => [])
    ]);

    const facultySelect = document.getElementById('facultySelect');
    facultySelect.innerHTML = faculty.map(f =>
      `<option value="${escapeHtml(f._id)}">${escapeHtml(f.name)} (${escapeHtml(f.department)})</option>`
    ).join('');

    const studentOptions = students.map(s =>
      `<option value="${escapeHtml(s._id)}">${escapeHtml(s.name)} (${escapeHtml(s.studentId)})</option>`
    ).join('');

    document.getElementById('feeStudent').innerHTML = studentOptions;
    document.getElementById('academicStudent').innerHTML = studentOptions;
  } catch (err) {
    console.error(err);
  }
}

initUser();
loadDropdowns();
loadOverview();
