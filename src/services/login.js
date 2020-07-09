import userRequest from '@/utils/request-user';

export async function userLogout() {
  return await userRequest('/auth/logout')
}