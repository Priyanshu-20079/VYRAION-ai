import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { ViewRoleProvider } from './context/ViewRoleContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <NotificationProvider>
        <SocketProvider>
          <ViewRoleProvider>
            <App />
          </ViewRoleProvider>
        </SocketProvider>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);
