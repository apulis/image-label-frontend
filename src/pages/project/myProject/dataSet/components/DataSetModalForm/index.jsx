import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Form, Select, Checkbox, Input, Cascader, message, Button, Radio } from "antd";
import { useSelector } from 'umi';
import { getDataSetDetail, getDatasetsOptions } from '../../../service';
import styles from './index.less';
import { CloseOutlined } from '@ant-design/icons';
import _ from 'lodash';

const { Option } = Select;
const CheckboxGroup = Checkbox.Group;

const DataSetModalForm = (props, ref) => {
  const [form] = Form.useForm();
  const [checkedList, setCheckedList] = useState([]);
  const [selectedCategoryList, setSelectedCategoryList] = useState([]);
  const [oldSelectList, setOldSelectList] = useState([]);
  const [detail, setDetail] = useState({});
  const [plainOptions, setPlainOptions] = useState([]);
  const [sourceOptions, setSourceOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);
  const { cascaderOptions, dataSetId, projectId, type } = props;
  const Labels = useSelector(({ global }) => global.Labels);

  useImperativeHandle(ref, () => ({
    form: form,
    selectedCategoryList: selectedCategoryList,
    sourceOptions: sourceOptions
  }));

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const { dataSetModalType, dataSetId, projectId } = props;
    let plainOptions = [
      {label: '选择已有对象类型', value: 1, disabled: true}, 
      {label: '自定义对象类型', value: 2}
    ]
    if (dataSetModalType == 2 && dataSetId) {
      setLoading(true);
      const res = await getDataSetDetail(projectId, dataSetId);
      const { code, data, msg } = res;
      if (code === 0) {
        const { info } = data;
        setDetail(info);
        setSelectedCategoryList(info.labels);
        setOldSelectList(info.labels);
        setLoading(false);
      }
    } else {
      const res = await getDatasetsOptions({page: 1, count: 999});
      const { data, code, msg } = res;
      if (code === 0) {
        setSourceOptions(data.datasets);
      }
    }
    setCheckedList(dataSetId ? [1] : []);
    setPlainOptions(dataSetId ? plainOptions : plainOptions.splice(1, 1));
  }

  const addNewDataSetCategory = () => {
    form.validateFields(['category1', 'labelType1', 'fatherType']).then(values => {
      const { category1, labelType1, fatherType } = values;
      const isExsisted = selectedCategoryList.find(val => val.name == category1);
      if (isExsisted) {
        message.warning(`已经含有 ${category1}了`);
        return;
      }
      const idArr = selectedCategoryList.length ? selectedCategoryList.map(i => i.id) : [];
      let _selectedCategoryList = _.cloneDeep(selectedCategoryList);
      _selectedCategoryList.push({
        id: idArr.length ? Math.max(...idArr) + 1 : 0,
        name: category1,
        type: labelType1,
        supercategory: fatherType
      });
      setSelectedCategoryList(_selectedCategoryList);
    });
  }

  const onSelectDataSetCategory = () => {
    form.validateFields(['category2', 'labelType2']).then(values => {
      const { category2, labelType2 } = values;
      const isExsisted = selectedCategoryList.find(val => val.id == category2[1]);
      if (isExsisted) {
        message.warning(`已经含有 ${isExsisted.name}了`);
        return;
      }
      let _selectedCategoryList = selectedCategoryList;
      _selectedCategoryList.push({
        id: category2[1],
        name: Labels.labels.find(c => c.id == category2[1]).name,
        type: labelType2,
        supercategory: category2[0]
      });
      setSelectedCategoryList(_selectedCategoryList);
    });
  }
  return (
    <div className={styles.dataSetModalFormWrap}>
      <div className={styles.idWrap}>
        <p>项目 ID：</p><span>{projectId}</span>
        {dataSetId && type === 2 && <div><p>数据集 Id：</p><span>{dataSetId}</span></div>}
      </div>
      {((type === 2 && !loading) || type === 1) && <Form form={form} initialValues={{
        name: detail.name || undefined,
        info: detail.info || undefined,
        type: detail.type || undefined,
        labelType2: 'polygon',
        labelType1: 'polygon',
        isPrivate: detail.isPrivate || isPrivate
      }}>
        <Form.Item label="数据集名称" name="name" 
          rules={[{ required: true, message: '请输入数据集名称！' }]}> 
          <Input placeholder="请输入数据集名称" />
        </Form.Item>
        <Form.Item label="数据集简介" name="info"
          rules={[{ required: true, message: '请输入数据集简介！' }]}>
          <Input.TextArea  placeholder="请输入数据集简介" />
        </Form.Item>
        {type === 1 && <>
          <Form.Item label="数据权限" rules={[{ required: true }]} name="isPrivate">
            <Radio.Group onChange={e => setIsPrivate(e.target.value)}>
              <Radio value={true}>私有</Radio>
              <Radio value={false}>公有</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="数据源" name="sourceId"
            rules={[{ required: true, message: '请选择数据源！' }]}>
            <Select placeholder="请选择数据源">
              {sourceOptions.length > 0 ? sourceOptions.map(i => <Option value={i.id}>{i.name}</Option>) : null}
            </Select>
          </Form.Item>
        </>}
        <Form.Item label="数据集类型" name="type"
          rules={[{ required: true, message: '请选择数据集类型！' }]}>
          <Select placeholder="请选择数据集类型" style={{ width: 180 }}>
            <Option value="image">图片</Option>
            {/* <Option value="video">视频</Option>
            <Option value="text">文字</Option> */}
          </Select>
        </Form.Item>
        {type === 2 &&
        <div className={styles.diyWrap}>
          <Form.Item label="选择对象类型" name="category2" className={styles.speItem}
            rules={[{ required: true, message: '请选择对象类型！' }]}>
              <Cascader
                options={cascaderOptions}
                placeholder="请选择对象类型"
              />
          </Form.Item>
          <Form.Item name="labelType2" className={styles.speItem}
            rules={[{ required: true, message: '请选择' }]}>
            <Select style={{ width: 100 }}>
              <Option value="polygon">polygon</Option>
              <Option value="bbox">bbox</Option>
            </Select>
          </Form.Item>
          <Button onClick={onSelectDataSetCategory}>确定</Button>
        </div>}
        <div style={{ marginBottom: 10 }}>
          <CheckboxGroup options={plainOptions} value={checkedList}
            onChange={ checkedList => setCheckedList(checkedList) }
          />
        </div>
        {checkedList.indexOf(2) > -1 && 
        <div className={styles.diyWrap}>
          <Form.Item label="自定义对象类型" name="fatherType" className={styles.speItem}
            rules={[{ required: true, message: '请填写对象父类型！' }]}>
            <Input style={{ width: 140 }} placeholder="请填写对象父类型" />
          </Form.Item>
          <Form.Item className={styles.speItem} name="category1"
            rules={[{ required: true, message: '请填写对象类型！' }]}>
            <Input style={{ width: 140 }} placeholder="请填写对象类型" />
          </Form.Item>
          <Form.Item className={styles.speItem} name="labelType1"
            rules={[{ required: true, message: '请选择！' }]}>
            <Select style={{ width: 100 }}>
              <Option value="polygon">polygon</Option>
              <Option value="bbox">bbox</Option>
            </Select>
          </Form.Item>
          <Button onClick={addNewDataSetCategory}>确定</Button>
        </div>}
        <ul>
          <p>{type === 2 ? '已有对象类型' : checkedList.indexOf(2) > -1 ? '已自定义对象类型' : ''}</p>
          <ul className={styles.selectedCategory}>
            {selectedCategoryList.map(item => (
              <li key={item.name}>
                <span>{item.name}</span>
                {!oldSelectList.find(i => i.id === item.id) && 
                <CloseOutlined onClick={() => setSelectedCategoryList(selectedCategoryList.filter(val => val.name !== item.name))} />}
              </li>
            ))}
          </ul>
        </ul>
      </Form>}
    </div>
  )
}

export default forwardRef(DataSetModalForm);
