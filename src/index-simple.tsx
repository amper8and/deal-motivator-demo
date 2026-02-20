import { Hono } from 'hono'

const app = new Hono()

// Read the demo app file
const demoAppContent = await Bun.file('/home/user/uploaded_files/deal_motivation_demo_app_react_with narrative.jsx').text();

app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deal Motivation Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://unpkg.com/recharts@2/dist/Recharts.js"></script>
    <style>
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-in, .fade-in-80 { animation: fade-in 0.2s ease-out; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
      const { useState, useEffect, useMemo, useRef } = React;
      
      ${demoAppContent.replace(/^import.*from.*;$/gm, '// $&')}
      
      // Render
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<DealMotivationDemoApp />);
    </script>
</body>
</html>
  `)
})

export default app
