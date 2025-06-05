import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter as Router } from 'react-router-dom';

import "bootstrap/dist/css/bootstrap.min.css";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import "./styles/main.css";
import "./styles/navbar-styles.css";
import "./styles/pages-styles.css";
import "./styles/components-styles.css";
import "./styles/auth-styles.css";
import "./styles/flight-viewer-styles.css";


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);