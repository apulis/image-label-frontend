import { WechatOutlined, WindowsOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import React from 'react';
import styles from './style.less';

const { NODE_ENV } = process.env;

const Login = props => {
  const wechatLogin = () => {
    window.location = 'https://open.weixin.qq.com/connect/qrconnect?appid=wx403e175ad2bf1d2d&redirect_uri=https%3A%2F%2Fapulis-test.sigsus1.cn:51443%2Fapi/login/wechat&response_type=code&scope=snsapi_userinfo,snsapi_login&state=' + NODE_ENV;
  }

  const microsoftLogin = () => {
    window.location = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=6d93837b-d8ce-48b9-868a-39a9d843dc57&scope=https%3A%2F%2Fgraph.microsoft.com%2Fuser.read&response_type=code&redirect_uri=https%3A%2F%2Fapulis-test.sigsus1.cn:51443%2Fapi%2Flogin%2Fmicrosoft&state=' + NODE_ENV;
  }

  const handleClick = (e) => {
    e.preventDefault();
    props.history.push('/account/info');
  }

  return (
    <div className={styles.main}>
      <Card title="选择登录方式">
        <div>
          <WechatOutlined />
          <a onClick={wechatLogin}>微信登录</a>
        </div>
        <div>
          <WindowsOutlined />
          <a onClick={microsoftLogin}>微软邮箱登录</a>
        </div>
      </Card>
    </div>
  );
};

export default Login;
