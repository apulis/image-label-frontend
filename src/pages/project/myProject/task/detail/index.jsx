import React from 'react';
import { IMAGE_BASE_URL } from '@/utils/const';
import DocumentMeta from 'react-document-meta';
import LabelingApp from '../../../../../components/LabelUtilsComponents/LabelingApp/index';
import { message } from 'antd';
import { getNextData, getAnnotations, submitDetail } from '../../service';
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
      imageInfo: {},
      isOCR: false,
      btnLoading: false,
      projectId: getPageQuery().projectId,
      dataSetId: getPageQuery().dataSetId
    };
  }

  async componentDidMount() {
    const { dispatch, global } = this.props;
    const { projectId, dataSetId } = this.state;
    // const { labels, l_projectId, l_datasetId } = global.Labels;
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
  }

  componentDidUpdate(prevProps) {
    const { taskId } = this.props.match.params;
    if (prevProps.match.params.taskId !== taskId) {
      this.refetch(taskId);
    }
  }

  getNext = async (taskId) => {
    const { projectId, dataSetId } = this.state;
    const res = await getNextData(projectId, dataSetId, taskId);
    const { code, data } = res;
    if (code === 0) {
     history.push(
        `/project/dataSet/taskList/detail/${data.next.id}?projectId=${projectId}&dataSetId=${dataSetId}`
      );
    }
  }

  getData = async () => {
    const { labels } = this.props.global.Labels;
    const { taskId } = this.props.match.params;
    const { projectId, dataSetId } = this.state;
    let _this = this;
    const res = await getAnnotations(projectId, dataSetId, taskId);
    const { code, data, msg } = res;
    const { annotations } = data;

    if (code === 0) {
      let _project = [], formParts = {}, imageInfo = {};
      if (annotations) {
        imageInfo = annotations.images || {};
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
      } else {
        imageInfo = { "file_name": taskId + '.jpg' };
      }
      
      _this.setState({
        loading: false,
        project: {
          form: { formParts: _project }
        },
        image: {
          link: IMAGE_BASE_URL + dataSetId + '/images/' + taskId + '.' + imageInfo[0].file_name.split('.')[1],
          localPath: null, originalName: taskId + ".jpg", projectsId: 1,
          labelData: {
            height: 480, width: 640,
            labels: formParts
          }
        },
        imageInfo
      });
    } else {
      message('error', msg);
    }
  }

  pushUpdate = (labelData) => {
    const { taskId } = this.props.match.params;
    const { dataSetId } = this.state;
    let imageInfo = this.state.imageInfo;
    if (imageInfo) {
      imageInfo["height"] = labelData.height;
      imageInfo["width"] = labelData.width;
    }
    this.setState({
      image: {
        externalLink: null, id: 4, labeld: 1, lastEdited: 1575603884857,
        link: IMAGE_BASE_URL + dataSetId + '/images/' + taskId + '.jpg',
        localPath: null, originalName: taskId + ".jpg", projectsId: 1,
        labelData: labelData
      },
      imageInfo
    });
  }

  fetch = async (...args) => {
    return await fetch(...args);
  }

  refetch = async (taskId) => {
    const { projectId, dataSetId } = this.state;
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
      history.replace(`/project/dataSet/taskList/detail/${taskId}?projectId=${projectId}&dataSetId=${dataSetId}`);
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
    const res = await submitDetail(projectId, dataSetId, taskId, this.tansformToCocoFormat());
    res.code === 0 && this.getNext(taskId);
    this.setState({ btnLoading: false });
  }

  tansformToCocoFormat() {
    const { imageInfo, image, isOCR } = this.state;
    const { taskId } = this.props.match.params;
    let sendData = { images: imageInfo, annotations: [], id: taskId }, data = image.labelData.labels;
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
    const title = `Image Label Tool`;
    const { global } = this.props;
    const { project, image, isOCR, loading, btnLoading, projectId, dataSetId } = this.state;
    const { taskId } = this.props.match.params;
    const props = {
      onBack: () => {
        history.goBack();
      },
      onSkip: () => {
        this.getNext(taskId);
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
            {...props}
          />
        </DocumentMeta>
      </div>
    )
  }
}

export default TaskDetail;