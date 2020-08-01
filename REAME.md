# AIArts Platform


## Docker 部署方式

在当前目录，确定为最新代码后
```
// 编译镜像
docker build -t apulistech/image-label .
// 上线服务
docker-compose up -d
// 下线服务
docker-compose down
```

## master nginx 配置

如果 nginx 的配置没有更新，需要在 nginx 增加一条

```
location /image_label {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_buffers 16 16k;
    proxy_buffer_size 32k;
    proxy_pass http://localhost:3085/;
}
```