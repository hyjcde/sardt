import type { NextConfig } from "next";
const webpack = require('webpack');

const nextConfig: NextConfig = {
  // 显式告诉 Next.js 使用 webpack 而不是 Turbopack，因为我们配置了自定义 webpack 插件
  // 或者你可以通过命令行参数 --webpack 启动
  turbopack: {}, // 显式设置空配置以允许回退到 webpack
  webpack: (config) => {
    config.plugins.push(
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify('/cesium'),
      })
    );
    return config;
  },
};

export default nextConfig;
