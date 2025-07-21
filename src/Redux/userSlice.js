// Redux/userSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  address: null,
  userInfo: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
  },
});

export const { setAddress, setUserInfo } = userSlice.actions;
export default userSlice.reducer;
