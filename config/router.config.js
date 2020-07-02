export default [
  {
    path: '/',
    component: '../layouts/SecurityLayout',
    routes: [
      {
        path: '/image_label/user',
        component: '../layouts/UserLayout',
        routes: [
          {
            path: '/image_label/user',
            redirect: '/image_label/user/login',          
          },
          {
            name: 'login',
            icon: 'smile',
            path: '/image_label/user/login',
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
            path: '/image_label/project',
            name: 'Project',
            icon: 'AppstoreOutlined',
            routes: [
              {
                name: 'myProject',
                icon: 'ReadOutlined',
                path: '/image_label/project',
                component: './project/myProject',
              },
              {
                name: 'dataSetList',
                path: '/image_label/project/dataSetList',
                component: './project/myProject/dataSet',
                hideInMenu: true
              },
              {
                name: 'taskList',
                path: '/image_label/project/dataSet/taskList',
                component: './project/myProject/task',
                hideInMenu: true
              },
              {
                name: 'detail',
                path: '/image_label/project/dataSet/taskList/detail',
                component: './project/myProject/task/detail',
                hideInMenu: true
              }
            ],
          },
          // {
          //   name: 'account',
          //   icon: 'user',
          //   path: '/image_label/account',
          //   routes: [
          //     {
          //       name: 'center',
          //       icon: 'smile',
          //       path: '/image_label/account/center',
          //       component: './account/center',
          //     },
          //     {
          //       name: 'settings',
          //       icon: 'smile',
          //       path: '/image_label/account/settings',
          //       component: './account/settings',
          //     },
          //   ],
          // },
          {
            path: '/',
            redirect: '/image_label/project',
          },
          {
            component: '404',
          },
        ],
      },
    ],
  },
]