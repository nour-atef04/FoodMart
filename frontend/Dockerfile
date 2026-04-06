# --- Stage 1: Build the React App ---
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# compiles app into static files in a /build folder
RUN npm run build 

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Copy custom configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static files from the build stage into Nginx's public folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose Nginx's default port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]