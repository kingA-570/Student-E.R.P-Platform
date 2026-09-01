const API_BASE = '/api';

const api = {
  token: localStorage.getItem('token'),

  headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
  },

  async request(url, options = {}) {
    const res = await fetch(API_BASE + url, {
      ...options,
      headers: { ...this.headers(), ...options.headers }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  register(data) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },

  getMe() {
    return this.request('/auth/me');
  },

  getFaculty() {
    return this.request('/auth/faculty');
  },

  getStudents() {
    return this.request('/auth/students');
  },

  getFees() {
    return this.request('/fees');
  },

  getFeeSummary() {
    return this.request('/fees/summary');
  },

  payFee(id, paymentMethod) {
    return this.request(`/fees/${id}/pay`, { method: 'POST', body: JSON.stringify({ paymentMethod }) });
  },

  createFee(data) {
    return this.request('/fees', { method: 'POST', body: JSON.stringify(data) });
  },

  getSchedules() {
    return this.request('/schedules');
  },

  createSchedule(data) {
    return this.request('/schedules', { method: 'POST', body: JSON.stringify(data) });
  },

  updateScheduleStatus(id, status) {
    return this.request(`/schedules/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },

  deleteSchedule(id) {
    return this.request(`/schedules/${id}`, { method: 'DELETE' });
  },

  getAcademics() {
    return this.request('/academics');
  },

  createAcademicRecord(data) {
    return this.request('/academics', { method: 'POST', body: JSON.stringify(data) });
  },

  updateGrade(recordId, data) {
    return this.request(`/academics/${recordId}/grade`, { method: 'PATCH', body: JSON.stringify(data) });
  }
};
