import request from '@/utils/request';
import request2 from '@/utils/request-ai';

export async function getProject(page, size) {
  return request('/projects', {
    params: { page, size }
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

export async function getDataSet(projectId, page, size) {
  return request(`/projects/${projectId}/datasets`, {
    params: { page, size }
  })
}

export async function getTasks(projectId, dataSetId, page, size) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks`, {
    params: { page, size }
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

export async function getNextData(projectId, dataSetId, taskId) {
  return request(`/projects/${projectId}/datasets/${dataSetId}/tasks/next/${taskId}`)
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