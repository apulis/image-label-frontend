FROM node:12

RUN mkdir -p /home/AIArts
WORKDIR /home/AIArts
COPY . /home/AIArts

RUN yarn config set registry 'https://registry.npm.taobao.org'
RUN yarn
RUN yarn build


EXPOSE 3085

CMD ["node", "server.js"]