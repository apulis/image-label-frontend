export default [
  {
    path: '/',
    component: '../layouts/SecurityLayout',
    routes: [
      {
        path: '/user',
        component: '../layouts/UserLayout',
        routes: [
          {
            path: '/user',
            redirect: '/user/login',          
          },
          {
            name: 'login',
            icon: 'smile',
            path: '/user/login',
            component: './user/login',
          },
          {
            component: '404',
          },
        ],
      },
      {
        path: '/',
        component: '../layouts/BasicLayout',
        Routes: ['src/pages/Authorized'],
        authority: ['admin', 'user'],
        routes: [
          { 
            path: '/project',
            name: 'project',
            icon: 'AppstoreOutlined',
            routes: [
              {
                name: 'myProject',
                icon: 'ReadOutlined',
                path: '/project',
                component: './project/myProject',
              },
              {
                name: 'dataSetList',
                path: '/project/dataSetList',
                component: './project/myProject/dataSet',
                hideInMenu: true
              },
              {
                name: 'taskList',
                path: '/project/dataSet/taskList',
                component: './project/myProject/task',
                hideInMenu: true
              },
              {
                name: 'detail',
                path: '/project/dataSet/taskList/detail/:taskId',
                component: './project/myProject/task/detail',
                hideInMenu: true
              }
            ],
          },
          {
            path: '/',
            redirect: '/project',
          },
          {
            component: '404',
          },
        ],
      },
    ],
  },
]