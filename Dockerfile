FROM node:alpine AS deps
WORKDIR /usr/src/app

COPY . ./

# building the app
RUN npm i
# Running the app
CMD [ "npm", "start" ]