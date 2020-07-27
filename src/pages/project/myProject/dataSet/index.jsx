import { message, Table, Modal, Input, Button, PageHeader, Select } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { getDataSet, addDataSet, submitDataSet, deleteDataSet, convertDataset, getConvertSupportFormat } from '../service';
import { PAGEPARAMS, TYPE } from '@/utils/const';
import { getPageQuery } from '@/utils/utils';
import { Link, useSelector, useDispatch, history } from 'umi';
import styles from './index.less';
import MapTable from './components/MapTable/index';
import DataSetModalForm from './components/DataSetModalForm/index';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { PageLoading } from '@ant-design/pro-layout';

const { confirm } = Modal;
const { Option } = Select;
const { Search } = Input;

const DataSetTable = (props) => {
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

  const typeString = {
    'queue': '转换中',
    'finished': '转换成功',
    'error': '转换失败'
  }

  useEffect(() => {
    getData();
  }, [pageParams, name]);
  
  const getData = async () => {
    const { code, data, msg } = await getDataSet(projectId, { ...pageParams, name: name });
    if (code === 0) {
      const { datasets, totalCount } = data;
      setDataSet({
        data:datasets,
        total: totalCount
      });
      setLoading(false);
    } else {
      message.error(msg);
    }
  }

  const pageParamsChange = (page, size) => {
    setPageParams({ page: page, size: size });
  }

  const columns = [
    {
      title: '数据集Id',
      dataIndex: 'dataSetId',
      render: id => <Link style={{fontFamily: 'Consolas'}} to={`/project/dataSet/taskList?projectId=${projectId}&dataSetId=${id}`}>{id}</Link>
    },
    {
      title: '数据集名称',
      sorter: (a, b) => a.name.length - b.name.length,
      dataIndex: 'name',
    },
    {
      title: '数据集类型',
      dataIndex: 'type',
      render: type => <span>{type}</span>
    },  
    {
      title: '简介',
      dataIndex: 'info',
      ellipsis: true,
    },
    {
      title: '转换状态',
      dataIndex: 'convertStatus',
      render: type => <span>{typeString[type] || '--'}</span>
    }, 
    {
      title: '转换路径',
      dataIndex: 'convertOutPath',
      ellipsis: true,
      render: i => <span>{i || '--'}</span>
    }, 
    {
      title: '操作',
      render: item => {
        const { dataSetId, type } = item;
        return (
          <div className={styles.actions}>
            {/* <Link to={`/project/dataSet-tasks?projectId=${id}`}>Explorer</Link> */}
            {/* <a onClick={() => { setMapModal(true); setClickDataSetId(dataSetId); }}>mAP</a> */}
            <a onClick={() => openConvert(item)} disabled={convertLoading || type === 'queue'}>转换</a>
            <a onClick={() => onClickDataSetModal(2, item)}>编辑</a>
            <a style={{ color: 'red' }} onClick={() => delDataSet(dataSetId) }>删除</a>
          </div>
        )
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
    } else {
      message.error(msg);
    }
  }

  const handleConvert = async () => {
    setConvertLoading(true);
    const res = await convertDataset({projectId: projectId, dataSetId: clickData.dataSetId,  type: 'image', target: convertTarget });
    const { code, data, msg } = res;
    if (code === 0) {
      getData();
      message.success('提交成功！');
      setConvertModal(false); 
    } else {
      message.error(msg);
    }
    setConvertLoading(false);
  }

  const delDataSet = async (id) => {
    confirm({
      content: `确定要删除该数据集吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        const res = await deleteDataSet(projectId, id);
        const { code, msg } = res;
        if (code === 0) {
          message.success('删除成功！')
          getData();
        } else {
          message.error(msg);
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
    form.validateFields(['name', 'info', 'type', 'sourceId']).then(async (values) => {
      setBtnLoading(true);
      if (dataSetModalType == 2 && !selectedCategoryList.length) {
        message.error('请确定选择的对象类型！');
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
      }
      setBtnLoading(false);
    })
  }

  const onClickDataSetModal = async (type, clickData) => {
    setDataSetModalType(type);
    clickData && setClickData(clickData);
    setDataSetFormModal(true);
    if (type == 2) {
      // const { Labels, l_projectId, l_datasetId } = global;
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

  if (loading) return (<PageLoading />);

  return (
    <div className={styles.dataSetList}>
       <PageHeader
        ghost={false}
        onBack={() => history.push(`/project?projectId=${projectId}`)}
        title="数据集列表"
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => onClickDataSetModal(1)}>新增数据集</Button>
          <Search placeholder="请输入数据集名称查询" enterButton onSearch={v => setName(v)} />
        </div>
        <Table 
          columns={columns} 
          dataSource={dataset.data}
          rowKey={r => r.dataSetId}
          pagination={{
            total: dataset.total, 
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
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
        title="mAP 概览"
        maskClosable={false}
        width={1000}
        onCancel={() => setMapModal(false)}
        footer={[
          <Button onClick={() => setMapModal(false)}>关闭</Button>
        ]}
      >
        <MapTable dataSetId={clickData.dataSetId} projectId={projectId} />
      </Modal>}
      {dataSetFormModal && <Modal
        visible={dataSetFormModal}
        title={`${dataSetModalType == 1 ? '新增' : '编辑'}数据集`}
        width={660}
        className="add_modal"
        destroyOnClose
        maskClosable={false}
        onCancel={onCancel}
        footer={[
          <Button onClick={onCancel}>取消</Button>,
          <Button type="primary" loading={btnLoading} onClick={onSubmit}>提交</Button>,
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
        title="转换目标数据格式"
        destroyOnClose
        width={360}
        maskClosable={false}
        
        onCancel={() => setConvertModal(false)}
        footer={[
          <Button onClick={() => setConvertModal(false)}>取消</Button>,
          <Button type="primary" loading={convertLoading} onClick={handleConvert}>转换</Button>,
        ]}
      >
        <Select placeholder="请选择转换目标数据格式" className="convertSelect" value={convertTarget} onChange={v => setConvertTarget(v)}>
          {convertOptions.length > 0 && convertOptions.map(i => <Option value={i}>{i}</Option>)}
        </Select>
      </Modal>}
    </div>
  )
}

export default DataSetTable;