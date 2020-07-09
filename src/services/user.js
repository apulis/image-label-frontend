import request from '@/utils/request-user';

export async function getUserInfo() {
  return await request('/auth/currentUser');
}
