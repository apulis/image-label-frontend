import { message, Table, Modal, Form, Input, Button, PageHeader } from 'antd';
import React, { useState, useEffect } from 'react';
import { getProject, deleteProject, submitProject, editProject } from './service';
import { PAGEPARAMS, sortText } from '@/utils/const';
import { Link, formatMessage } from 'umi';
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
      title: formatMessage({ id: 'project.my.project.confirm.title' }),
      icon: <ExclamationCircleOutlined />,
      okText: formatMessage({ id: 'project.my.project.confirm.okText' }),
      okType: 'danger',
      cancelText: formatMessage({ id: 'project.my.project.confirm.cancenText' }),
      onOk: async () => {
        const res = await deleteProject(id);
        const { code, msg } = res;
        if (code === 0) {
          message.success(formatMessage({ id: 'project.my.project.message.delete.success' }))
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
      message.success(formatMessage({ id: 'project.my.project.message.upload.success' }));
      resetModal(false);
      getData();
    })
    .catch(info => {
      message.error(formatMessage({ id: 'project.my.project.message.upload.failed' }));
      console.log('Validate Failed:', info);
    });
  }

  const columns = [
    {
      title: formatMessage({ id: 'project.my.project.project.id' }),
      dataIndex: 'projectId',
      render: id => <Link style={{fontFamily: 'Consolas'}} to={`/project/dataSetList?projectId=${id}`}>{id}</Link>
    },
    {
      title: formatMessage({ id: 'project.my.project.project.name' }),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order
    }, 
    {
      title: formatMessage({ id: 'project.my.project.info' }),
      dataIndex: 'info',
      ellipsis: true,
    },
    {
      title: onlyImageLabel ? '' : formatMessage({ id: 'project.my.project.action' }),
      render: item => {
        if (onlyImageLabel) {
          return null;
        } else {
          return (
            <div>
              <a onClick={() => onEditClick(item)}>
                {formatMessage({ id: 'project.my.project.edit' })}
              </a>
              <a style={{ color: 'red', marginLeft: 10 }} onClick={() => handleRemove(item.projectId)}>
                {formatMessage({ id: 'project.my.project.delete' })}
              </a>
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
        title={formatMessage({ id: 'project.my.project.list' })}
      >
        <div style={{ marginBottom: 16 }}>
          {!onlyImageLabel && <Button type="primary" onClick={() => { setModalType('new'); resetModal(true); }}>
            {formatMessage({ id: 'project.my.project.new' })}</Button>}
          <Search placeholder={formatMessage({ id: 'project.my.project.search.placeholder' })} enterButton onSearch={onSearchChange} />
        </div>
        <Table 
          columns={columns} 
          dataSource={project.data}
          rowKey={r => r.projectId}
          onChange={onSortChange}
          pagination={{
            total: project.total,
            showQuickJumper: true,
            showTotal: total => `${formatMessage({ 'id': 'project.my.project.total.left' })} ${total} ${formatMessage({ id: 'project.my.project.total.right' })}`,
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
          title={`${modalType === 'edit' ? formatMessage({ id: 'project.my.project.modal.title.edit' }) : formatMessage({ id: 'project.my.project.modal.title.new' })} ${formatMessage({ id: 'project.my.project.modal.title.project' })}`}
          visible={modalFlag}
          onOk={onSubmit}
          onCancel={() => resetModal(false)}
          okText={formatMessage({ id: 'project.my.project.modal.okText' })}
          cancelText={formatMessage({ id: 'label.labelingApp.delete.confirm.cancelText' })}
          destroyOnClose
        >
          <Form form={form} className={styles.projectModal}>
            <Form.Item
              label={formatMessage({ id: 'project.my.project.form.project.name.label' })}
              name="name"
              rules={[{ required: true, message: formatMessage({ id: 'project.my.project.form.project.name.required' }) }, { max: 15 }]}>
              <Input placeholder={formatMessage({ id: 'project.my.project.form.project.name.placeholder' })} />
            </Form.Item>
            <Form.Item label={formatMessage({ id: 'project.my.project.form.info.label' })} name="info" 
              rules={[{ required: true, message: formatMessage({ id: 'project.my.project.form.info.required.message' }) }, { max: 50 }]}>
              <Input.TextArea placeholder={formatMessage({ id: 'project.my.project.form.info.placeholder' })} autoSize={{ minRows: 4 }} />
            </Form.Item>
          </Form>
        </Modal>}
    </div>
  )
}

export default connect(({ user }) => ({ user }))(ProjectTable);