import { message, Table, Modal, Input, Button, PageHeader } from 'antd';
import React, { useState, useEffect, useRef } from 'react';
import { getDataSet, addDataSet, submitDataSet, deleteDataSet } from '../service';
import { PAGEPARAMS, TYPE } from '../../../../const';
import { getPageQuery } from '@/utils/utils';
import { Link, useSelector, useDispatch, history } from 'umi';
import styles from './index.less';
import MapTable from './components/MapTable/index';
import DataSetModalForm from './components/DataSetModalForm/index';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { PageLoading } from '@ant-design/pro-layout';

const { confirm } = Modal;
const DataSetTable = (props) => {
  const [dataset, setDataSet] = useState({ data: [], total: 0 });
  const [mapModal, setMapModal] = useState(false);
  const [dataSetFormModal, setDataSetFormModal] = useState(false);
  const [clickDataSetId, setClickDataSetId] = useState('');
  const [pageParams, setPageParams] = useState(PAGEPARAMS);
  const [dataSetModalType, setDataSetModalType] = useState(1);
  const [btnLoading, setBtnLoading] = useState(false);
  const [cascaderOptions, setCascaderOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const dataSetModalFormRef = useRef();
  const projectId = getPageQuery().projectId;
  const global = useSelector(({ global }) => global);
  const dispatch = useDispatch();

  useEffect(() => {
    getData();
  }, [pageParams]);
  
  const getData = async () => {
    const { page, size } = pageParams;
    const { successful, datasets, msg, totalCount } = await getDataSet(projectId, page, size);
    if (successful === 'true') {
      setDataSet({
        data: datasets,
        total: totalCount
      });
      setLoading(false);
    }
  }

  const pageParamsChange = (page, size) => {
    setPageParams({ page: page, size: size });
  }

  const columns = [
    {
      title: '数据集Id',
      dataIndex: 'dataSetId',
      width: 300,
      render: id => <Link to={`/image_label/project/dataSet/taskList?projectId=${projectId}&dataSetId=${id}`}>{id}</Link>
    },
    {
      title: '数据集名称',
      dataIndex: 'Name',
    },
    {
      title: '数据集类型',
      dataIndex: 'Type',
      render: type => <span>{type}</span>
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
        const { dataSetId } = item;
        return (
          <div className={styles.actions}>
            {/* <Link to={`/image_label/project/dataSet-tasks?projectId=${id}`}>Explorer</Link> */}
            <a onClick={() => { setMapModal(true); setClickDataSetId(dataSetId); }}>mAP</a>
            <a onClick={() => onClickDataSetModal(2, dataSetId)}>编辑</a>
            <a style={{ color: 'red' }} onClick={() => delDataSet(dataSetId) }>删除</a>
          </div>
        )
      }
    },
  ]

  const delDataSet = async (id) => {
    confirm({
      content: `确定要删除该数据集吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        await deleteDataSet(projectId, id)
        getData();
      },
      onCancel() {}
    });
  }

  const onCancel = () => {
    setDataSetFormModal(false);
    setBtnLoading(false);
  }

  const onSubmit = () => {
    const { form, selectedCategoryList } = dataSetModalFormRef.current;
    form.validateFields(['name', 'info', 'type']).then(async (values) => {
      setBtnLoading(true);
      if (dataSetModalType == 2 && !selectedCategoryList.length) {
        message.error('请确定选择的对象类型！');
        setBtnLoading(false);
        return;
      }
      values.labels = selectedCategoryList;
      const res = dataSetModalType == 1 ? await addDataSet(projectId, values) : await submitDataSet(projectId, clickDataSetId, values);
      if (res && res.successful === 'true') {
        setDataSetFormModal(false);
        getData();
      }
      setBtnLoading(false);
    })
  }

  const onClickDataSetModal = async (type, dataSetId) => {
    setDataSetModalType(type);
    setClickDataSetId(dataSetId);
    setDataSetFormModal(true);
    if (type == 2) {
      const { Labels, l_projectId, l_datasetId } = global;
      if (Labels && Labels.length && l_projectId == projectId && l_datasetId == dataSetId) {
        getSupercategory(Labels);
      } else {
        const res = await dispatch({
          type: 'global/getLabels',
          payload: {
            projectId, dataSetId
          }
        });
        const { successful, annotations } = res;
        successful === 'true' && getSupercategory(annotations || []);
      }
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
        onBack={() => history.goBack()}
        title={
          <div>数据集列表
            <Button type="primary" style={{ float: 'right' }}
              onClick={() => onClickDataSetModal(1)}>新增数据集</Button>
          </div>
        }
      >
        <Table 
          columns={columns} 
          dataSource={dataset.data}
          rowKey={(r, i) => `${i}`}
          pagination={{
            total: dataset.total, 
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            showSizeChanger: true,
            onChange: pageParamsChange,
            onShowSizeChange: pageParamsChange
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
        <MapTable dataSetId={clickDataSetId} projectId={projectId} />
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
          dataSetId={clickDataSetId}
          projectId={projectId}
          cascaderOptions={cascaderOptions} />
      </Modal>}
    </div>
  )
}

export default DataSetTable;