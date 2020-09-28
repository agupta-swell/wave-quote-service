FROM node:14.11.0 as builder
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY . .
USER root
RUN npm install
RUN npm run build
ENV MONGO_URL=$MONGO_URL
ENV JWT_SECRET=$JWT_SECRET
ENV JWT_EXPIRE_TIME=$JWT_EXPIRE_TIME
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_REGION=$AWS_REGION
ENV AWS_S3_BUCKET=$AWS_S3_BUCKET
EXPOSE 3001
RUN echo $(ls -1 .)
CMD [ "node","dist/index" ]
RUN echo "Finished building docker"

# docker build -t backend:1.0 .
# docker run -dit --name wave-solar-design-be -p 3001:3001 -e MONGO_URL="mongodb+srv://waveuser:LOXpwcrm2Q43iWcN@wavesandbox.qb4wa.mongodb.net/devel?retryWrites=true&w=majority" -e JWT_SECRET="abc123" backend:1.0