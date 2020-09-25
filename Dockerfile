FROM node as builder
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY . .
USER root
RUN npm install
RUN npm run build
ENV MONGO_URL=$MONGO_URL
ENV JWT_SECRET=$JWT_SECRET
EXPOSE 3001
RUN echo $(ls -1 .)
CMD [ "node","dist/index" ]
RUN echo "Finished building docker"

# docker build -t backend:1.0 .
# docker run -dit --name wave-solar-design-be -p 3001:3001 -e MONGO_URL="mongodb+srv://waveuser:LOXpwcrm2Q43iWcN@wavesandbox.qb4wa.mongodb.net/devel?retryWrites=true&w=majority" -e JWT_SECRET="abc123" backend:1.0