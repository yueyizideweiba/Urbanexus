const { app, server } = require('./app');

// 这个文件只是作为启动点，具体的应用逻辑在app.js中

// 如果需要在进程关闭时执行清理操作，可以在这里添加
process.on('SIGTERM', () => {
  console.log('SIGTERM信号接收，关闭HTTP服务器');
  server.close(() => {
    console.log('HTTP服务器已关闭');
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
}); 