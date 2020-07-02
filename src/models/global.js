import { getLabels } from '@/services/global';

const GlobalModel = {
  namespace: 'global',
  state: {
    collapsed: false,
    notices: [],
    Labels: {
      labels: [],
      l_projectId: '',
      l_datasetId: ''
    }
  },
  effects: {
    * getLabels({ payload }, { call, put }) {
      const res = yield call(getLabels, payload);
      const { successful, annotations } = res;
      if (successful === 'true') {
        yield put({
          type: 'updateState',
          payload: {
            Labels: {
              labels: annotations,
              l_projectId: payload.projectId,
              l_datasetId: payload.dataSetId
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
