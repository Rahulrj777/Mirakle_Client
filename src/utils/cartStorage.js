// utils/cartStorage.js
export const getCartFromStorage = (userId) => {
  const cart = localStorage.getItem(`cart_${userId}`);
  return cart ? JSON.parse(cart) : [];
};
