import { getUserInfo } from '@/services/user';

const UserModel = {
  namespace: 'user',
  state: {
    currentUser: {},
  },
  effects: {
    *fetchCurrent(_, { call, put }) {
      const res = yield call(getUserInfo);
      const { userInfo, successful } = res;
      if (successful === 'true') {
        const { role, isAdmin } = userInfo;
        let userLevel = isAdmin ? 3 : 1;
        localStorage.userLevel = userLevel;
        yield put({
          type: 'updateState',
          payload: {
            currentUser: {
              ...userInfo,
              userLevel
            }
          }
        })
      }
    },
  },
  reducers: {
    updateState(state, { payload }) {
      return {
        ...state,
        ...payload
      }
    }
  },
};
export default UserModel;
