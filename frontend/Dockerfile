# Stage 1: Build the Vite application
FROM node:20-alpine as build-stage

# Install build dependencies for Tailwind/PostCSS if needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy lockfiles first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the source code (including /src/pages, /src/theme, etc.)
COPY . .

# Run the build script defined in package.json
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from build-stage
# Vite outputs to /app/dist by default
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy your custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
