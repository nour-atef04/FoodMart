# Use Node 20 as the base image
FROM node:20-slim

# Install Python 3, pip, and venv
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Create a Python virtual environment and add it to PATH
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Copy Python requirements first (to cache this layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node.js package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the backend application code
COPY . .

# Expose the Express port
EXPOSE 5000

# Start the Node server
CMD ["node", "server.js"]