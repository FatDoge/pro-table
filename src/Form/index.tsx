import React, { useState, useEffect } from 'react';
import { Form, Input, Row, Col, TimePicker, InputNumber, DatePicker, Select, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import moment, { Moment } from 'moment';
import RcResizeObserver from 'rc-resize-observer';
import { ConfigConsumer, ConfigConsumerProps } from 'antd/lib/config-provider';
import Container from '../container';
import { ProColumns } from '../index';
import './index.less';

interface FormItem<T> {
  onSubmit?: (value: T) => void;
  onReset?: () => void;
  momentFormat?: 'string' | 'number' | false;
}

const FromInputRender: React.FC<{
  item: ProColumns<any>;
  value?: any;
  onChange?: (value: any) => void;
}> = React.forwardRef(({ item, ...rest }, ref: any) => {
  /**
   * 自定义 render
   */
  if (item.renderFormItem) {
    return item.renderFormItem(item, rest) as any;
  }
  if (!item.valueType || item.valueType === 'text') {
    const { valueEnum } = item;
    if (valueEnum) {
      return (
        <Select placeholder="请选择" ref={ref} {...rest}>
          {Object.keys(valueEnum).map(key => (
            <Select.Option key={key} value={key}>
              {valueEnum[key] || ''}
            </Select.Option>
          ))}
        </Select>
      );
    }
    return <Input placeholder="请输入" {...rest} />;
  }
  if (item.valueType === 'date') {
    return (
      <DatePicker
        ref={ref}
        placeholder="请选择"
        style={{
          width: '100%',
        }}
        {...rest}
      />
    );
  }
  if (item.valueType === 'dateTime') {
    return (
      <DatePicker
        showTime
        ref={ref}
        placeholder="请选择"
        style={{
          width: '100%',
        }}
        {...rest}
      />
    );
  }
  if (item.valueType === 'time') {
    return (
      <TimePicker
        ref={ref}
        placeholder="请选择"
        style={{
          width: '100%',
        }}
        {...rest}
      />
    );
  }
  if (item.valueType === 'money') {
    return (
      <InputNumber
        ref={ref}
        min={0}
        formatter={value => {
          if (value) {
            return `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
          }
          return '';
        }}
        parser={value => (value ? value.replace(/\$\s?|(,*)/g, '') : '')}
        placeholder="请输入"
        precision={2}
        style={{
          width: '100%',
        }}
        {...rest}
      />
    );
  }

  return undefined;
});

const momentFormatMap = {
  time: 'HH:mm:SS',
  date: 'YYYY-MM-DD',
  dateTime: 'YYYY-MM-DD HH:mm:SS',
};

const genValue = (value: any, momentFormat?: string | boolean, proColumnsMap?: any) => {
  const tmpValue = {};
  Object.keys(value).forEach(key => {
    const itemValue = value[key];
    if (itemValue && itemValue !== 'all') {
      if (moment.isMoment(itemValue) && momentFormat) {
        if (momentFormat === 'string') {
          const formatString =
            momentFormatMap[(proColumnsMap[key || 'null'] || {}).valueType || 'dateTime'];
          tmpValue[key] = (itemValue as Moment).format(formatString || 'YYYY-MM-DD HH:mm:SS');
          return;
        }
        if (momentFormat === 'number') {
          tmpValue[key] = (itemValue as Moment).valueOf();
          return;
        }
      }
      tmpValue[key] = itemValue;
    }
  });
  return tmpValue;
};

const FormSearch = <T, U = {}>({ onSubmit, momentFormat = 'string' }: FormItem<T>) => {
  const [form] = Form.useForm();
  const counter = Container.useContainer();
  const [collapse, setCollapse] = useState<boolean>(true);
  const [proColumnsMap, setProColumnsMap] = useState<{
    [key: string]: ProColumns<any>;
  }>({});
  const [formHeight, setFormHeight] = useState<number>(88);

  const submit = () => {
    const value = form.getFieldsValue();
    if (onSubmit) {
      onSubmit(genValue(value, momentFormat, proColumnsMap) as T);
    }
  };

  useEffect(() => {
    const tempMap = {};
    counter.proColumns.forEach(item => {
      const columnsKey = item.key || item.dataIndex || 'null';
      tempMap[columnsKey] = item;
    });
    setProColumnsMap(tempMap);
  }, [JSON.stringify(counter.proColumns)]);

  const domList = counter.proColumns
    .filter(
      item =>
        item.valueType !== 'index' &&
        item.valueType !== 'indexBorder' &&
        item.valueType !== 'option' &&
        !item.hideInSearch &&
        (item.key || item.dataIndex),
    )
    .filter((_, index) => (collapse ? index < 2 : true))
    .map(item => (
      <Col span={8} key={item.key || item.dataIndex}>
        <Form.Item label={item.title} name={item.key || item.dataIndex}>
          <FromInputRender item={item} />
        </Form.Item>
      </Col>
    ));
  return (
    <ConfigConsumer>
      {({ getPrefixCls }: ConfigConsumerProps) => {
        const className = getPrefixCls('pro-table-form-search');
        return (
          <div
            className={className}
            style={{
              height: formHeight,
            }}
          >
            <RcResizeObserver onResize={({ height }) => setFormHeight(height + 24)}>
              <div>
                <Form form={form}>
                  <Row gutter={16} justify="end">
                    {domList}
                    <Col
                      span={8}
                      offset={(2 - (domList.length % 3)) * 8}
                      key="option"
                      className={`${className}-option`}
                    >
                      <Button type="primary" htmlType="submit" onClick={() => submit()}>
                        搜索
                      </Button>
                      <Button
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                          form.resetFields();
                          submit();
                        }}
                      >
                        重置
                      </Button>
                      <a
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                          setCollapse(!collapse);
                        }}
                      >
                        {collapse ? '展开' : '收起'}{' '}
                        <DownOutlined
                          style={{
                            transition: '0.3s all',
                            transform: `rotate(${collapse ? 0 : 0.5}turn)`,
                          }}
                        />
                      </a>
                    </Col>
                  </Row>
                </Form>
              </div>
            </RcResizeObserver>
          </div>
        );
      }}
    </ConfigConsumer>
  );
};

export default FormSearch;
