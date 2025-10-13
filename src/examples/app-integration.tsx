// Example of how to integrate the ServerProvider in your main App component

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ServerProvider } from '@/providers/ServerProvider';
import { ServerStatus } from '@/components/ServerStatus';
import ErrorBoundary from '@/components/ErrorBoundary';

// Your existing components
// import Home from '@/pages/Home';
// import Login from '@/pages/Login';
// import CourseView from '@/pages/CourseView';

function App() {
  return (
    <ErrorBoundary>
      <ServerProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            {/* Your existing routes */}
            <Routes>
              {/* <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/course/:slug" element={<CourseView />} /> */}
            </Routes>
            
            {/* Server connection status (only shows in development) */}
            <ServerStatus />
          </div>
        </Router>
      </ServerProvider>
    </ErrorBoundary>
  );
}

export default App;