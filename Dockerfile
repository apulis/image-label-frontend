FROM node:12

RUN mkdir -p /home/image-label
WORKDIR /home/image-label
COPY . /home/image-label

RUN yarn config set registry 'https://registry.npm.taobao.org'
RUN yarn
RUN yarn build


EXPOSE 3085

CMD ["node", "server.js"]