FROM node as builder
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY . .
USER root
RUN npm install
RUN npm run build
# COPY --chown=node:node . .
# RUN echo "Finished building Node app"
# FROM node as production
# RUN echo "Transfering build bundle..."
# RUN mkdir -p /usr/app
# COPY --from=builder /home/node/app/dist /usr/app
# COPY --from=builder /home/node/app/package.json /usr/app
ENV PORT=3001
ENV MONGO_URL=$MONGO_URL
ENV JWT_SECRET=$JWT_SECRET
# WORKDIR /usr/app
# RUN npm i --production
EXPOSE 3001
RUN echo $(ls -1 .)
CMD [ "node","dist/index" ]
RUN echo "Finished building docker"

# docker build -t backend:1.0 .
# docker run -dit --name nodejs-image-demo-cac -p 3001:3001 -e MONGO_URL="mongodb+srv://waveuser:LOXpwcrm2Q43iWcN@wavesandbox.qb4wa.mongodb.net/devel?retryWrites=true&w=majority" -e JWT_SECRET="abc123" backend:1.0