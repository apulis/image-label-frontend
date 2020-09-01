FROM node:12

RUN mkdir -p /home/image-label
WORKDIR /home/image-label
ADD package.json .
ADD yarn.lock .
RUN yarn config set registry 'https://registry.npm.taobao.org'
RUN yarn install

COPY . /home/image-label

RUN yarn build


FROM node:12-alpine
RUN mkdir -p /home/app/dist && mkdir -p /home/app/server
WORKDIR /home/app/server
COPY --from=0 /home/image-label/dist ../dist
COPY --from=0 /home/image-label/server .
RUN yarn config set registry 'https://registry.npm.taobao.org'
RUN yarn

EXPOSE 3085

CMD ["node", "index"]
