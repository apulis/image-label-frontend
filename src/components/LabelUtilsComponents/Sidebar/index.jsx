import React, { PureComponent } from 'react';
import { Tree, Button, Select } from 'antd';
import { shortcuts, colors } from '../utils';
import Hotkeys from 'react-hot-keys';
import styles from './index.less';
import { message } from 'antd';
import { connect } from 'umi';
import { DeleteOutlined, EyeOutlined, EyeInvisibleOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons';

const { TreeNode } = Tree;
const { Option } = Select;

@connect(({ global }) => ({ global }))
class Sidebar extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expandedKeys: props.global.Labels.labels.map(i => i.id.toString()),
      selectType: undefined
    };
    this.canvasRef = React.createRef();
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.labels.length !== prevState.expandedKeys.length) {
      return {
        expandedKeys: nextProps.labels.map(i => i.id.toString())
      }
    } else {
      return null;
    }
  }

  addLabel = async () => {
    const { project, chnageState, labels, global } = this.props;
    const { selectType, expandedKeys } = this.state;
    const { id, type, name } = global.Labels.labels.find(i => i.id == selectType);
    if (labels.find(f => Number(f.id) === Number(id))) {
      message.warn('已存在此类 category');
      return;
    }
    let newProject = project;
    newProject.form.formParts.push({ id: id, type: type, name: name });
    chnageState('labels', newProject);
  }

  getTreeChildren = (fId, name) => {
      const { toggles } = this.props;
      if (toggles && Object.keys(toggles).length && toggles[fId]) {
        return toggles[fId].children.map((item, i) => {
          const { id, type, show } = item;
          return (
            <TreeNode selectable key={`${fId}-${i}`}
              title={(
                <React.Fragment>
                  <span className={styles.childName}>{name}{i+1}</span>
                  <span className={styles.iconWrap}>
                    {/* {iconType ? (
                      <Icon type={iconType} onClick={() => console.log('3333')}/>
                    ) : null} */}
                    {show ? <EyeOutlined onClick={e => this.onIconClick(e, 1, fId, i)} /> : <EyeInvisibleOutlined onClick={e => this.onIconClick(e, 1, fId, i)} />}
                    <DeleteOutlined onClick={e => this.onIconClick(e, 0, fId, i)} />
                  </span>
                </React.Fragment>
              )}
            />
          )})
      } else {
        return null;
      }
  }

  onIconClick = (e, type, fId, index, isAll) => {
    const { onToggle, deleteEvent, onSelect, chnageLabelAppState } = this.props;
    e.stopPropagation();
    chnageLabelAppState('selectedTreeKey', index === undefined ? [`${fId}`] : [`${fId}-${index}`]);
    if (type) {
      type == 1 ? onToggle(fId, index, isAll) : onSelect(fId);
    } else {
      deleteEvent(fId, index);
    }
  }

  getTreeNode = (label) => {
    const { name, id, type } = label;
    const { toggles } = this.props;
    const allShow = toggles[id] && toggles[id].allShow;
    return (
      <TreeNode key={id} key={id}
        title={(
          <div>
            <span className="textEllipsis tree_max_width">{name}({type})</span>
            <div className={styles.NodeIconWrap}>
              {allShow ? <EyeOutlined onClick={e => this.onIconClick(e, 1, id, undefined, true)} /> : <EyeInvisibleOutlined onClick={e => this.onIconClick(e, 1, id, undefined, true)} />}
              <DeleteOutlined onClick={e => this.onIconClick(e, 0, id, undefined)} />
              <PlusOutlined onClick={e => this.onIconClick(e, 2, id)} />
            </div>
          </div>
        )} >
        {this.getTreeChildren(id, name)}
      </TreeNode>
    );
  } 

  onSelectNode = (key) => {
    const { chnageLabelAppState, changCanvasState } = this.props;
    chnageLabelAppState('selectedTreeKey', key);
    if (key.length) {
      chnageLabelAppState('selectedFigureId', key[0].split('-')[1], true);
      changCanvasState('selectedFigureId', key[0].split('-')[1]);
    }
  }

  getSelectTypeChildren = () => {
    const { labels } = this.props.global.Labels;
    if (labels.length) {
      return labels.map(i => (<Option key={i.id} value={i.id}>{i.name}</Option>));
    } else {
      return null;
    }
  }

  render() {
    const {
      title,
      labels,
      toggles,
      onToggle,
      toggleHotKeys,
      onBack,
      onBackTasks,
      onSkip,
      onSubmit,
      selectedTreeKey,
      chnageLabelAppState
    } = this.props;
    const { expandedKeys, selectType }= this.state;
    return (
      <div className={styles.sidebarWrap}>
        <h2>
          {title}
          {toggleHotKeys ? (<TableOutlined onClick={toggleHotKeys} />) : null}
        </h2>
        <div className={styles.slectWrap}>
          <Select
            placeholder="请选择类别"
            value={selectType}
            onChange={v => this.setState({ selectType: v })}
          >
            {this.getSelectTypeChildren()}
          </Select>
          <Button onClick={this.addLabel} type="primary">新增</Button>
        </div>
        {toggles && Object.keys(toggles).length > 0 && 
        <Tree
          showLine
          onSelect={this.onSelectNode}
          expandedKeys={expandedKeys}
          selectedKeys={selectedTreeKey}
          onExpand={(k) => this.setState({ expandedKeys: k })}
        >
          {labels.map((label, i) => label && this.getTreeNode(label))}
          {/* <Hotkeys keyName="esc" onKeyDown={() => onSelect(null)} /> */}
        </Tree>}
        <div className={styles.btnWrap}>
          <div>
            <Button onClick={onBack}>上一张</Button>
            <Button type="primary" onClick={onSkip}>下一张</Button>
          </div>
          <Button onClick={onBackTasks}>返回列表</Button>
          <Button type="primary" onClick={onSubmit}>提交</Button>
        </div>
      </div>
    );
  }
}

export default Sidebar;