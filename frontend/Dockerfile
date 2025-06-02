FROM node:22.14.0

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Default command (Vite dev server)
CMD ["npm", "run", "dev"]
