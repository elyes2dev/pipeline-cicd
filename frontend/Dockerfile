# Use a lightweight nginx image to serve the Angular build output
FROM nginx:alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy the Angular build output from the pipeline workspace to nginx html folder
COPY dist/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
