import { createRoot } from 'react-dom/client';
import axios from "axios";
import App from './App';

axios.defaults.withCredentials = true;

const root = createRoot(document.getElementById('root'));
root.render(<App />);
