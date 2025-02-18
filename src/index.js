import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));  // ✅ Usa createRoot()
root.render(<App />);  // ✅ Usa render() desde createRoot
