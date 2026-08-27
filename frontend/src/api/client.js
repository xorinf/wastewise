import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('wastewise.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const auth = {
  signup: body => api.post('/auth/signup', body).then(r => r.data),
  login:  body => api.post('/auth/login', body).then(r => r.data),
  me:     ()   => api.get('/auth/me').then(r => r.data),
  linkCampus: body => api.post('/auth/link-campus', body).then(r => r.data),
};

export const items = {
  quickSelect: ()       => api.get('/items/quick-select').then(r => r.data),
  identify:    formData => api.post('/items/identify', formData).then(r => r.data),
  log:         body     => api.post('/items/log', body).then(r => r.data),
  history:     ()       => api.get('/items/history').then(r => r.data),
  stats:       ()       => api.get('/items/stats').then(r => r.data),
};

export const requests = {
  create:  body => api.post('/requests', body).then(r => r.data),
  list:    ()   => api.get('/requests').then(r => r.data),
  get:     id   => api.get(`/requests/${id}`).then(r => r.data),
  setStatus:(id, status) => api.patch(`/requests/${id}/status`, { status }).then(r => r.data),
};

export const campuses = {
  list:  ()   => api.get('/campuses').then(r => r.data),
  get:   id   => api.get(`/campuses/${id}`).then(r => r.data),
  create: body => api.post('/campuses', body).then(r => r.data),
  addBin: (id, body) => api.post(`/campuses/${id}/bins`, body).then(r => r.data),
  mapZoneStaff: (id, body) => api.post(`/campuses/${id}/zone-staff`, body).then(r => r.data),
};

export const staff = {
  dashboard:     ()              => api.get('/staff').then(r => r.data),
  crossCampus:   ()              => api.get('/staff/cross-campus').then(r => r.data),
  forCampus:     campusId        => api.get('/staff', { params: { campusId } }).then(r => r.data),
};
