import { getLabels } from '@/services/global';

const GlobalModel = {
  namespace: 'global',
  state: {
    collapsed: false,
    notices: [],
    Labels: {
      labels: []
    }
  },
  effects: {
    * getLabels({ payload }, { call, put }) {
      const res = yield call(getLabels, payload);
      const { code, data } = res;
      if (code === 0) {
        yield put({
          type: 'updateState',
          payload: {
            Labels: {
              labels: data.annotations
            }
          }
        })
      }
      return res;
    }
  },
  reducers: {
    changeLayoutCollapsed(
      state = {
        notices: [],
        collapsed: true,
      },
      { payload },
    ) {
      return { ...state, collapsed: payload };
    },

    updateState(state, { payload }) {
      return {
        ...state,
        ...payload
      }
    }
  },
  subscriptions: {
  },
};
export default GlobalModel;
