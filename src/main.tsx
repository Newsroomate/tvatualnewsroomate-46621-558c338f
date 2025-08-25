import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize realtime setup as early as possible
import './services/realtime-setup'

createRoot(document.getElementById("root")!).render(<App />);
