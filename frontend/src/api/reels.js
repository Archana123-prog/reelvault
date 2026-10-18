import api from './axios';

export const getReels = async (params = {}) => {
  const res = await api.get('/reels', { params });
  return res.data;
};

export const getReelById = async (id) => {
  const res = await api.get(`/reels/${id}`);
  return res.data;
};

export const createReel = async (data) => {
  const res = await api.post('/reels', data);
  return res.data;
};

export const updateReel = async (id, data) => {
  const res = await api.put(`/reels/${id}`, data);
  return res.data;
};

export const deleteReel = async (id) => {
  const res = await api.delete(`/reels/${id}`);
  return res.data;
};

export const toggleFavorite = async (id) => {
  const res = await api.patch(`/reels/${id}/favorite`);
  return res.data;
};
