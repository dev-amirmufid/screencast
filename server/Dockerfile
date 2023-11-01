FROM node:16-bullseye-slim

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install
RUN npm install pm2 -g
RUN ln -snf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && echo "Asia/Tokyo" > /etc/timezone
EXPOSE 80
CMD ["pm2-runtime","process.yml"]