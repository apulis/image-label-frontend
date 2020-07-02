import { message, Table, Modal, Form, Input, Button, PageHeader } from 'antd';
import React, { useState, useEffect } from 'react';
import { getProject, deleteProject, submitProject, editProject } from './service';
import { PAGEPARAMS } from '../../../const';
import { Link } from 'umi';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './index.less';
import { PageLoading } from '@ant-design/pro-layout';

const { confirm } = Modal;

const ProjectTable = () => {
  const emptyValue = {Name: '', Info: ''};
  const [project, setProject] = useState({ data: [], total: 0 });
  const [modalFlag, setModalFlag] = useState(false);
  const [modalType, setModalType] = useState('');
  const [pageParams, setPageParams] = useState(PAGEPARAMS);
  const [editProjectId, setEditProjectId] = useState('');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getData();
  }, [pageParams]);

  const getData = async () => {
    const { page, size } = pageParams;
    const { successful, projects, msg, totalCount } = await getProject(page, size);
    if (successful === 'true') {
      setProject({
        data: projects,
        total: totalCount
      });
      setLoading(false);
    }
  }

  const handleRemove = id => {
    confirm({
      title: '确定删除改项目吗？',
      icon: <ExclamationCircleOutlined />,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const res = await deleteProject(id);
        const { successful, msg } = res;
        if (successful === 'true') {
          getData();
        }
      },
      onCancel() {}
    });
  }

  const pageParamsChange = (page, size) => {
    setPageParams({ page: page, size: size });
  }

  const onSubmit = () => {
    form.validateFields().then(async (values) => {
      if (modalType === 'new') {
        await submitProject(values);
      } else if (modalType === 'edit') {
        await editProject(editProjectId, values);
      }
      message.success('提交成功！');
      resetModal(false);
      getData();
    })
    .catch(info => {
      message.error('提交失败！');
      console.log('Validate Failed:', info);
    });
  }

  const columns = [
    {
      title: '项目Id',
      dataIndex: 'ProjectId',
      width: 300,
      render: id => <Link to={`/image_label/project/dataSetList?projectId=${id}`}>{id}</Link>
    },
    {
      title: '项目名词',
      dataIndex: 'Name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: () => <span>Image</span>
    },  
    {
      title: '简介',
      dataIndex: 'Info',
      ellipsis: true,
      width: 350
    },
    {
      title: '操作',
      render: item => {
        return (
          <div>
            <a onClick={() => onEditClick(item)}>编辑</a>
            <a style={{ color: 'red', marginLeft: 10 }} onClick={() => handleRemove(item.ProjectId)}>删除</a>
          </div>
        )
      }
    },
  ]

  const onEditClick = item => {
    form.setFieldsValue(item);
    setEditProjectId(item.ProjectId);
    setModalType('edit');
    setModalFlag(true);
  }

  const resetModal = type => {
    form.setFieldsValue(emptyValue);
    setModalFlag(type);
  }

  if (loading) return (<PageLoading />)

  return (
    <div className={styles.project}>
      <PageHeader
        ghost={false}
        title={
          <div>项目列表
            <Button type="primary" style={{ float: 'right' }} onClick={() => {
              setModalType('new');
              resetModal(true);
            }}>新建项目</Button>
          </div>
        }
      >
        <Table 
          columns={columns} 
          dataSource={project.data}
          rowKey={(r, i) => `${i}`}
          pagination={{
            total: project.total,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            showSizeChanger: true,
            onChange: pageParamsChange,
            onShowSizeChange: pageParamsChange
          }}
        />
      </PageHeader>
      {modalFlag && <Modal
          title={`${modalType === 'edit' ? '编辑' : '新增'} 项目`}
          visible={modalFlag}
          onOk={onSubmit}
          onCancel={() => resetModal(false)}
          okText="Submit"
          destroyOnClose
        >
          <Form form={form} className={styles.projectModal}>
            <Form.Item label="项目名称" name="Name" rules={[{ required: true, message: '请输入项目名称！' }]}>
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item label="简介" name="Info" 
              rules={[{ required: true, message: '请输入简介！' }, { min: 10 }]}>
              <Input.TextArea placeholder="请输入简介" autoSize={{ minRows: 4 }} />
            </Form.Item>
          </Form>
        </Modal>}
    </div>
  )
}

export default ProjectTable;