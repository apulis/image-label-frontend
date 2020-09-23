import React from 'react';
import { IMAGE_BASE_URL } from '@/utils/const';
import DocumentMeta from 'react-document-meta';
import LabelingApp from '../../../../../components/LabelUtilsComponents/LabelingApp/index';
import { message } from 'antd';
import { getUpDownData, getAnnotations, submitDetail, getTasks, getSuffix } from '../../service';
import { connect } from 'umi';
import { getPageQuery } from '@/utils/utils';
import { history } from 'umi';
import { PageLoading } from '@ant-design/pro-layout';

@connect(({ global }) => ({ global }))
class TaskDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      error: null,
      project: null,
      image: null,
      imageInfo: [{}],
      isOCR: false,
      btnLoading: false,
      projectId: getPageQuery().projectId,
      dataSetId: getPageQuery().dataSetId,
      lastId: 0,
      firstId: 0
    };
  }

  async componentDidMount() {
    const { dispatch } = this.props;
    const { projectId, dataSetId } = this.state;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: {
        collapsed: false
      }
    });
    await dispatch({
      type: 'global/getLabels',
      payload: {
        projectId, dataSetId
      }
    });
    this.getData();
    const { code, data } = await getTasks(projectId, dataSetId, { page: 1, size: 20 });
    const { taskList, totalCount } = data;
    if (code === 0 && taskList.length) {
      this.setState({ firstId: taskList[0].id });
    }
    const resL = await getTasks(projectId, dataSetId, { page: Math.ceil(totalCount / 100), size: 100 });
    if (resL.code === 0 && resL.data.taskList.length) {
      this.setState({ lastId: resL.data.taskList[resL.data.taskList.length - 1].id });
    }
  }

  componentDidUpdate(prevProps) {
    const { taskId } = this.props.match.params;
    if (prevProps.match.params.taskId !== taskId) {
      this.refetch(taskId);
    }
  }

  getUpDown = async (taskId, type) => {
    const { projectId, dataSetId, firstId, lastId } = this.state;
    const res = await getUpDownData(projectId, dataSetId, taskId, type);
    const { code, data } = res;
    const _id = type ? data.next.id : data.previous.id;
    if (code === 0) {
     history.push(
        `/project/dataSet/taskList/detail/${_id}?projectId=${projectId}&dataSetId=${dataSetId}&lastId=${encodeURIComponent(lastId)}&firstId=${encodeURIComponent(firstId)}`
      );
    }
  }

  getData = async () => {
    const { labels } = this.props.global.Labels;
    const { taskId } = this.props.match.params;
    const { projectId, dataSetId } = this.state;
    let _this = this;
    const res = await getAnnotations(projectId, dataSetId, taskId);
    const res2 = await getSuffix(projectId, dataSetId, taskId);
    const { code, data, msg } = res;
    const { annotations } = data;
    let imageInfo = {}, suffix = '.jpg';
    if (res2.code === 0) {
      suffix = res2.data.suffix;
      imageInfo = [{ file_name: `${taskId}${suffix}` }];
    }
    if (code === 0) {
      let _project = [], formParts = {};
      if (annotations) {
        // imageInfo = annotations.images[0] || {};
        let ann = annotations.annotations || [];
        ann.map((one, index) => {
          const { category_id, segmentation, bbox, text } = one;
          this.setState({ isOCR: text !== undefined });
          let a = category_id, points = [], obj = { id: '0', type: "polygon", points };
          if (text) obj.popupText = text;
          if (segmentation && segmentation.length && segmentation[0].length) {
            segmentation.forEach(element => {
              for (var i = 0, len = element.length; i < len; i = i + 2) {
                obj.points.push({ "lng": element[i], "lat": element[i + 1] });
              }
              if (!formParts.hasOwnProperty(a)) {
                formParts[a] = [obj];
              } else {
                let temp = formParts[a];
                let _id = Number(temp[temp.length - 1].id) + 1
                obj.id = _id.toString();
                formParts[a].push(obj);
              }
            });
          } else {
            if (bbox.length == 4) {
              obj.type = "bbox";
              obj.points.push({ "lng": bbox[0], "lat": bbox[1] });
              obj.points.push({ "lng": bbox[0] + bbox[2], "lat": bbox[1] + bbox[3] });
              if (!formParts.hasOwnProperty(a)) {
                formParts[a] = [obj];
              } else {
                formParts[a].push(obj);
              }
            }
          }
        })
        for (var p in formParts) {
          const _name = labels ? labels.filter(v => v.id == p) : [];
          _project.push({ id: Number(p), type: formParts[p][0].type, name: _name.length ? _name[0].name : '' });
        }
      }
      _this.setState({
        loading: false,
        project: {
          form: { formParts: _project }
        },
        image: {
          link: `${IMAGE_BASE_URL}${dataSetId}/images/${taskId}${suffix}`,
          localPath: null, originalName: taskId + "." + suffix, projectsId: 1,
          labelData: {
            height: 480, width: 640,
            labels: formParts
          }
        },
        imageInfo: [imageInfo]
      });
    } else {
      message('error', msg);
    }
  }

  pushUpdate = (labelData) => {
    const { taskId } = this.props.match.params;
    const { dataSetId } = this.state;
    let imageInfo = this.state.imageInfo;
    if (imageInfo[0]) {
      imageInfo[0].height = labelData.height;
      imageInfo[0].width = labelData.width;
    }
    const suffix = imageInfo[0].file_name.split('.')[1];
    this.setState({
      image: {
        link: IMAGE_BASE_URL + dataSetId + '/images/' + taskId + '.' + suffix,
        localPath: null, originalName: taskId + "." + suffix, projectsId: 1,
        labelData: labelData
      },
      imageInfo
    });
  }

  fetch = async (...args) => {
    return await fetch(...args);
  }

  refetch = async (taskId) => {
    const { projectId, dataSetId, firstId, lastId } = this.state;
    this.setState({
      loading: true,
      error: null,
      project: null,
      image: null
    });

    try {
      if (!taskId) {
        history.replace(`/project/dataSet/taskList?projectId=${projectId}&&dataSetId=${dataSetId}`);
        return;
      }
      history.replace(`/project/dataSet/taskList/detail/${taskId}?projectId=${projectId}&dataSetId=${dataSetId}&lastId=${encodeURIComponent(lastId)}&firstId=${encodeURIComponent(firstId)}`);
      this.getData();
    } catch (error) {
      this.setState({
        loading: true,
        error,
      });
    }
  }

  markComplete = async () => {
    const { taskId } = this.props.match.params;
    const { projectId, dataSetId } = this.state;
    this.setState({ btnLoading: true });
    const { code } = await submitDetail(projectId, dataSetId, taskId, this.tansformToCocoFormat());
    if (code === 0) {
      message.success('提交成功！');
      if (getPageQuery().lastId === taskId) {
        history.push(
          `/project/dataSet/taskList?projectId=${projectId}&dataSetId=${dataSetId}`
        )
      } else {
        this.getUpDown(taskId, 1);
      }
    } 
    this.setState({ btnLoading: false });
  }

  tansformToCocoFormat() {
    const { imageInfo, image, isOCR } = this.state;
    const { global, match } = this.props;
    const { taskId } = match.params;
    let data = image.labelData.labels, sendData = {
      images: imageInfo,
      annotations: [],
      id: taskId,
      categories: global.Labels.labels
    };
    for (let one in data) {
      data[one].map((o) => {
        let seg = [];
       const { type, points, popupText } = o;
        if (type == "polygon") {
          points.map(i => { seg.push(i.lng); seg.push(i.lat) });
          let obj1 = { "segmentation": [seg], "category_id": parseInt(one), "bbox": [] };
          if (isOCR) obj1.text = popupText;
          sendData["annotations"].push(obj1);
        } else {
          seg.push(points[0].lng);
          seg.push(points[0].lat);
          seg.push(points[1].lng - points[0].lng);
          seg.push(points[1].lat - points[0].lat);
          let obj2 = { "segmentation": [], "category_id": parseInt(one), "bbox": seg };
          if (isOCR) obj2.text = popupText;
          sendData["annotations"].push(obj2);
        }
      })
    }
    return sendData;
  }

  chnageState = (key, val) => {
    this.setState({ [key]: val });
  }

  render() {
    const title = `标注工具`;
    const { global } = this.props;
    const { project, image, isOCR, loading, btnLoading, projectId, dataSetId } = this.state;
    const { taskId } = this.props.match.params;
    const props = {
      onBack: () => {
        this.getUpDown(taskId, 0);
      },
      onSkip: () => {
        this.getUpDown(taskId, 1);
      },
      onSubmit: () =>  {
        this.markComplete();
      },
      onBackTasks: () => {
        history.push(
          `/project/dataSet/taskList?projectId=${projectId}&dataSetId=${dataSetId}`
        )
      },
      onLabelChange: this.pushUpdate,
      isDetail: true,
      btnLoading: btnLoading
    };

    if (loading) return (<PageLoading />)
    return (
      <div>
        <DocumentMeta title={title}>
          <LabelingApp
            labelData={image.labelData.labels || {}}
            imageUrl={image.link}
            fetch={this.fetch}
            labels={project.form.formParts}
            project={project}
            chnageState={this.chnageState}
            isOCR={isOCR}
            image={image}
            taskId={taskId}
            {...props}
          />
        </DocumentMeta>
      </div>
    )
  }
}

export default TaskDetail;