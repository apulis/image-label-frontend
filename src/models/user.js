import { getUserInfo } from '@/services/user';
import { setAuthority } from '@/utils/authority';

const UserModel = {
  namespace: 'user',
  state: {
    currentUser: {
      userName: 'User',
      id: undefined,
      permissionList: [],
      nickName: undefined,
      phone: '',
      email: '',
    },
  },
  effects: {
    *fetchCurrent(_, { call, put }) {
      const res = yield call(getUserInfo);
      const { code } = res;
      if (code === 0) {
        setAuthority(res.permissionList);
        yield put({
          type: 'updateState',
          payload: {
            currentUser: {
              
              userName: res.userName,
              id: res.id,
              permissionList: res.permissionList,
              nickName: res.nickName,
              phone: res.phone,
              email: res.email
            }
          }
        })
      } else {
        setAuthority([]);
        yield put({
          type: 'updateState',
          payload: {
            currentUser: {
              userName: '',
              id: '',
              permissionList: [],
              nickName: '',
              phone: '',
              email: ''
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
        ...payload,
      };
    },
  },
};
export default UserModel;
