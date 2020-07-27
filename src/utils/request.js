/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { extend } from 'umi-request';
import { notification, message } from 'antd';
import { history } from 'umi';
import { USER_LOGIN_URL } from '@/utils/const';

const prefix = '/ai_arts/api/annotations';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '查询参数错误，请检查输入。',
  401: '用户没有权限，请重新登录。',
  403: '没有权限进行该项操作，请联系系统管理员。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请联系系统管理员。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/**
 * 异常处理程序
 */

export const errorHandler = error => {
  const { response } = error;
  let _response;
  try {
    _response = await response.json();
  } catch (e) {
    notification.error({
      message: '请求错误',
      description: '请稍后再试',
    });
  }
  if (!_response) {
    return {};
  }
  const { code, msg } = _response;
  if (code !== 0 && msg) {
    message.error(msg);
  }

  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    if (status === 401) {
      const href = window.location.href;
      if (!/localhost/.test(href)) {
        const queryString = stringify({
          redirect: window.location.href,
        });
        window.location.href = `${USER_LOGIN_URL}?` + queryString;
      }
    }
    !msg && notification.error({
      message: `请求错误 ${status}: ${url}`,
      description: errorText,
    });
  }

  return response;
};
/**
 * 配置request请求时的默认参数
 */

const request = extend({
  errorHandler,
  // 默认错误处理
  credentials: 'include', // 默认请求是否带上cookie
  prefix: prefix
});

request.interceptors.request.use(async (url, options) => {
  const token = localStorage.getItem('token');
  if (token) {
    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };
    return ({
      url: url,
      options: { ...options, headers: headers },
    });
  }
})

export default request;
