# -------- Build stage --------
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# -------- Production stage --------
FROM nginx:stable-alpine AS final

# Apply OS security updates to reduce Trivy findings
RUN apk update && apk upgrade --no-cache

# Copy build output from previous stage
COPY --from=build /app/.next /usr/share/nginx/html

# Copy custom nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
