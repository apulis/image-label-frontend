import request from '@/utils/request';

export async function getProject(page, size) {
  return request('/api/projects', {
    params: { page, size }
  })
}

export async function deleteProject(projectId) {
  return request(`/api/projects/${projectId}`, {
    method: 'DELETE'
  })
}

export async function submitProject(data) {
  return await request('/api/projects', {
    method: 'POST',
    data: data
  });
}

export async function editProject(projectId, data) {
  return await request(`/api/projects/${projectId}`, {
    method: 'PATCH',
    data: data
  });
}

export async function getDataSet(projectId, page, size) {
  return request(`/api/projects/${projectId}/datasets`, {
    params: { page, size }
  })
}

export async function getTasks(projectId, dataSetId, page, size) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks`, {
    params: { page, size }
  })
}

export async function getMap(projectId, dataSetId, params) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks/map`, {
    params: params
  })
}

export async function getDataSetDetail(projectId, dataSetId) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}`)
}

export async function addDataSet(projectId, data) {
  return request(`/api/projects/${projectId}/datasets`, {
    method: 'POST',
    data: data
  })
}

export async function deleteDataSet(projectId, dataSetId) {
  return request(`/api/projects/${projectId}/datasets`, {
    method: 'DELETE',
    data: JSON.stringify(dataSetId)
  })
}

export async function submitDataSet(projectId, dataSetId, data) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}`, {
    method: 'PATCH',
    data: data
  })
}

export async function submitTask(projectId, dataSetId, taskId, data) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks/annotations/${taskId}`, {
    method: 'POST',
    data: data
  })
}

export async function getNextData(projectId, dataSetId, taskId) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks/next/${taskId}`)
}

export async function getAnnotations(projectId, dataSetId, taskId) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks/annotations/${taskId}`)
}

export function submitDetail(projectId, dataSetId, taskId, data) {
  return request(`/api/projects/${projectId}/datasets/${dataSetId}/tasks/annotations/${taskId}`, {
    method: 'POST',
    data: data
  })
}