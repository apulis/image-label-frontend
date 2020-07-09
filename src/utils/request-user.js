import { extend } from 'umi-request';
import { errorHandler } from './request'
import { message } from 'antd';

import { USER_DASHBOARD_BACKEND } from '@/utils/const';




const request = extend({
  errorHandler,
  // 默认错误处理
  credentials: 'include', // 默认请求是否带上cookie
  prefix: USER_DASHBOARD_BACKEND
});

request.use(async (ctx, next) => {
  await next();
  // 兼容当前项目的返回参数格式
  if (ctx.res.success === true) {
    ctx.res.code = 0;
  }
})

request.interceptors.request.use(async (url, options) => {
  const token = localStorage.getItem('token');
  if (token) {
    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      Authorization: 'Bearer ' + token,
    };
    return {
      url: url,
      options: { ...options, headers: headers },
    };
  }
});

request.interceptors.response.use(async (response, options) => {
  return response;
});

export default request;