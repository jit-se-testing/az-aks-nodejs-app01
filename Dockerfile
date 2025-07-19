FROM node:16-alpine

RUN mkdir /sensitive_data
COPY iac-secrets.tf /sensitive_data
RUN mkdir /misconfiguration
COPY insecure-db.tf /misconfiguration

USER root
EXPOSE 8080

WORKDIR /usr/src/app

RUN touch /tmp/ready
COPY ./app/package*.json ./
RUN npm install
COPY ./app .

EXPOSE 3000
CMD ["npm", "start"]
