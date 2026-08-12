FROM node:20-alpine

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including Angular CLI and Tailwind)
RUN npm install

# Copy application source
COPY . .

EXPOSE 4200

# Start development server
CMD ["npm", "start"]
