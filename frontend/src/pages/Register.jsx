import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'field_worker'
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      let finalPhone = formData.phone;
      if (!finalPhone.startsWith('+')) {
        if (!finalPhone.startsWith('91')) {
          finalPhone = `+91${finalPhone}`;
        } else {
          finalPhone = `+${finalPhone}`;
        }
      }

      const payload={
        name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: finalPhone,
        role: formData.role,
      }

      const res = await api.post('/api/auth/register', payload);
      // const { user, accessToken } = res.data.data;
      // login(user, accessToken);
      toast.success('Registration successful!');
      // if (user.role === 'ngo_admin') navigate('/dashboard');
      // else if (user.role === 'field_worker') navigate('/report');
      // else navigate('/my-tasks');
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900 dark:text-white tracking-tight">Register Staff</h2>
        {errorMsg && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">{errorMsg}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
  Phone
</label>

<input
  type="tel"
  required
  value={formData.phone}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, ''); // allow only digits
    setFormData({ ...formData, phone: value });
  }}
  inputMode="numeric"
  pattern="[0-9]*"
  maxLength={10}
  placeholder="Enter phone number"
  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select 
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value})}
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:bg-gray-800 dark:text-white appearance-none"
            >
              <option value="field_worker">Field Worker</option>
              <option value="ngo_admin">NGO Admin</option>
              {/* <option value="volunteer">Volunteer (Testing)</option> */}
            </select>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm mt-6 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
          </button>
        </form>
        <div className="mt-6 text-sm text-center">
          <p className="dark:text-gray-400">Already have an account? <Link to="/login" className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium hover:underline transition-colors">Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
