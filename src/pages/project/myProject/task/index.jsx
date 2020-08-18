import React, { useState, useEffect } from 'react';
import { Pagination, Card, Empty, PageHeader, message } from 'antd';
import LazyLoad from 'react-lazyload';
import { PAGEPARAMS, IMAGE_BASE_URL } from '@/utils/const';
import { getTasks } from '../service';
import { getPageQuery } from '@/utils/utils';
import { EditOutlined } from '@ant-design/icons';
import styles from './index.less';
import { PageLoading } from '@ant-design/pro-layout';
import { history } from 'umi';

const { Meta } = Card;

const TaskList = () => {
  const [tasks, setTasks] = useState({ data: [], total: 0 });
  const [pageParams, setPageParams] = useState({ page: 1, size: 20 });
  const [loading, setLoading] = useState(true);
  const [lastId, setLastId] = useState(0);
  const [firstId, setFirstId] = useState(0);
  const projectId = getPageQuery().projectId;
  const dataSetId = getPageQuery().dataSetId;

  useEffect(() => {
    getData();
  }, [pageParams]);

  const getData = async () => {
    setLoading(true);
    const { code, data } = await getTasks(projectId, dataSetId, { ...pageParams });
    if (code === 0) {
      const { taskList, totalCount } = data;
      setTasks({
        data: taskList,
        total: totalCount
      });
      if (pageParams.page !== 1) {
        const resF = await getTasks(projectId, dataSetId, { page: 1, size: 20 });
        if (resF.code === 0 && resF.data.taskList.length) {
          setFirstId(resF.data.taskList[0].id);
        }
      } else {
        setFirstId(taskList[0].id);
      }
      const resL = await getTasks(projectId, dataSetId, { page: Math.ceil(totalCount / 100), size: 100 });
      if (resL.code === 0 && resL.data.taskList.length) {
        setLastId(resL.data.taskList[resL.data.taskList.length - 1].id);
      }
    }
    setLoading(false);
  }

  const pageParamsChange = (page, size) => {
    setPageParams({ page: page, size: size });
  }

  if (loading) {
    return (<PageLoading />)
  } else {
    const hasData = tasks.data.length > 0;
    return (
      <PageHeader
        ghost={false}
        onBack={() => history.push(`/project/dataSetList?projectId=${projectId}`)}
        title="任务列表"
      >
        <div className={styles.taskList}>
          {hasData ? 
          tasks.data.map((item, i) => {
            const { id, suffix } = item;
            const { page, size } = pageParams;
            const _data = tasks.data;
            return (
              <Card hoverable
                cover={<img alt="example" src={`${IMAGE_BASE_URL}${dataSetId}/images/${id}${suffix}`} />} key={i}
                onClick={() => history.push(`/project/dataSet/taskList/detail/${id}?projectId=${projectId}&dataSetId=${dataSetId}&lastId=${encodeURIComponent(lastId)}&firstId=${encodeURIComponent(firstId)}`)}
              >
                <Meta title={`第${page > 1 ? (page - 1) * size + i + 1 : i + 1}张 ${id}${suffix}`} />
              </Card>
            )
          }) : <Empty />}
          {hasData && <Pagination
            total={tasks.total}
            showSizeChanger
            showQuickJumper
            current={pageParams.page}
            pageSize={pageParams.size}
            showTotal={total => `共 ${total} 条`}
            onChange={pageParamsChange}
            onShowSizeChange={pageParamsChange}
            current={pageParams.page}
            pageSize={pageParams.size}
          />}
        </div>
      </PageHeader>
    )
  }
}

export default TaskList;