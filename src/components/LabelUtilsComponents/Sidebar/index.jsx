import React, { PureComponent, forwardRef } from 'react';
import { Tree, Button, Select } from 'antd';
import { shortcuts, colors } from '../utils';
import Hotkeys from 'react-hot-keys';
import styles from './index.less';
import { message } from 'antd';
import { connect } from 'umi';
import { DeleteOutlined, EyeOutlined, EyeInvisibleOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons';
import { getPageQuery } from '@/utils/utils';

const { TreeNode } = Tree;
const { Option } = Select;

@connect(({ global }) => ({ global }))
class Sidebar extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expandedKeys: props.labels.map(i => i.id.toString()),
      selectType: undefined
    };
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  // static getDerivedStateFromProps(nextProps, prevState) {
  //   if (nextProps.labels.length !== prevState.expandedKeys.length) {
  //     return {
  //       expandedKeys: nextProps.labels.map(i => i.id.toString())
  //     }
  //   } else {
  //     return null;
  //   }
  // }

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
    chnageState('project', newProject);
  }

  onIconClick = (e, type, fId, index, isAll) => {
    const { onToggle, deleteEvent, onSelect, chnageLabelAppState } = this.props;
    e.stopPropagation();
    index !== undefined && chnageLabelAppState('selectedTreeKey',  [`${fId}-${index}`]);
    if (type) {
      type === 1 ? onToggle(fId, index, isAll) : onSelect(fId);
    } else {
      deleteEvent(fId, index);
    }
  }

  onSelectNode = (key) => {
    const { chnageLabelAppState, changCanvasState, unfinishedFigure, onSelect } = this.props;
    chnageLabelAppState('selectedTreeKey', key);
    chnageLabelAppState('selected', key);
    chnageLabelAppState('selectedFigureId', key.length ? key[0] : null, true);
    changCanvasState('selectedFigureId', key.length ? key[0] : null);
  }

  getSelectTypeChildren = () => {
    const { labels } = this.props.global.Labels;
    if (labels.length) {
      return labels.map(i => (<Option key={i.id} value={i.id}>{i.name}</Option>));
    } else {
      return null;
    }
  }

  getTreeData = () => {
    const { toggles, labels } = this.props;
    return labels.map(item => {
      const { name, id, type } = item;
      const allShow = toggles && toggles[id] && toggles[id].allShow;
      const children = this.getTreeDataChildren(id, name);
      return {
        key: `${id}`,
        title: (
          <React.Fragment>
            <span className="textEllipsis tree_max_width">{name}({type})</span>
            <div className={styles.NodeIconWrap}>
              {allShow ? <EyeOutlined onClick={e => this.onIconClick(e, 1, id, undefined, true)} /> : <EyeInvisibleOutlined onClick={e => this.onIconClick(e, 1, id, undefined, true)} />}
              <DeleteOutlined onClick={e => this.onIconClick(e, 0, id, undefined)} />
              <PlusOutlined onClick={e => this.onIconClick(e, 2, id, undefined)} />
            </div>
          </React.Fragment>
        ),
        children: children,
        selectable: false
      }
    });
  }

  getTreeDataChildren = (fId, name) => {
    const { toggles } = this.props;
    const data = toggles[fId];
    if (toggles && Object.keys(toggles).length && data) {
      return data.children.map((item, i) => {
        const { id, type, show } = item;
        return {
          key: `${id}`,
          title: (
            <React.Fragment>
              <span className={styles.childName}>{name}{i+1}</span>
              <span className={styles.iconWrap}>
                {show ? <EyeOutlined onClick={e => this.onIconClick(e, 1, fId, i)} /> : <EyeInvisibleOutlined onClick={e => this.onIconClick(e, 1, fId, i)} />}
                <DeleteOutlined onClick={e => this.onIconClick(e, 0, fId, i)} />
              </span>
            </React.Fragment>
          ),
          selectable: true,
        }
      })
    }
  }

  changeState = (key, val) => {
    this.setState({ [key]: val });
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
      chnageLabelAppState,
      btnLoading,
      taskId
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
        <Tree
          showLine
          onSelect={this.onSelectNode}
          expandedKeys={expandedKeys}
          selectedKeys={selectedTreeKey}
          onExpand={k => this.setState({ expandedKeys: k })}
          treeData={this.getTreeData()}
        />
        <div className={styles.btnWrap}>
          <div>
            <Button onClick={onBack}>返回</Button>
            <Button type="primary" onClick={onSkip} disabled={getPageQuery().lastId === taskId}>下一张</Button>
          </div>
          <Button onClick={onBackTasks}>返回列表</Button>
          <Button type="primary" onClick={onSubmit} loading={btnLoading}>提交</Button>
        </div>
      </div>
    )
  }
}

export default Sidebar;