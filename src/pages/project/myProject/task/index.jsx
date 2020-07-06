import React, { useState, useEffect } from 'react';
import { Pagination, Card, Empty, PageHeader } from 'antd';
import LazyLoad from 'react-lazyload';
import { PAGEPARAMS, IMAGE_BASE_URL } from '../../../../const';
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
  const projectId = getPageQuery().projectId;
  const dataSetId = getPageQuery().dataSetId;

  useEffect(() => {
    getData();
  }, [pageParams]);

  const getData = async () => {
    const { page, size } = pageParams;
    const { successful, taskList, msg, totalCount } = await getTasks(projectId, dataSetId, page, size);
    if (successful === 'true') {
      setTasks({
        data: taskList,
        total: totalCount
      });
    }
    setLoading(false);
  }

  const onPageChange = (page, size) => {
    setPageParams({
      page,
      size: pageParams.size
    });
  }

  const onPageSizeChange = (current, size) => {
    setPageParams({
      page: pageParams.page,
      size
    });
  }

  if (loading) {
    return (<PageLoading />)
  } else {
    const hasData = tasks.data.length > 0;
    return (
      <PageHeader
        ghost={false}
        onBack={() => history.goBack()}
        title="任务列表"
      >
        <div className={styles.taskList}>
          {hasData ? 
          tasks.data.map((item, i) => {
            const { id } = item;
            return (
              <Card hoverable
                cover={<img alt="example" src={`${IMAGE_BASE_URL}${dataSetId}/images/${id}.jpg`} />} key={i}
                onClick={() => history.push(`/image_label/project/dataSet/taskList/detail/${id}?projectId=${projectId}&dataSetId=${dataSetId}`)}
              >
                <Meta title={`第${i + 1}张 ${id}.jpg`} />
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
            onChange={onPageChange}
            onShowSizeChange={onPageSizeChange}
          />}
        </div>
      </PageHeader>
    )
  }
}

export default TaskList;