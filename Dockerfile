FROM public.ecr.aws/docker/library/node:16 as builder
RUN mkdir -p /home/node/app
WORKDIR /home/node/app
COPY . .
USER root
RUN yarn
RUN yarn build
ENV MONGO_URL=$MONGO_URL
ENV JWT_SECRET=$JWT_SECRET
ENV JWT_EXPIRE_TIME=$JWT_EXPIRE_TIME
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_REGION=$AWS_REGION
ENV AWS_S3_BUCKET=$AWS_S3_BUCKET
ENV PROPOSAL_JWT_SECRET=$PROPOSAL_JWT_SECRET
ENV PROPOSAL_PAGE=$PROPOSAL_PAGE
ENV QUALIFICATION_JWT_SECRET=$QUALIFICATION_JWT_SECRET
ENV QUALIFICATION_PAGE=$QUALIFICATION_PAGE
ENV DOCUSIGN_SECRET_NAME=$DOCUSIGN_SECRET_NAME
ENV GENABILITY_APP_ID=$GENABILITY_APP_ID
ENV GENABILITY_APP_KEY=$GENABILITY_APP_KEY
ENV SUPPORT_MAIL=$SUPPORT_MAIL
ENV SALESFORCE_ENV=$SALESFORCE_ENV
EXPOSE 3001
RUN echo $(ls -1 .)
CMD [ "node","dist/index" ]
RUN echo "Finished building docker"

# docker build -t backend:1.0 .
# docker run -dit --name wave-solar-design-be -p 3001:3001 -e MONGO_URL="mongodb+srv://waveuser:LOXpwcrm2Q43iWcN@wavesandbox.qb4wa.mongodb.net/devel?retryWrites=true&w=majority" -e JWT_SECRET="abc123" backend:1.0