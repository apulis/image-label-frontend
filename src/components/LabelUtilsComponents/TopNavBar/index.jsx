import React, { Component } from 'react'
import { connect } from 'dva'
import { Menu, Col, Row, Dropdown, Icon } from 'antd'
import './index.less'

@connect(({ account, router }) => ({
  account, router
}))
class TopNavBar extends Component {
  
  componentDidMount() {
    const { dispatch } = this.props
    // dispatch({
    //   type: 'account/getUserInfo'
    // })
  }

  toIndexPage = () => {
    this.props.dispatch({
      type: 'router/redirect',
      payload: '/'
    })
  }

  replaceRouter = (path) => {
    this.props.dispatch({
      type: 'router/redirect',
      payload: path
    })
  }

  logout = () => {
    if (localStorage.token) {
      delete localStorage.token
      delete localStorage.userLevel
    }
    
  }



  render() {
    const { account: { userInfo } } = this.props
    const menu = (
      <Menu>
        {
          userInfo && <Menu.Item key="info" onClick={() => this.replaceRouter('/account/info')}>
            个人信息
          </Menu.Item>
        }
        <Menu.Item key="login" onClick={() => this.replaceRouter('/account/login')}>
          {userInfo ? <span onClick={this.logout}>注销</span> : '登录'}
        </Menu.Item>
      </Menu>
    )
    return (
      <header className="header">
        <Row type="flex" align="middle">
          <Col span={20}>
            <img style={{cursor: 'pointer'}} onClick={this.toIndexPage} height="80px" src={require('../../images/apulis1.png')} />
          </Col>
          <Col span={4}>
            <a onClick={this.toIndexPage} className="ant-dropdown-link" style={{marginRight: '20px'}}>
              首页
            </a>
            {
              userInfo && <Dropdown overlay={menu}>
                
                <a className="ant-dropdown-link">
                  账户设置 <Icon type="down" />
                </a>
              </Dropdown>
            }
            
          </Col>
        </Row>
      </header>
    )
  }
}


export default TopNavBar