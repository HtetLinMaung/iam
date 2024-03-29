FROM node:lts-alpine3.12

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

# building the app
RUN npm i
# Running the app
COPY . ./

CMD [ "npm", "start" ]