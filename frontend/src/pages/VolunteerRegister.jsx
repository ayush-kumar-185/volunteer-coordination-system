import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const SKILLS = ['food', 'cooking', 'water', 'plumbing', 'medical', 'first_aid', 'shelter', 'construction', 'education', 'teaching', 'driving', 'logistics'];

const VolunteerRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    available_hours: 10,
    location_text: ''
  });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalPhone = formData.phone;
      if (!finalPhone.startsWith('+')) {
        if (!finalPhone.startsWith('91')) {
          finalPhone = `+91${finalPhone}`;
        } else {
          finalPhone = `+${finalPhone}`;
        }
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: finalPhone,
        skills: selectedSkills,
        available_hours: parseFloat(formData.available_hours),
        location_text: formData.location_text
      };

      await api.post('/api/volunteers', payload);
      toast.success('Registration successful. You will be contacted when matched.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 py-12 transition-colors">
      <div className="max-w-xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900 dark:text-white tracking-tight">Sign Up as a Volunteer</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input 
                type="text" required value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input 
                type="text" required value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter your phone Number"
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input 
                type="email" required value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input 
                type="password" required value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input 
              type="text" required value={formData.location_text}
              onChange={e => setFormData({...formData, location_text: e.target.value})}
              placeholder="e.g. Bandra West, Mumbai"
              className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Hours / Week ({formData.available_hours})</label>
            <input 
              type="range" min="1" max="40" value={formData.available_hours}
              onChange={e => setFormData({...formData, available_hours: e.target.value})}
              className="w-full accent-gray-900 dark:accent-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SKILLS.map(skill => (
                <label key={skill} className="flex items-center space-x-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => handleSkillToggle(skill)} className="text-gray-900 focus:ring-gray-900 outline-none" />
                  <span className="capitalize text-gray-900 dark:text-gray-200">{skill.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || selectedSkills.length === 0}
            className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm mt-6 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
          </button>
        </form>
        <div className="mt-6 text-sm text-center">
          <p className="dark:text-gray-400">Already have an account? <Link to="/login" className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium hover:underline transition-colors">Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default VolunteerRegister;
