# Base image
FROM node:22

# Create working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the project
COPY . .

# Your Express server port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]