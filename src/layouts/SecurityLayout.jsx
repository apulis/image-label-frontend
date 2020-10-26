import React from 'react';
import { PageLoading } from '@ant-design/pro-layout';
import { Redirect, connect } from 'umi';
import { stringify } from 'querystring';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import LoginPage from '@/pages/exception/401';

class SecurityLayout extends React.Component {
  state = {
    isReady: false,
  };

  collectAuthInfo = () => {
    let token = '', error = '';
    const { location, history } = this.props;
    if (location && location.query && location.query.token) {
      token = location.query.token;
    }
    if (token) {
      localStorage.token = token;
      let redirectPath = location?.pathname;
      const routerBase = window.routerBase;
      if (routerBase.includes(redirectPath) || redirectPath?.includes(routerBase)) {
        history && history.push('/');
      } else {
        history && history.push(location.pathname);
      }
    }
    if (location && location.query && location.query.error) {
      error = location.query.error;
    }
    if (error) {
      message.error(error);
      let redirectPath = location?.pathname;
      const routerBase = window.routerBase;
      if (routerBase.includes(redirectPath) || redirectPath?.includes(routerBase)) {
        history && history.push('/');
      } else {
        history && history.push(location.pathname);
      }
    }
  }

  componentDidMount() {
    this.setState({
      isReady: true,
    });
    this.collectAuthInfo();
  }

  render() {
    const { isReady } = this.state;
    const { children, loading, settings } = this.props;
    const token = localStorage.token;
    if ((loading) || !isReady) {
      return <PageLoading />;
    }

    if (!token) {
      return (
        <LoginPage />
      )
    }
    let language = localStorage.language || localStorage.umi_locale || navigator.language;
    if (!['zh-CN', 'en-US'].includes(language)) {
      language = navigator.language;
    }

    return (
      <ConfigProvider locale={language}>
        {children}
      </ConfigProvider>
    )
  }
}

export default connect(({ user, settings }) => ({
  user, settings
}))(SecurityLayout);