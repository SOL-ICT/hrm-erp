console.log(`
🚀 HRM-ERP Performance Notice
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current: Docker Development Mode
Expected: 2-5 second load times

📖 For optimizations, see:
   PERFORMANCE_README.md

🎯 Production Ready:
   AWS deployment will be 70% faster

💡 Quick optimization:
   Use docker-compose.dev.yml

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Performance reminder for developers
if (process.env.NODE_ENV === "development") {
  setTimeout(() => {
    console.log(
      "⚡ Tip: Enable PerformanceMonitor component for real-time metrics"
    );
  }, 3000);
}
