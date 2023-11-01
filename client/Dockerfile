FROM node:16-bullseye-slim

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install --legacy-peer-deps
# RUN npm install pm2 -g
RUN npm run build
RUN ln -snf /usr/share/zoneinfo/Asia/Tokyo /etc/localtime && echo "Asia/Tokyo" > /etc/timezone
EXPOSE 80
# CMD ["pm2-runtime","process.yml"]
CMD ["npm", "run", "startContainer"]