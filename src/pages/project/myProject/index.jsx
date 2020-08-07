import { message, Table, Modal, Form, Input, Button, PageHeader } from 'antd';
import React, { useState, useEffect } from 'react';
import { getProject, deleteProject, submitProject, editProject } from './service';
import { PAGEPARAMS, sortText } from '@/utils/const';
import { Link } from 'umi';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import styles from './index.less';
import { connect } from 'dva';

const { confirm } = Modal;
const { Search } = Input;

const ProjectTable = ({ user }) => {
  const { currentUser: { onlyImageLabel } } = user;
  const emptyValue = {name: '', info: ''};
  const [project, setProject] = useState({ data: [], total: 0 });
  const [modalFlag, setModalFlag] = useState(false);
  const [modalType, setModalType] = useState('');
  const [pageParams, setPageParams] = useState(PAGEPARAMS);
  const [editProjectId, setEditProjectId] = useState('');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [sortedInfo, setSortedInfo] = useState({
    orderBy: '',
    order: ''
  });
  useEffect(() => {
    getData();
  }, [pageParams, sortedInfo]);

  const getData = async () => {
    setLoading(true);
    const params = { 
      ...pageParams, 
      name: name, 
      orderBy: sortedInfo.columnKey,
      order: sortText[sortedInfo.order]
    };
    const { code, data, msg } = await getProject(params);
    if (code === 0) {
      const { projects, totalCount } = data;
      if (!projects.length && totalCount) {
        setPageParams({ ...pageParams, page: 1 })
      }
      setProject({
        data: projects,
        total: totalCount
      });
    }
    setLoading(false);
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
        const { code, msg } = res;
        if (code === 0) {
          message.success('删除成功！')
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
      title: '项目ID',
      dataIndex: 'projectId',
      render: id => <Link style={{fontFamily: 'Consolas'}} to={`/project/dataSetList?projectId=${id}`}>{id}</Link>
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order
    }, 
    {
      title: '简介',
      dataIndex: 'info',
      ellipsis: true,
    },
    {
      title: onlyImageLabel ? '' : '操作',
      render: item => {
        if (onlyImageLabel) {
          return null;
        } else {
          return (
            <div>
              <a onClick={() => onEditClick(item)}>编辑</a>
              <a style={{ color: 'red', marginLeft: 10 }} onClick={() => handleRemove(item.projectId)}>删除</a>
            </div>
          )
        }
      }
    },
  ]

  const onEditClick = item => {
    form.setFieldsValue(item);
    setEditProjectId(item.projectId);
    setModalType('edit');
    setModalFlag(true);
  }

  const resetModal = type => {
    form.setFieldsValue(emptyValue);
    setModalFlag(type);
  }

  const onSortChange = (pagination, filters, sorter) => {
    if (sorter.order !== false) {
      setSortedInfo(sorter);
    }
  }

  const onSearchChange = v => {
    setName(v);
    setPageParams({ ...pageParams, page: 1 });
  }

  return (
    <div className={styles.project}>
      <PageHeader
        ghost={false}
        title="项目列表"
      >
        <div style={{ marginBottom: 16 }}>
          {!onlyImageLabel && <Button type="primary" onClick={() => { setModalType('new'); resetModal(true); }}>新建项目</Button>}
          <Search placeholder="请输入项目名称查询" enterButton onSearch={onSearchChange} />
        </div>
        <Table 
          columns={columns} 
          dataSource={project.data}
          rowKey={r => r.projectId}
          onChange={onSortChange}
          pagination={{
            total: project.total,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            showSizeChanger: true,
            onChange: pageParamsChange,
            onShowSizeChange: pageParamsChange,
            current: pageParams.page,
            pageSize: pageParams.size
          }}
          loading={loading}
        />
      </PageHeader>
      {modalFlag && <Modal
          title={`${modalType === 'edit' ? '编辑' : '新增'} 项目`}
          visible={modalFlag}
          onOk={onSubmit}
          onCancel={() => resetModal(false)}
          okText="提交"
          destroyOnClose
        >
          <Form form={form} className={styles.projectModal}>
            <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称！' }, { max: 15 }]}>
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item label="简介" name="info" 
              rules={[{ required: true, message: '请输入简介！' }, { min: 10, max: 50 }]}>
              <Input.TextArea placeholder="请输入简介" autoSize={{ minRows: 4 }} />
            </Form.Item>
          </Form>
        </Modal>}
    </div>
  )
}

export default connect(({ user }) => ({ user }))(ProjectTable);