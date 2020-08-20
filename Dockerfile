FROM node:14.8 as builder
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY . .
# COPY ./package.json .
USER node
RUN npm install


RUN npm run build
COPY --chown=node:node . .
RUN echo "Finished building Node app"

FROM node:14.8 as production
RUN echo "Transfering build bundle..."
RUN mkdir -p /usr/app
COPY --from=builder /home/node/app/dist /usr/app
COPY --from=builder /home/node/app/package.json /usr/app
ENV PORT=3001
ENV MONGO_URL=$MONGO_URL
ENV JWT_SECRET=$JWT_SECRET
WORKDIR /usr/app
RUN npm i
EXPOSE 3001
RUN echo $(ls -1 /usr/app)
CMD [ "node","dist/index" ]
RUN echo "Finished building docker"
