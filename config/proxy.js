/**
 * 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 */
export default {
  dev: {
    '/ai_arts/api/': {
      // target: 'http://huawei-proxy01.sigsus.cn:49000/',
      target: 'http://219.133.167.42:30000/',
      changeOrigin: true,
      pathRewrite: {
        '^': '',
      },
    },
    '/data-platform-backend/': {
      // target: 'http://huawei-proxy01.sigsus.cn:49000/',
      target: 'http://219.133.167.42:30000/',
      changeOrigin: true,
      pathRewrite: {
        '^': '',
      },
    },
    '/custom-user-dashboard-backend/': {
      target: 'http://219.133.167.42:30000/',
      changeOrigin: true,
      pathRewrite: {
        '^': '',
      },
    },
  },
  test: {
    '/api/': {
      target: 'https://apulis-test.sigsus1.cn:51443',
      changeOrigin: true,
      pathRewrite: {
        '^': '',
      },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: {
        '^': '',
      },
    },
  },
}
