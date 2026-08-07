# ---- 构建阶段 ----
FROM node:22-alpine AS build
WORKDIR /app

# 先拷贝依赖清单，利用层缓存
COPY package.json package-lock.json ./
RUN npm ci

# 拷贝源码并构建
COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
