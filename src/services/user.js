import request from '@/utils/request';

export async function getUserInfo() {
  return await request('/api/userinfo')
}
