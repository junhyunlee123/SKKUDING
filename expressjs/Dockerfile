FROM node:21-alpine3.18

COPY package.json /app/
COPY package-lock.json /app/
COPY src /app/src/

WORKDIR /app

RUN npm install

CMD ["node","src/index.js"]