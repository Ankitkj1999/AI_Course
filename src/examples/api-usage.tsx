// Example of how to use the new dynamic API client

import React, { useState } from 'react';
import { apiPost, apiGet } from '@/utils/api';
import { useServer } from '@/providers/ServerProvider';

// Example login component using the new API client
export const LoginExample: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isConnected, serverURL } = useServer();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      alert('Server is not connected. Please check your connection.');
      return;
    }

    setLoading(true);
    
    try {
      // The API client will automatically use the detected server URL
      const response = await apiPost('/signin', {
        email,
        password
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Login successful:', data);
        // Handle successful login
      } else {
        console.error('Login failed:', data.message);
        // Handle login error
      }
    } catch (error) {
      console.error('Login error:', error);
      // Handle network error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      
      {/* Connection status indicator */}
      <div className={`mb-4 p-2 rounded text-sm ${
        isConnected 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isConnected 
          ? `✅ Connected to ${serverURL}` 
          : '❌ Server disconnected'
        }
      </div>

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !isConnected}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

// Example of fetching data with the new API client
export const CourseListExample: React.FC = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isConnected } = useServer();

  const fetchCourses = async () => {
    if (!isConnected) return;

    setLoading(true);
    try {
      const response = await apiGet('/courses?userId=123');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCourses();
  }, [isConnected]);

  if (loading) {
    return <div>Loading courses...</div>;
  }

  return (
    <div>
      <h2>My Courses</h2>
      {courses.length === 0 ? (
        <p>No courses found</p>
      ) : (
        <ul>
          {courses.map((course: any) => (
            <li key={course._id}>{course.mainTopic}</li>
          ))}
        </ul>
      )}
    </div>
  );
};