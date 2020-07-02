import request from '@/utils/request';

export async function getLabels(payload) {
  const { projectId, dataSetId } = payload;
  return await request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks/labels`);
}
