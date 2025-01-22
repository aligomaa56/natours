import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: { email, password },
      withCredentials: true
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response?.data?.message || 'Login failed');
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/logout',
      withCredentials: true
    });

    if (res.data.status === 'success') {
      location.reload(true);
      // Redirect to home with cache busting
      window.location.href = '/'; 
    }
  } catch (err) {
    showAlert('error', 'Logout failed. Please try again.');
  }
};
