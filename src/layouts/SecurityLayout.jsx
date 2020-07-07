import React from 'react';
import { PageLoading } from '@ant-design/pro-layout';
import { Redirect, connect } from 'umi';
import { stringify } from 'querystring';
import { ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';

class SecurityLayout extends React.Component {
  state = {
    isReady: false,
  };

  componentDidMount() {
    this.setState({
      isReady: true,
    });
    // this.props.dispatch({
    //   type: 'user/fetchCurrent',
    // });
    const { location } = this.props;
    if (location && location.query && location.query.token) {
      localStorage.setItem('token', location.query.token);
    }
  }

  render() {
    const { isReady } = this.state;
    const { children, loading, currentUser } = this.props; // You can replace it to your authentication rule (such as check token exists)
    // 你可以把它替换成你自己的登录认证规则（比如判断 token 是否存在）

    const token = localStorage.token;
    const queryString = stringify({
      redirect: '/image_label/project',
      // redirect: window.location.href,
    });

    if ((!token && loading) || !isReady) {
      return <PageLoading />;
    }

    if (!token && window.location.pathname !== '/image_label/user/login') {
      return <Redirect to={`/image_label/user/login?${queryString}`} />;
    }

    return (
      <ConfigProvider locale={zhCN}>
        {children}
      </ConfigProvider>
    );
  }
}

export default connect(({ user }) => ({
  user
}))(SecurityLayout);