import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { user, accessToken } = res.data.data;
      login(user, accessToken);
      toast.success('Login successful!');
      if (user.role === 'ngo_admin') navigate('/dashboard');
      else if (user.role === 'field_worker') navigate('/report');
      else navigate('/my-tasks');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      // toast.error(msg,{
      //   duration: 5000, // 5 seconds
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900 dark:text-white tracking-tight">NGO Volunteer System</h2>
        {errorMsg && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">{errorMsg}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
          </button>
        </form>
        <div className="mt-6 space-y-2 text-sm text-center">
          <p><Link to="/register" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hover:underline transition-colors">Register as NGO/Field Worker</Link></p>
          <p><Link to="/volunteer/register" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hover:underline transition-colors">Register as Volunteer</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
