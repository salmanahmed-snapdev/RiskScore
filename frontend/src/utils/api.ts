import axios from 'axios';

const api = axios.create({
  baseURL: 'https://riskscore-backend.onrender.com/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchTruformPatient = async (id: string) => {
  const response = await api.get(`/truform/${id}`);
  return response.data;
};

export default api;