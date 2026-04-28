FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm ci --only=production

# Bundle app source
COPY . .

# Google Cloud Run expects the container to listen on the port defined by process.env.PORT, which defaults to 8080
ENV PORT=8080
EXPOSE 8080

# Using explicit node index.js instead of npm start since package.json might have wrong paths
CMD [ "node", "index.js" ]
