import React, { useState, useEffect } from 'react';
import { Table, Select, message } from 'antd';
import styles from './index.less';
import { getMap } from '../../../service';
import { PAGEPARAMS } from '@/utils/const';

const { Option } = Select;

const MapTable = (props) => {
  const [tableData, setTableData] = useState([]);
  const [iou, setIou] = useState(0.5);
  const [iouOptions, setIouOptions] = useState([{ iouThr: 0.5, mean_ap: null }]);
  const [allData, setAllData] = useState({ data: [], totalCount: 0 });
  const [pageParmas, setPageParmas] = useState(PAGEPARAMS);

  useEffect(() => {
    setTableDataSource();
  }, [iou]);

  useEffect(() => {
    getData();
  }, [pageParmas]);

  const getData = async () => {
    const { dataSetId, projectId } = props;
    const res = await getMap(projectId, dataSetId, { ...pageParmas }); 
    const { code, data, msg } = res;
    if (code === 0) {
      const allData = data.data;
      setAllData({ data: allData, totalCount: data.totalCount });
      setIouOptions(allData.map(i => ({ iouThr: i.iouThr, mean_ap: i.mean_ap })));
      setTableDataSource(allData);
    } else {
      message.error(msg);
    }
  }

  const getSelectChildren = () => {
    if (iouOptions.length) {
      return iouOptions.map(i => (<Option key={i.iouThr} value={i.iouThr}>{i.iouThr}</Option>));
    } else {
      return null;
    }
  }

  const setTableDataSource = (val) => {
    const dataSource = val || allData.data;
    if (dataSource && dataSource.length) {
      const _data = dataSource.find(i => i.iouThr == iou);
      setTableData(_data ? _data.data : []);
    }
  }

  const createColumns = () => {
    const columns = [
      {
        title: '类别',
        dataIndex: 'category',
        key: 'category'
      },
      {
        title: 'gt_nums',
        dataIndex: 'gt_nums',
        key: 'gt_nums'
      },
      {
        title: 'det_nums',
        dataIndex: 'det_nums',
        key: 'det_nums'
      },
      {
        title: 'recall',
        dataIndex: 'recall',
        key: 'recall'
      },
      {
        title: 'ap',
        dataIndex: 'ap',
        key: 'ap'
      }
    ];
    return columns;
  }

  const getMeanap = () => {
    const current = iouOptions.find(i => i.iouThr == iou).mean_ap;
    const all = iouOptions.map((i, n) => `${i.mean_ap}${n == iouOptions.length - 1 ? '' : '，'}`);
    return (
      <React.Fragment>
        <span style={{ margin: '0 40px' }}>Current mean_ap： {current}</span>
        <span>All mean_ap： {all}</span>
      </React.Fragment>
    )
  }
  
  return (
    <div className={styles.mapTableWrap}>
      IOU阈值：
      <Select
        placeholder="Please select iou"
        value={iou}
        onChange={v => setIou(v)}
      >
        {getSelectChildren()}
      </Select>
      {iouOptions && iouOptions[0] && iouOptions[0].mean_ap && getMeanap()}
      <Table 
        columns={createColumns()}
        dataSource={tableData || []}
        bordered
        rowKey="category"
        pagination={{
          onChange: (current) => setPageParmas(preState => ({
            ...preState,
            page: current
          })),
          total: allData.totalCount
        }}
      />
    </div>
  );
}

export default MapTable;