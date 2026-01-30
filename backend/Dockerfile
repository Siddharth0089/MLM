FROM node:20-bookworm-slim

# Install compilers + Java + core utils
RUN apt-get update && apt-get install -y \
    g++ \
    openjdk-17-jdk \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy rest code
COPY . .

EXPOSE 5000

CMD ["npm", "start"]
