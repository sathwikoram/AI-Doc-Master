import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  refresh:  (data) => api.post('/auth/refresh', data),
}

// ── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  me:           ()     => api.get('/users/me'),
  updateMe:     (data) => api.put('/users/me', data),
  myStats:      ()     => api.get('/users/me/stats'),
  uploadAvatar: (form) => api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ── Cases ─────────────────────────────────────────────────────────────────────
export const casesApi = {
  list:           (params) => api.get('/cases', { params }),
  get:            (id)     => api.get(`/cases/${id}`),
  create:         (data)   => api.post('/cases', data),
  update:         (id, data) => api.put(`/cases/${id}`, data),
  assign:         (caseId, advId) => api.post(`/cases/${caseId}/assign/${advId}`),
  uploadDoc:      (caseId, form) => api.post(`/cases/${caseId}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDocs:        (caseId) => api.get(`/cases/${caseId}/documents`),
  addNote:        (caseId, data) => api.post(`/cases/${caseId}/notes`, data),
  getNotes:       (caseId) => api.get(`/cases/${caseId}/notes`),
}

// ── Advocates ─────────────────────────────────────────────────────────────────
export const advocatesApi = {
  register:   (data) => api.post('/advocates/register', data),
  me:         ()     => api.get('/advocates/me'),
  updateMe:   (data) => api.put('/advocates/me', data),
  list:       (params) => api.get('/advocates', { params }),
  get:        (id)   => api.get(`/advocates/${id}`),
  verify:     (id, verified) => api.patch(`/advocates/${id}/verify`, null, { params: { verified } }),
}

// ── Hearings ──────────────────────────────────────────────────────────────────
export const hearingsApi = {
  schedule:         (data)       => api.post('/hearings', data),
  byCaseId:         (caseId)     => api.get(`/hearings/case/${caseId}`),
  upcoming:         ()           => api.get('/hearings/upcoming'),
  update:           (id, data)   => api.put(`/hearings/${id}`, data),
  replaceAdvocate:  (id, reason) => api.post(`/hearings/${id}/replace-advocate`, null, { params: { reason } }),
}

// ── Appointments ──────────────────────────────────────────────────────────────
export const appointmentsApi = {
  book:   (data)     => api.post('/appointments', data),
  list:   ()         => api.get('/appointments'),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  cancel: (id)       => api.delete(`/appointments/${id}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:      (params) => api.get('/notifications', { params }),
  markRead:  (id)     => api.post(`/notifications/${id}/read`),
  markAll:   ()       => api.post('/notifications/read-all'),
}

// ── AI ─────────────────────────────────────────────────────────────────────────
export const aiApi = {
  classify:           (data) => api.post('/ai/classify', data),
  recommendLawyers:   (data) => api.post('/ai/recommend-lawyers', data),
  legalSections:      (data) => api.post('/ai/legal-sections', data),
  judgements:         (data) => api.post('/ai/judgements', data),
  documentChecklist:  (data) => api.post('/ai/document-checklist', data),
  summarize:          (data) => api.post('/ai/summarize', data),
  riskAssessment:     (data) => api.post('/ai/risk-assessment', data),
  chat:               (data) => api.post('/ai/chat', data),
  chatHistory:        (params) => api.get('/ai/chat/history', { params }),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats:          ()      => api.get('/admin/stats'),
  users:          (params) => api.get('/admin/users', { params }),
  toggleUser:     (id)    => api.patch(`/admin/users/${id}/toggle-active`),
  pendingAdvocates: ()    => api.get('/admin/advocates/pending'),
  recentCases:    ()      => api.get('/admin/cases/recent'),
}
