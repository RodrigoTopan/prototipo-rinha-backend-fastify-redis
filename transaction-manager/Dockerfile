
FROM node:21-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 9000

CMD ["npm", "start"]