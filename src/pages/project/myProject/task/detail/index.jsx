import React from 'react';
import { IMAGE_BASE_URL } from '../../../../../const';
import DocumentMeta from 'react-document-meta';
import LabelingApp from '../../../../../components/LabelUtilsComponents/LabelingApp/index';
import { message } from 'antd';
import { getNextData, getAnnotations, submitDetail } from '../../service';
import { connect } from 'umi';
import { getPageQuery } from '@/utils/utils';
import { history } from 'umi';
import { PageLoading } from '@ant-design/pro-layout';

const projectId = getPageQuery().projectId;
const dataSetId = getPageQuery().dataSetId;
const taskId = getPageQuery().taskId;

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
      isOCR: false
    };
  }

  async componentDidMount() {
    const { dispatch, global } = this.props;
    const { labels, l_projectId, l_datasetId } = global.Labels;
    dispatch({
      type: 'global/changeLayoutCollapsed',
      payload: {
        collapsed: false
      }
    });
    if (!(labels && labels.length && l_projectId == projectId && l_datasetId == dataSetId)) {
      await dispatch({
        type: 'global/getLabels',
        payload: {
          projectId, dataSetId
        }
      });
    }
    this.getData();
  }

  // componentDidUpdate(prevProps) {
  //   if (prevProps.match.params.taskId !== this.props.match.params.taskId) {
  //     this.refetch();
  //   }
  // }

  getNext = async (prev) => {
    const taskId = prev;
    const res = await getNextData(projectId, dataSetId, taskId);
    const { successful, data } = res;
    if (successful === 'true') {
     history.push(
        `/image_label/project/dataSet/taskList/detail?projectId=${projectId}&dataSetId=${dataSetId}&taskId=${data.next.id}`
      );
    }
  }

  getData = async () => {
    const { labels } = this.props.global.Labels;
    let _this = this;
    const res = await getAnnotations(projectId, dataSetId, taskId);
    const { successful, annotations, msg } = res;

    if (successful === 'true') {
      let _project = [], formParts = {}, imageInfo = {};
      if (annotations) {
        imageInfo = annotations.images || {};
        let ann = annotations.annotations || [];

        ann.map((one, index) => {
          const { category_id, segmentation, bbox, text } = one;
          this.setState({ isOCR: text !== undefined });
          let a = category_id, points = [], obj = { id: index.toString(), type: "polygon", points };
          if (text) obj.popupText = text;
          if (segmentation && segmentation.length && segmentation[0].length) {
            segmentation.forEach(element => {
              for (var i = 0, len = element.length; i < len; i = i + 2) {
                obj.points.push({ "lng": element[i], "lat": element[i + 1] });
              }
              if (!formParts.hasOwnProperty(a)) {
                formParts[a] = [obj];
              } else {
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
          // externalLink: null, id: 4, labeld: 1, lastEdited: 1575603884857,s
          link: IMAGE_BASE_URL + dataSetId + '/images/' + taskId + '.jpg',
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

  async fetch(...args) {
    return await fetch(...args);
  }

  refetch = async () => {
    this.setState({
      isLoaded: false,
      error: null,
      project: null,
      image: null
    });

    try {
      if (!taskId) {
        history.replace(`/taskList/${dataSetId}`);
        return;
      }
      history.replace(`/taskDetail/${dataSetId}/${taskId}`);
      this.getData();
    } catch (error) {
      this.setState({
        isLoaded: true,
        error,
      });
    }
  }

  markComplete = async () => {
    const res = await submitDetail(projectId, dataSetId, taskId, this.tansformToCocoFormat());
    res.success && this.getNext(taskId);
  }

  tansformToCocoFormat() {
    const { imageInfo, image, isOCR } = this.state;
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
    const { project, image, isOCR, loading } = this.state;
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
          `/image_label/project/dataSet/taskList?projectId=${projectId}&dataSetId=${dataSetId}`
        )
      },
      onLabelChange: this.pushUpdate,
      isDetail: true
    };

    if (loading) return (<PageLoading />)

    return (
      <div>
        <DocumentMeta title={title}>
          <LabelingApp
            labels={project.form.formParts}
            // reference={{ referenceLink, referenceText }}
            labelData={image.labelData.labels || {}}
            imageUrl={image.link}
            fetch={this.fetch.bind(this)}
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