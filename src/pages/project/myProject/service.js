import request from '@/utils/request';
import request2 from '@/utils/request-ai';

export async function getProject(params) {
  return request('/projects', {
    params: params
  })
}

export async function deleteProject(projectId) {
  return request(`/projects/${projectId}`, {
    method: 'DELETE'
  })
}

export async function submitProject(data) {
  return await request('/projects', {
    method: 'POST',
    data: data
  });
}

export async function editProject(projectId, data) {
  return await request(`/projects/${projectId}`, {
    method: 'PATCH',
    data: data
  });
}

export async function getDataSet(projectId, params) {
  return request(`/projects/${projectId}/datasets`, {
    params: params
  })
}

export async function getTasks(projectId, dataSetId, params) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks`, {
    params: params
  })
}

export async function getMap(projectId, dataSetId, params) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks/map`, {
    params: params
  })
}

export async function getDataSetDetail(projectId, dataSetId) {
  return request(`/projects/${projectId}/datasets/${dataSetId}`)
}

export async function addDataSet(projectId, data) {
  return request(`/projects/${projectId}/datasets`, {
    method: 'POST',
    data: data
  })
}

export async function deleteDataSet(projectId, dataSetId) {
  return request(`/projects/${projectId}/datasets`, {
    method: 'DELETE',
    data: JSON.stringify(dataSetId)
  })
}

export async function submitDataSet(projectId, dataSetId, data) {
  return request(`/projects/${projectId}/datasets/${dataSetId}`, {
    method: 'PATCH',
    data: data
  })
}

export async function submitTask(projectId, dataSetId, taskId, data) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks/annotations/${taskId}`, {
    method: 'POST',
    data: data
  })
}

export async function getUpDownData(projectId, dataSetId, taskId, type) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks/${type ? 'next' : 'previous'}/${taskId}`)
}

export async function getAnnotations(projectId, dataSetId, taskId) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks/annotations/${taskId}`)
}

export function submitDetail(projectId, dataSetId, taskId, data) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks/annotations/${taskId}`, {
    method: 'POST',
    data: data
  })
}

export async function getDatasetsOptions(params) {
  return request2('/datasets', {
    params: { ...params },
  });
}

export async function convertDataset(data) {
  const { projectId, dataSetId } = data;
  return await request(`/projects/${projectId}/datasets/${dataSetId}/ConvertDataFormat`, {
    method: 'POST',
    data: data,
  });
}

export async function getConvertSupportFormat(projectId, dataSetId) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/ConvertSupportFormat`)
}
