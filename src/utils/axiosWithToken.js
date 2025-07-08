// src/utils/axiosWithToken.js
import axios from 'axios';
import { API_BASE } from './api';

export const axiosWithToken = () => {
  const token = JSON.parse(localStorage.getItem("mirakleUser"))?.token;

  return axios.create({
    baseURL: `${API_BASE}/api`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
};
