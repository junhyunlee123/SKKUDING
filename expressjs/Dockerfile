FROM --platform=linux/amd64 node:21-alpine3.18

COPY package.json /app/
COPY package-lock.json /app/
COPY src /app/src/

WORKDIR /app/src/

RUN npm install

ENTRYPOINT ["node","index.js"]
# ["node","src/index.js"] alternative