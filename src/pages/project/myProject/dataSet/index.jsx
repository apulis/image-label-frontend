import { message, Table, Modal, Input, Button, PageHeader, Select } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { getDataSet, addDataSet, submitDataSet, deleteDataSet, convertDataset, getConvertSupportFormat } from '../service';
import { PAGEPARAMS, TYPE, sortText } from '@/utils/const';
import { getPageQuery } from '@/utils/utils';
import { Link, useSelector, useDispatch, history, formatMessage } from 'umi';
import styles from './index.less';
import MapTable from './components/MapTable/index';
import DataSetModalForm from './components/DataSetModalForm/index';
import { ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { connect } from 'dva';

const { confirm } = Modal;
const { Option } = Select;
const { Search } = Input;

const DataSetTable = ({ user }) => {
  const { currentUser: { onlyImageLabel } } = user;
  const [dataset, setDataSet] = useState({ data: [], total: 0 });
  const [mapModal, setMapModal] = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [dataSetFormModal, setDataSetFormModal] = useState(false);
  const [clickData, setClickData] = useState({});
  const [pageParams, setPageParams] = useState(PAGEPARAMS);
  const [dataSetModalType, setDataSetModalType] = useState(1);
  const [btnLoading, setBtnLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);
  const [cascaderOptions, setCascaderOptions] = useState([]);
  const [convertOptions, setConvertOptions] = useState([]);
  const [convertTarget, setConvertTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const dataSetModalFormRef = useRef();
  const projectId = getPageQuery().projectId;
  const global = useSelector(({ global }) => global);
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [sortedInfo, setSortedInfo] = useState({
    orderBy: '',
    order: ''
  });

  const typeString = {
    'queue': formatMessage({ id: 'formatMessage' }),
    'finished': formatMessage({ id: 'dataset.typestring.finished' }),
    'error': formatMessage({ id: 'dataset.typestring.error' }),
    'image': formatMessage({ id: 'dataset.typestring.image' }),
    'video': formatMessage({ id: 'dataset.typestring.video' }),
    'text': formatMessage({ id: 'dataset.typestring.text' })
  }

  useEffect(() => {
    getData();
  }, [pageParams, sortedInfo]);
  
  const getData = async (text) => {
    setLoading(true);
    const params = { 
      ...pageParams, 
      name: name, 
      orderBy: sortedInfo.columnKey,
      order: sortText[sortedInfo.order]
    };
    const { code, data, msg } = await getDataSet(projectId, params);
    if (code === 0) {
      const { datasets, totalCount } = data;
      if (!datasets.length && totalCount) {
        setPageParams({ ...pageParams, page: 1 })
      }
      setDataSet({
        data:datasets,
        total: totalCount
      });
      text && message.success(text);
    }
    setLoading(false);
  }

  const pageParamsChange = (page, size) => {
    setPageParams({ page: page, size: size });
  }

  const columns = [
    {
      title: formatMessage({ id: 'dataset.typestring.dataset.id' }),
      dataIndex: 'dataSetId',
      render: id => <Link style={{fontFamily: 'Consolas'}} to={`/project/dataSet/taskList?projectId=${projectId}&dataSetId=${id}`}>{id}</Link>
    },
    {
      title: formatMessage({ id: 'dataset.typestring.dataset.name'}),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
    },
    {
      title: formatMessage({ id: 'dataset.typestring.dataset.type' }),
      dataIndex: 'type',
      render: type => <span>{typeString[type] || '--'}</span>
    },  
    {
      title: formatMessage({ id: 'dataset.typestring.dataset.info' }),
      dataIndex: 'info',
      ellipsis: true,
    },
    {
      title: formatMessage({ id: 'dataset.typestring.dataset.status' }),
      dataIndex: 'convertStatus',
      render: type => <span>{typeString[type] || '--'}</span>
    }, 
    {
      title: formatMessage({ id: 'dataset.typestring.dataset.path' }),
      dataIndex: 'convertOutPath',
      ellipsis: true,
      render: i => <span>{i || '--'}</span>
    }, 
    {
      title: onlyImageLabel ? '' : formatMessage({ id: 'dataset.typestring.dataset.action' }),
      render: item => {
        const { dataSetId, type } = item;
        if (onlyImageLabel) {
          return null;
        } else {
          return (
            <div className={styles.actions}>
              {/* <Link to={`/project/dataSet-tasks?projectId=${id}`}>Explorer</Link> */}
              {/* <a onClick={() => { setMapModal(true); setClickDataSetId(dataSetId); }}>mAP</a> */}
              <a onClick={() => openConvert(item)} disabled={convertLoading || type === 'queue'}>
                {formatMessage({ id: 'dataset.typestring.dataset.convert' })}
              </a>
              <a onClick={() => onClickDataSetModal(2, item)}>
                {formatMessage({ id: 'dataset.typestring.dataset.edit' })}
              </a>
              <a style={{ color: 'red' }} onClick={() => delDataSet(dataSetId) }>
                {formatMessage({ id: 'dataset.typestring.dataset.delete' })}
              </a>
            </div>
          )
        }
      }
    },
  ]

  const openConvert = async (item) => {
    setConvertModal(true);
    setClickData(item);
    const res = await getConvertSupportFormat(projectId, item.dataSetId);
    const { code, data, msg } = res;
    if (code === 0) {
      setConvertOptions(data);
      data.length === 1 && setConvertTarget(data[0]);
    }
  }

  const handleConvert = async () => {
    setConvertLoading(true);
    const res = await convertDataset({projectId: projectId, dataSetId: clickData.dataSetId,  type: 'image', target: convertTarget });
    const { code, data, msg } = res;
    if (code === 0) {
      getData();
      message.success(formatMessage({ id: 'dataset.typestring.dataset.upload.success' }));
      setConvertModal(false);
    }
    setConvertLoading(false);
  }

  const delDataSet = async (id) => {
    confirm({
      content: formatMessage({ id: 'dataset.typestring.dataset.confirm.delete' }),
      okText: formatMessage({ id: 'dataset.typestring.dataset.confirm.okText' }),
      okType: 'danger',
      cancelText: formatMessage({ id: 'dataset.typestring.dataset.confirm.cancelText' }),
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        const res = await deleteDataSet(projectId, id);
        const { code, msg } = res;
        if (code === 0) {
          message.success(formatMessage({ id: 'dataset.typestring.dataset.message.delete.success' }))
          getData();
        }
      },
      onCancel() {}
    });
  }

  const onCancel = () => {
    setDataSetFormModal(false);
    setBtnLoading(false);
  }

  const onSubmit = () => {
    const { form, selectedCategoryList, sourceOptions } = dataSetModalFormRef.current;
    form.validateFields(['name', 'info', 'type', 'sourceId', 'isPrivate']).then(async (values) => {
      setBtnLoading(true);
      if (dataSetModalType == 2 && !selectedCategoryList.length) {
        message.error(formatMessage({ id: 'dataset.typestring.dataset.message.error.select.item.type' }));
        setBtnLoading(false);
        return;
      }
      values.labels = selectedCategoryList;
      const { sourceId } = values;
      if (sourceId) {
        values.dataSetBindId = sourceId;
        values.dataSetPath = sourceOptions.find(i => i.id === sourceId).path;
        delete values.sourceId;
      }
      if (dataSetModalType == 2) {
        values.dataSetBindId = clickData.dataSetBindId;
        values.dataSetPath = clickData.dataSetPath;
      }
      const res = dataSetModalType == 1 ? await addDataSet(projectId, values) : await submitDataSet(projectId, clickData.dataSetId, values);
      if (res && res.code === 0) {
        setDataSetFormModal(false);
        getData();
        message.success(formatMessage({ id: 'dataset.message.create.success' }));
      }
      setBtnLoading(false);
    })
  }

  const onClickDataSetModal = async (type, clickData) => {
    setDataSetModalType(type);
    clickData && setClickData(clickData);
    setDataSetFormModal(true);
    if (type == 2) {
      const res = await dispatch({
        type: 'global/getLabels',
        payload: {
          projectId, 
          dataSetId: clickData.dataSetId
        }
      });
      const { code, data } = res;
      code === 0 && getSupercategory(data.annotations || []);
    }
  }

  const getSupercategory = labels => {
    let _supercategory = {}, cascaderOptions = [];
    labels.forEach(item => {
      const { supercategory, name, id } = item;
      if (!_supercategory[supercategory]) _supercategory[supercategory] = []
      _supercategory[supercategory].push({
        value: id,
        label: name
      });
    })
    Object.keys(_supercategory).forEach(item => {
      cascaderOptions.push({
        value: item,
        label: item,
        children: _supercategory[item]
      });
    })
    setCascaderOptions(cascaderOptions);
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
    <div className={styles.dataSetList}>
       <PageHeader
        ghost={false}
        onBack={() => history.push(`/project?projectId=${projectId}`)}
        title={formatMessage({ id: 'dataset.list.title' })}
      >
        {!onlyImageLabel && <Button type="primary" onClick={() => onClickDataSetModal(1)}>
          {formatMessage({ id: 'dataset.list.create.dataset' })}
          </Button>}
        <div className={styles.serachWrap}>
          <Search placeholder={formatMessage({ id: 'dataset.list.form.search.dataset' })} enterButton onSearch={() => setPageParams({ ...pageParams, page: 1 })} onChange={e => setName(e.target.value)} />
          <Button onClick={() => getData(formatMessage({ id: 'dataset.list.get.data.success' }))} icon={<SyncOutlined />} />
        </div>
        <Table 
          columns={columns} 
          dataSource={dataset.data}
          rowKey={r => r.dataSetId}
          onChange={onSortChange}
          loading={loading}
          pagination={{
            total: dataset.total, 
            showQuickJumper: true,
            showTotal: total => `${formatMessage({ id: 'dataset.list.table.total.left' })} ${total} ${formatMessage({ id: 'dataset.list.table.total.right' })}`,
            showSizeChanger: true,
            onChange: pageParamsChange,
            onShowSizeChange: pageParamsChange,
            current: pageParams.page,
            pageSize: pageParams.size
          }}
        />
      </PageHeader>
      {mapModal && <Modal
        visible={mapModal}
        title={formatMessage({ id: 'dataset.list.mAP.overview' })}
        maskClosable={false}
        width={1000}
        onCancel={() => setMapModal(false)}
        footer={[
          <Button onClick={() => setMapModal(false)}>{formatMessage({ id: 'dataset.list.close' })}</Button>
        ]}
      >
        <MapTable dataSetId={clickData.dataSetId} projectId={projectId} />
      </Modal>}
      {dataSetFormModal && <Modal
        visible={dataSetFormModal}
        title={`${dataSetModalType == 1 ? formatMessage({ id: 'dataset.list.modal.create' }) : formatMessage({ id: 'dataset.list.modal.edit' })}${formatMessage({ id: 'dataset.list.modal.dataset' })}`}
        width={660}
        className="add_modal"
        destroyOnClose
        maskClosable={false}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}>
            {formatMessage({ id: 'dataset.list.button.cancel' })}
          </Button>,
          <Button type="primary" loading={btnLoading} onClick={onSubmit}>
            {formatMessage({ id: 'dataset.list.modal.button.confirm' })}
          </Button>,
        ]}
      >
        <DataSetModalForm
          ref={dataSetModalFormRef}
          dataSetModalType={dataSetModalType}
          dataSetId={clickData.dataSetId}
          projectId={projectId}
          cascaderOptions={cascaderOptions}
          type={dataSetModalType} />
      </Modal>}
      {convertModal && <Modal
        visible={convertModal}
        title={formatMessage({ id: 'dataset.list.modal.convert.title' })}
        destroyOnClose
        width={360}
        maskClosable={false}
        onCancel={() => setConvertModal(false)}
        footer={[
          <Button onClick={() => setConvertModal(false)}>
            {formatMessage({ id: 'dataset.list.button.cancel' })}
          </Button>,
          <Button type="primary" loading={convertLoading} onClick={handleConvert}>
            {formatMessage({ id: 'dataset.list.button.confirm' })}
          </Button>,
        ]}
      >
        <Select placeholder={formatMessage({ id: 'dataset.list.modal.select.placeholder' })} className="convertSelect" value={convertTarget} onChange={v => setConvertTarget(v)}>
          {convertOptions.length > 0 && convertOptions.map(i => <Option value={i}>{i}</Option>)}
        </Select>
      </Modal>}
    </div>
  )
}

export default connect(({ user }) => ({ user }))(DataSetTable);