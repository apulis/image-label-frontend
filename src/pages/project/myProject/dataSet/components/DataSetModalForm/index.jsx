import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Form, Select, Checkbox, Input, Cascader, message, Button, Radio } from "antd";
import { useSelector, formatMessage } from 'umi';
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
      {label: formatMessage({ id: 'dataset.datasetmodalform.haved.object.type' }), value: 1, disabled: true}, 
      {label: formatMessage({ id: 'dataset.datasetmodalform.custom.object.type' }), value: 2}
    ]
    if (dataSetModalType == 2 && dataSetId) {
      setLoading(true);
      const res = await getDataSetDetail(projectId, dataSetId);
      const { code, data, msg } = res;
      if (code === 0) {
        const { info } = data;
        setDetail(info);
        setSelectedCategoryList(info.labels || []);
        setOldSelectList(info.labels || []);
        setLoading(false);
      }
    } else {
      const res = await getDatasetsOptions({ pageNum: 1, pageSize: 99999 });
      const { data, code, msg } = res;
      if (code === 0) {
        setSourceOptions(data.datasets.filter(i => i.isTranslated === false));
      }
    }
    setCheckedList(dataSetId ? [1] : []);
    setPlainOptions(dataSetId ? plainOptions : plainOptions.splice(1, 1));
  }

  const addNewDataSetCategory = () => {
    form.validateFields(['category1', 'labelType1', 'fatherType']).then(values => {
      const { category1, labelType1, fatherType } = values;
      const isExsisted = selectedCategoryList.length && selectedCategoryList.find(val => val.name == category1);
      if (isExsisted) {
        message.warning(`${category1}${formatMessage({ id: 'dataset.datasetmodalform.already.has' })}`);
        return;
      }
      const idArr = selectedCategoryList.length ? selectedCategoryList.map(i => i.id) : [];
      let _selectedCategoryList = _.cloneDeep(selectedCategoryList);
      _selectedCategoryList.push({
        id: idArr.length ? Math.max(...idArr) + 1 : 1,
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
      const isExsisted = selectedCategoryList.length && selectedCategoryList.find(val => val.id == category2[1]);
      if (isExsisted) {
        message.warning(`${isExsisted.name}${formatMessage({ id: 'dataset.datasetmodalform.already.has' })}`);
        return;
      }
      let _selectedCategoryList = selectedCategoryList;
      _selectedCategoryList.push({
        id: category2[1],
        name: Labels.labels.length ? Labels.labels.find(c => c.id == category2[1]).name : '',
        type: labelType2,
        supercategory: category2[0]
      });
      setSelectedCategoryList(_selectedCategoryList);
    });
  }
  return (
    <div className={styles.dataSetModalFormWrap}>
      <div className={styles.idWrap}>
        <p>{formatMessage({ id: 'dataset.datasetmodalform.project.id' })}</p><span>{projectId}</span>
        {dataSetId && type === 2 && <div><p>{formatMessage({ id: 'dataset.datasetmodalform.dataset.id' })}</p><span>{dataSetId}</span></div>}
      </div>
      {((type === 2 && !loading) || type === 1) && <Form form={form} initialValues={{
        name: detail.name || undefined,
        info: detail.info || undefined,
        type: detail.type || undefined,
        labelType2: 'polygon',
        labelType1: 'polygon',
        isPrivate: detail.isPrivate || isPrivate
      }}>
        <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.datasetname.label' })} name="name" 
          rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.datasetname.required' }) }]}> 
          <Input placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.datasetname.placeholder' })} />
        </Form.Item>
        <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.datasetinfo.label' })} name="info"
          rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.datasetinfo.required' }) }]}>
          <Input.TextArea  placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.datasetinfo.placeholder' })} />
        </Form.Item>
        {type === 1 && <>
          <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.data.private.label' })} rules={[{ required: true }]} name="isPrivate">
            <Radio.Group onChange={e => setIsPrivate(e.target.value)}>
              <Radio value={true}>
                {formatMessage({ id: 'dataset.datasetmodalform.form.data.private.radio.1' })}
              </Radio>
              <Radio value={false}>
              {formatMessage({ id: 'dataset.datasetmodalform.form.data.private.radio.2' })}
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.datasource.label' })} name="sourceId"
            rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.datasource.required' }) }]}>
            <Select placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.datasource.placeholder' })}>
              {sourceOptions.length > 0 ? sourceOptions.map(i => <Option value={i.id}>{i.name}</Option>) : null}
            </Select>
          </Form.Item>
        </>}
        <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.dataset.type.label' })} name="type"
          rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.dataset.type.required' }) }]}>
          <Select placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.dataset.type.placeholder' })} style={{ width: 180 }}>
            <Option value="image">
              {formatMessage({ id: 'dataset.datasetmodalform.form.dataset.type.image' })}
            </Option>
            {/* <Option value="video">视频</Option>
            <Option value="text">文字</Option> */}
          </Select>
        </Form.Item>
        {type === 2 &&
        <div className={styles.diyWrap}>
          <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.object.type.label' })} name="category2" className={styles.speItem}
            rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.object.type.required' }) }]}>
              <Cascader
                options={cascaderOptions}
                placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.select.label.type' })}
              />
          </Form.Item>
          <Form.Item name="labelType2" className={styles.speItem}
            rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.select.label.type' }) }]}>
            <Select style={{ width: 100 }}>
              <Option value="polygon">polygon</Option>
              <Option value="bbox">bbox</Option>
            </Select>
          </Form.Item>
          <Button onClick={onSelectDataSetCategory}>
            {formatMessage({ id: 'dataset.datasetmodalform.form.button.confirm' })}
          </Button>
        </div>}
        <div style={{ marginBottom: 10 }}>
          <CheckboxGroup options={plainOptions} value={checkedList}
            onChange={ checkedList => setCheckedList(checkedList) }
          />
        </div>
        {checkedList.indexOf(2) > -1 && 
        <div className={styles.diyWrap}>
          <Form.Item label={formatMessage({ id: 'dataset.datasetmodalform.form.father.label' })} name="fatherType" className={styles.speItem}
            rules={[{ required: true, message: formatMessage({ id: 'dataset.datasetmodalform.form.father.required' }) }]}>
            <Input style={{ width: 140 }} placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.father.placeholder' })} />
          </Form.Item>
          <Form.Item className={styles.speItem} name="category1"
            rules={[{ required: true, message: formatMessage({ id: '' }) }]}>
            <Input style={{ width: 140 }} placeholder={formatMessage({ id: 'dataset.datasetmodalform.form.object.type.placeholder' })} />
          </Form.Item>
          <Form.Item className={styles.speItem} name="labelType1"
            rules={[{ required: true }]}>
            <Select style={{ width: 100 }}>
              <Option value="polygon">polygon</Option>
              <Option value="bbox">bbox</Option>
            </Select>
          </Form.Item>
          <Button onClick={addNewDataSetCategory}>
            {formatMessage({ id: 'dataset.datasetmodalform.form.button.confirm' })}
          </Button>
        </div>}
        <ul>
          <p>{type === 2 ? formatMessage({ id: 'dataset.datasetmodalform.haved.object.type' }) : checkedList.indexOf(2) > -1 ? formatMessage({ id: 'dataset.datasetmodalform.haved.difined.object.type' }) : ''}</p>
          <ul className={styles.selectedCategory}>
            {selectedCategoryList.length > 0 && selectedCategoryList.map(item => (
              <li key={item.name}>
                <span>{item.name}</span>
                {!(oldSelectList.length && oldSelectList.find(i => i.id === item.id)) && 
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
