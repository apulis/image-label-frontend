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
    const { labels, labelData, figures } = this.props;
    const { isOCR, selectedFigureId } = this.state;
    let toggles = {}, selectedFigure = null, allFigures = [];
    labels.forEach(label => {
      const { id, type } = label;
      let children = [];
      children = labelData[id].map(item => ({ ...item, show: true }));
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
    const { labels, labelData, figures } = this.props;
    const { isOCR, selectedFigureId } = this.state;
    let selectedFigure = null, allFigures = [];
    labels.forEach(label => {
      const { id, type } = label;
      figures[id] && figures[id].forEach((figure, i) => {
        if (toggles[id]) {
          const { children, allShow } = toggles[id];
          if ((allShow && children[i].show) && (type === 'bbox' || type === 'polygon')) {
            const { points, type, tracingOptions, popupText } = figure;
            let obj = {
              color: colors[i],
              points: points,
              id: figure.id,
              type: type,
              fId: id,
              tracingOptions: tracingOptions
            }
            if (isOCR) obj.popupText = popupText;
            allFigures.push(obj);
            if (figure.id === selectedFigureId) {
              selectedFigure = { ...figure, color: colors[i] };
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

  handleSelected = (v) => {
    const val = v.toString();
    const { selected, popupShow, toggles } = this.state;
    const { pushState, labels, figures, chnageHOCState } = this.props;
    let newF = cloneDeep(figures), newT = cloneDeep(toggles);
    if (Object.keys(figures).indexOf(val) == -1) {
      newF[val] = [];
      chnageHOCState('figures', newF);
    }
    if (Object.keys(toggles).indexOf(val) == -1) {
      newT[val] = { allShow: true, children: [] };
    } else {
      newT[val].allShow = true;
      // newT[val].children.push({
      //   id: genId(),
      //   type: figures[val][0].type,
      //   points: [],
      //   show: true
      // })
    }
    if (popupShow) return;
    if (!val || val === selected) {
      pushState(
        state => ({ unfinishedFigure: null }), () => this.setState({ selected: null })
      );
      return;
    }
    const idx = labels.findIndex(i => i.id == val)
    const { type, id } = labels.find(i => i.id == val);
    pushState(
      state => ({
        unfinishedFigure: {
          id,
          color: colors[idx],
          type,
          points: [],
        },
      }),
      () => this.setState({ selected: val })
    );
    this.setState({ toggles: newT })
  }

  handleSelectionChange = (figureId, selectedFigureData) => {
    const { labels, isOCR } = this.props;
    const { popupText } = this.state;
    if (figureId) {
      const { color, fId } = selectedFigureData;
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
      this.setState({ selectedFigureId: figureId });
    } else {
      this.setState({
        reassigning: { status: false, type: null },
        selectedFigureId: null,
      });
    }
  }

  handleChange = (eventType, figure, newLabelId) => {
    const { color, id, type, points, fId } = figure;
    const { labels, figures, pushState, isOCR } = this.props;
    const label = labels[labels.findIndex(i => i.id == id)];
    this.setState({ eventType });
    switch (eventType) {
      case 'new':
        const obj = {
          id: genId(),
          type: type,
          points: points,
          show: true
        }
        pushState(state => ({
          figures: update(state.figures, {
            [this.state.selected]: {
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
          const { selected } = this.state;
          let toggles = cloneDeep(this.state.toggles);
          toggles[selected].children.push(obj);
          this.getAllFigures(toggles);
          this.setState({ selected: null, toggles, selectedTreeKey: [] });
          this.canvasRef.current.changeState('selectedFigureId', null);
        });
        break;

      case 'replace':
        this.replaceEvent(fId, id, figure);
        let toggles = cloneDeep(this.state.toggles);
        toggles[fId].children.splice(id, 1, { ...toggles[fId].children[id], points: points });
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
    const { label, figure } = popupChangeData;
    const { id } = label;
    const idx = (figures[id] || []).findIndex(f => f.id === figure.id);
    if (clickType == 1) {
      if (!text) {
        message.confirm('请输入标注文本！');
        return;
      }
      if ((text !== popupText && eventType === 'replace') || eventType === 'new') {
        this.setState({ popupText: text }, () => {
          this.replaceEvent(id, idx, figure);
        });
      } 
    } else if (!clickType) {
      this.deleteEvent(id, idx);
      this.setState({ popupText: '' });
    }
    this.setState({
      popupPoint: {},
      popupShow: false,
      popupChangeData: {}
    });
  }

  replaceEvent = (_id, idx, figure, text) => {
    const { id, type, points } = figure;
    const { pushState, height, width, imageData, isOCR } = this.props;
    const { popupText } = this.state;
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
        id: id,
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
          this.setState({ toggles });
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
      const { labels, figures, chnageState } = this.props;
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
  }

  render() {
    const {
      labels,
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
      figures
    } = this.props;
    const { hotkeysPanel, popupPoint, popupShow, popupText, allFigures, selectedFigureId, selectedTreeKey } = this.state;
    const forwardedProps = {
      onBack,
      onBackTasks,
      onSkip,
      onSubmit,
      models,
      makePrediction
    };
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
