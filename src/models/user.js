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
      onlyImageLabel: false
    },
  },
  effects: {
    *fetchCurrent(_, { call, put }) {
      const res = yield call(getUserInfo);
      const { code } = res;
      if (code === 0) {
        const { permissionList, userName, id, nickName, phone, email } = res;
        setAuthority(permissionList);
        yield put({
          type: 'updateState',
          payload: {
            currentUser: {
              userName: userName,
              id: id,
              permissionList: permissionList,
              nickName: nickName,
              phone: phone,
              email: email,
              onlyImageLabel: !permissionList.includes('AI_ARTS_ALL') && permissionList.includes('LABELING_IMAGE')
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
              email: '',
              onlyImageLabel: false
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
