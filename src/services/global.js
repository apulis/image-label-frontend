import request from '@/utils/request';

export async function getLabels(payload) {
  const { projectId, dataSetId } = payload;
  return await request(`/projects/${projectId}/datasets/${dataSetId}/tasks/labels`);
}
