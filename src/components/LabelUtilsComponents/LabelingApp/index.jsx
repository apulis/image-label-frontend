import React, { Component } from 'react';
import Hotkeys from 'react-hot-keys';
import update from 'immutability-helper';
import 'semantic-ui-css/semantic.min.css';
import Canvas from '../Canvas/index';
import HotkeysPanel from '../HotkeysPanel';
import Sidebar from '../Sidebar/index';
import { PathToolbar, MakePredictionToolbar } from '../CanvasToolbar';
import styles from './index.less';
import { genId, colors } from '../utils';
import { computeTrace } from '../tracing';
import { withHistory, withLoadImageData, withPredictions } from '../index';
import { message, Modal } from "antd";
import { cloneDeep } from "lodash";

const { confirm } = Modal;

class LabelingApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: null,
      toggles: {},
      selectedFigureId: null,
      reassigning: { status: false, type: null },
      hotkeysPanel: false,
      popupPoint: {},
      popupShow: false,
      popupChangeData: {},
      popupText: '',
      eventType: '',
      selectedFigure: {
        type: '',
        tracingOptions: {}
      },
      allFigures: [],
      selectedTreeKey: []
    };
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    const { labelData, figures, project } = this.props;
    const { selectedFigureId } = this.state;
    const labels = project.form.formParts;
    let toggles = {}, selectedFigure = null, allFigures = [];
    labels.forEach(label => {
      const { id, type } = label;
      let children = [];
      children = labelData[id].map(item => ({ ...item, id: `${id}-${item.id}`, show: true }));
      toggles[id] = {
        allShow: true, 
        children: children
      }
      if (!figures.hasOwnProperty(id)) {
        figures[id] = []
      }
    });
    this.getAllFigures(toggles);
    this.setState({ toggles });
  }

  getAllFigures = (toggles) => {
    const { project, labelData, figures, isOCR } = this.props;
    const labels = project.form.formParts;
    const { selectedFigureId } = this.state;
    let selectedFigure = null, allFigures = [];
    labels.forEach(label => {
      const { id, type } = label;
      figures[id] && figures[id].forEach((figure, i) => {
        if (toggles[id]) {
          const { children, allShow } = toggles[id];
          if ((allShow && children[i] && children[i].show) && (type === 'bbox' || type === 'polygon')) {
            const { points, type, tracingOptions, popupText } = figure;
            let obj = {
              color: colors[i],
              points: points,
              id: `${id}-${figure.id}`,
              type: type,
              fId: id,
              tracingOptions: tracingOptions
            }
            if (isOCR) obj.popupText = popupText;
            allFigures.push(obj);
            if (`${id}-${figure.id}` === selectedFigureId) {
              selectedFigure = { ...figure, id: `${id}-${figure.id}`, color: colors[i] };
            }
          }
        }
      });
    });
    figures.__temp.forEach(figure => {
      allFigures.push({
        color: 'gray',
        ...figure,
      });
    });
    this.setState({ selectedFigure, allFigures });
  }

  handleSelected = v => {
    const val = v.toString();
    const { selected, popupShow, toggles } = this.state;
    const { pushState, project, figures, chnageHOCState } = this.props;
    const labels = project.form.formParts;
    const idx = labels.findIndex(i => i.id == val);
    let newF = cloneDeep(figures), newT = cloneDeep(toggles),
        child = {
          id: `${val}-0`,
          points: [],
          show: true,
          color: colors[idx]
        }
    if (Object.keys(figures).indexOf(val) === -1) {
      newF[val] = [];
      chnageHOCState('figures', newF);
    }
    if (Object.keys(toggles).indexOf(val) === -1) {
      child.type = labels.find(i => i.id === v).type;
      newT[val] = { allShow: true, children: [child] };
    } else {
      newT[val].allShow = true;
      child.type = figures[val][0].type;
      if (newT[val].children) {
        let temp = newT[val].children, len = temp.length;
        let _id = Number(temp[len - 1].id.split('-')[1]) + 1;
        child.id = `${val}-${_id}`;
        newT[val].children.push(child);
      } else {
        newT[val].children = [child];
      }
    }
    if (popupShow) return;
    if (!val || val === selected) {
      pushState(
        state => ({ unfinishedFigure: null }), () => this.setState({ selected: null })
      );
      return;
    }
    const { type, id } = labels.find(i => i.id == val);
    pushState(
      state => ({
        unfinishedFigure: {
          id,
          color: colors[idx],
          type,
          points: [],
        },
      })
    );
    const { changeState, state } = this.siderBarChild;
    let keys = state.expandedKeys;
    keys.push(val);
    changeState('expandedKeys', Array.from(new Set(keys)));
    this.setState({ toggles: newT, selectedTreeKey: [child.id] });
  }

  handleSelectionChange = (figureId, selectedFigureData) => {
    const { project, isOCR, pushState } = this.props;
    const labels = project.form.formParts;
    const { popupText } = this.state;

    if (figureId && selectedFigureData) {
      const { fId } = selectedFigureData;
      if (isOCR) {
        this.canvasRef.current.changeState('text', selectedFigureData.popupText || popupText);
        this.setState({
          popupShow: true,
          popupPoint: selectedFigureData.points[0],
          popupText: selectedFigureData.popupText || popupText,
          popupChangeData: {
            figure: selectedFigureData,
            label: labels[fId]
          },
          eventType: 'replace'
        });
      }
      this.setState({ selectedFigureId: `${figureId}` });
    } else {
      this.setState({
        reassigning: { status: false, type: null },
        selectedFigureId: null,
      });
    }
  }

  handleChange = (eventType, figure, newLabelId) => {
    const { color, id, type, points, fId } = figure;
    const { project, figures, pushState, isOCR } = this.props;
    const labels = project.form.formParts;
    const label = labels[labels.findIndex(i => i.id == id)];
    this.setState({ eventType });
    let childId = 0;
    if (figures[id] && figures[id].length) {
      let temp = figures[id], len = figures[id].length;
      childId = Number(temp[len - 1].id) + 1;
    }
    switch (eventType) {
      case 'new':
        const obj = {
          id: childId.toString(),
          type: type,
          points: points,
          show: true
        }
        pushState(state => ({
          figures: update(state.figures, {
            [id]: {
              $push: [obj],   
            },
          }),
          unfinishedFigure: null,
        }), () => {
          if (isOCR) {
            const newFigures = this.props.figures[id];
            this.canvasRef.current.changeState('text', null);
            this.setState({
              popupPoint: points[0],
              popupShow: true,
              popupChangeData: {
                figure: newFigures[newFigures.length - 1],
                label
              },
              popupText: null
            });
          }
          this.getAllFigures(this.state.toggles);
          this.setState({ selected: null, selectedTreeKey: [] });
          this.canvasRef.current.changeState('selectedFigureId', null);
        });
        break;

      case 'replace':
        this.replaceEvent(fId, id.split('-')[1], figure);
        let toggles = cloneDeep(this.state.toggles);
        toggles[fId].children.splice(id.split('-')[1], 1, { ...toggles[fId].children[id.split('-')[1]], points: points });
        this.getAllFigures(toggles);
        this.setState({
          toggles,
          selected: null,
          popupPoint: isOCR ? points[0] : {},
          popupChangeData: isOCR ? { figure, label } : {}
        });
        this.canvasRef.current.changeState('selectedFigureId', null);
        break;

      case 'delete':
        this.deleteEvent(fId, id);
        break;

      case 'unfinished':
        pushState(state => ({ unfinishedFigure: figure }), () => {
          const { unfinishedFigure } = this.props;
          const { type, points } = unfinishedFigure;
          if (type === 'bbox' && points.length >= 2) {
            this.handleChange('new', unfinishedFigure);
          }
        });
        break;

      case 'recolor':
        if (id === newLabelId) return;
        const { tracingOptions } = figure;
        pushState(state => ({
          figures: update(state.figures, {
            [id]: {
              $splice: [[id, 1]],
            },
            [newLabelId]: {
              $push: [
                {
                  id: id,
                  points: points,
                  type: type,
                  tracingOptions: tracingOptions,
                },
              ],
            },
          }),
        }));
        break;

      default:
        throw new Error('unknown event type ' + eventType);
    }
  }

  onPopupChange = (clickType, text) => {
    const { popupText, popupChangeData, eventType } = this.state;
    const { figures } = this.props;
    const { figure } = popupChangeData;
    const { fId, id } = figure;
    const idx = id.split('-')[1];
    if (clickType == 1) {
      if (!text) {
        message.confirm('请输入标注文本！');
        return;
      }
      if ((text !== popupText && eventType === 'replace') || eventType === 'new') {
        this.setState({ popupText: text }, () => {
          this.replaceEvent(fId, idx, figure);
        });
      } 
    } else if (!clickType) {
      this.deleteEvent(fId, idx);
      this.setState({
        popupPoint: {},
        popupShow: false,
        popupChangeData: {},
        popupText: ''
      });
    }
  }

  replaceEvent = (_id, idx, figure, text) => {
    const { id, type, points } = figure;
    const { pushState, height, width, imageData, isOCR } = this.props;
    const { popupText, toggles } = this.state;
    pushState(state => {
      let { tracingOptions } = figure;
      if (tracingOptions && tracingOptions.enabled) {
        const imageInfo = {
          height,
          width,
          imageData,
        };
        tracingOptions = {
          ...tracingOptions,
          trace: computeTrace(points, imageInfo, tracingOptions),
        };
      } else {
        tracingOptions = { ...tracingOptions, trace: [] };
      }
      let obj = {
        id: idx,
        type: type,
        points: points,
        tracingOptions
      }
      if (isOCR) obj.popupText = popupText;
      return {
        figures: update(state.figures, {
          [_id]: {
            $splice: [[idx, 1, obj]],
          },
        }),
      };
    }, () => {
      this.setState({
        popupPoint: {},
        popupShow: false,
        popupChangeData: {},
        selectedFigureId: null,
        selectedTreeKey: []
      });
      this.canvasRef.current.changeState('selectedFigureId', null);
      this.getAllFigures(toggles);
    });
  }

  deleteEvent = (fId, idx) => {
    confirm({
      content: `你确定要删除${idx === undefined ? '该类所有' : '该'}标注吗？`,
      okText: "确定",
      okType: 'danger',
      cancelText: "取消",
      onOk: () => {
        const { pushState } = this.props;
        pushState(state => ({
          figures: idx === undefined ?
            update(state.figures, {
              $unset: [fId]
            }) :
            update(state.figures, {
              [fId]: {
                $splice: [[idx, 1]],
              },
            })
        }),() => {
          const { figures } = this.props;
          const _figures = Object.keys(figures);
          _figures && _figures.length && _figures.forEach(i => {
            if (!figures[i].length && i !== '__temp') {
              this.removeEmptyLabels(i);
            }
          });
          if (idx === undefined) this.removeEmptyLabels(fId);
          let toggles = cloneDeep(this.state.toggles);
          idx === undefined ? delete toggles[fId] : toggles[fId].children.splice(idx, 1);
          this.setState({ toggles, selectedFigureId: null, selectedTreeKey: [] });
          this.getAllFigures(toggles);
        }); 
      },
      onCancel() {}
    });
  }

  removeEmptyLabels = (id) => {
    const { pushState } = this.props;
    pushState(state => ({
      figures: update(state.figures, {
          $unset: [id]
        })
    }),() => {
      const { project, figures, chnageState } = this.props;
      const labels = project.form.formParts;

      let _labels = cloneDeep(labels);
      labels.forEach((item, i) => {
        if (Object.keys(figures).indexOf(item.id.toString()) == -1) delete _labels[i];
      });
      chnageState('project', { form: { formParts: [...new Set(_labels)].filter(Boolean) }});
    })
  }

  getToolBarDOM = () => {
    const { selectedFigure } = this.state;
    const { models, makePrediction } = this.props;
    let toolbarDOM = null;
    const toolbarStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: 99,
    };
    if (selectedFigure && selectedFigure.type === 'polygon') {
      const options = selectedFigure.tracingOptions || {
        enabled: false,
        smoothing: 0.3,
        precision: 0,
        trace: [],
      };
      const handler = (property, value) => {
        this.handleChange(
          'replace',
          update( {
            tracingOptions: {
              $set: update(options, { [property]: { $set: value } }),
            },
          })
        );
      };
      toolbarDOM = (
        <PathToolbar style={toolbarStyle} onChange={handler} {...options} />
      );
    } else if (!selectedFigure && models.length > 0) {
      toolbarDOM = (
        <MakePredictionToolbar
          style={toolbarStyle}
          models={models}
          generate={async (model, options) => {
            const preds = await makePrediction(model, options);
            if (model.type !== 'object_classification') {
              preds.forEach(f => this.handleChange('new', f));
            }
          }}
        />
      );
    }
    return toolbarDOM;
  }

  getSidebarProps = () => {
    const { reassigning, selected, toggles } = this.state;
    const { figures, pushState } = this.props;
    const sidebarProps = reassigning.status ? 
      {
        title: 'Select the new label',
        selected: null,
        onSelect: selected => {
          const figure = this.canvasRef.current.getSelectedFigure();
          if (figure) {
            this.handleChange('recolor', figure, selected);
          }
          this.setState({ reassigning: { status: false, type: null } });
        },
        filter: label => label.type === reassigning.type,
        labelData: figures,
      } : 
      {
        title: '标注工具',
        selected,
        onSelect: this.handleSelected,
        toggles,
        onToggle: (fId, index, isAll) => {
          let toggles = this.state.toggles;
          if (isAll) {
            toggles[fId].allShow = !toggles[fId].allShow;
            toggles[fId].children.forEach(i => i.show = toggles[fId].allShow);
          } else {
            (toggles[fId].children)[index].show = !(toggles[fId].children)[index].show;
            if ((toggles[fId].children)[index].show) toggles[fId].allShow = true;
          }
          this.getAllFigures(toggles);
          this.setState({ toggles });
        },
        toggleHotKeys: () => {
          this.setState({ hotkeysPanel: !this.state.hotkeysPanel })
        },
        onFormChange: (labelId, newValue) =>
          pushState(state => ({
            figures: update(figures, { [labelId]: { $set: newValue } }),
          })),
        labelData: figures,
      };
      return sidebarProps;
  }

  chnageLabelAppState = (key, val, Rerender) => {
    this.setState({ [key]: val },() => Rerender && this.getAllFigures(this.state.toggles));
  }

  changCanvasState = (key, val) => {
    this.canvasRef.current.changeState(key, val);
    if (!val) {
      this.props.pushState(
        state => ({ unfinishedFigure: null }), () => this.setState({ selected: null })
      );
    }
  }

  onRef = (ref) => {
    this.siderBarChild = ref;
  }

  render() {
    const {
      imageUrl,
      onBack,
      onBackTasks,
      onSkip,
      onSubmit,
      popState,
      unfinishedFigure,
      height,
      width,
      models,
      makePrediction,
      project,
      chnageState,
      isOCR,
      figures,
      btnLoading
    } = this.props;
    const { hotkeysPanel, popupPoint, popupShow, popupText, allFigures, selectedFigureId, selectedTreeKey, toggles } = this.state;
    const forwardedProps = {
      onBack,
      onBackTasks,
      onSkip,
      onSubmit,
      models,
      makePrediction
    };
    const labels = project.form.formParts;
    const hotkeysPanelDOM = hotkeysPanel ? (
      <HotkeysPanel
        labels={labels.map(label => label.name)}
        onClose={() => this.setState({ hotkeysPanel: false })}
      />
    ) : null;

    return (
      <div className={styles.labelappWrap}>
        <div className={styles.contentWrap}>
          <Hotkeys keyName="ctrl+z" onKeyDown={popState}>
            <Sidebar
              labels={labels}
              project={project}
              chnageState={chnageState}
              deleteEvent={this.deleteEvent}
              {...this.getSidebarProps()}
              {...forwardedProps}
              selectedTreeKey={selectedTreeKey}
              chnageLabelAppState={this.chnageLabelAppState}
              changCanvasState={this.changCanvasState}
              btnLoading={btnLoading}
              onRef={this.onRef}
            />
            {hotkeysPanelDOM}
            <div className={styles.flexWrap}>
              <div className={styles.canvasWrap}>
                {/* {this.getToolBarDOM()} */}
                <Canvas
                  url={imageUrl}
                  height={height}
                  width={width}
                  figures={allFigures}
                  unfinishedFigure={unfinishedFigure}
                  onChange={this.handleChange}
                  onReassignment={type =>
                    this.setState({ reassigning: { status: true, type } })
                  }
                  onSelectionChange={this.handleSelectionChange}
                  popup={{popupShow, popupPoint, popupText, onPopupChange: this.onPopupChange}}
                  ref={this.canvasRef}
                  isOCR={isOCR}
                  chnageLabelAppState={this.chnageLabelAppState}
                />
              </div>
            </div>
          </Hotkeys>
        </div>
      </div>
    );
  }
}

export default withLoadImageData(withHistory(withPredictions(LabelingApp)));
