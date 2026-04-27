import React, { useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Loader2, Camera, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserMenu from '../components/UserMenu';

const SKILLS = ['food', 'cooking', 'water', 'plumbing', 'medical', 'first_aid', 'shelter', 'construction', 'education', 'teaching', 'driving', 'logistics'];

const Report = () => {
  const { logout } = useAuth();
  
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('food');
  const [urgency, setUrgency] = useState(5);
  const [people, setPeople] = useState('');
  const [description, setDescription] = useState('');
  
  const [loadingText, setLoadingText] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setLocation('');
    setCategory('food');
    setUrgency(5);
    setPeople('');
    setDescription('');
    setErrorMsg('');
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    setLoadingText(true);
    setErrorMsg('');
    
    const raw_text = `Location: ${location}. Category: ${category}. Urgency: ${urgency}/10. People affected: ${people}. Description: ${description}`;
    
    try {
      await api.post('/api/ingest', { raw_text, source_channel: 'form' });
      toast.success('Report submitted successfully');
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit report.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoadingText(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoadingPhoto(true);
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      await api.post('/api/ingest/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo report submitted successfully');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to upload photo.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoadingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center text-gray-900 dark:text-gray-100 transition-colors">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm md:w-full md:max-w-md w-full sticky top-0 z-10 transition-colors">
        <h1 className="font-extrabold text-xl tracking-tight">Submit a Report</h1>
        <UserMenu />
      </div>
      
      <div className="flex-1 p-4 md:w-full md:max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-6 transition-colors">
          
          <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Quick Photo Report</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">Found something? Snap a picture.</p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingPhoto}
              className="bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 shadow-sm disabled:opacity-50 transition"
            >
              {loadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handlePhotoChange}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-gray-800 px-3 text-sm text-gray-500 dark:text-gray-400 font-medium">Or enter details</span>
            </div>
          </div>

          {errorMsg && <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">{errorMsg}</div>}

          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Location</label>
              <input 
                type="text" required value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Dharavi Sector 4, Mumbai"
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow tracking-wide dark:placeholder-gray-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow appearance-none"
                >
                  {SKILLS.map((skill) => (
                    <option key={skill} value={skill} className="dark:bg-gray-800">
                      {skill.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">People Affected</label>
                <input 
                  type="number" required min="1" value={people}
                  onChange={e => setPeople(e.target.value)}
                  className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Urgency Level (<span className={`font-bold ${urgency >= 8 ? 'text-red-600 dark:text-red-400' : urgency >= 5 ? 'text-orange-500 hover:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>{urgency}/10</span>)
              </label>
              <input 
                type="range" min="1" max="10" value={urgency}
                onChange={e => setUrgency(parseInt(e.target.value))}
                className="w-full accent-gray-900 dark:accent-gray-100"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                <span>Low (1)</span>
                <span>Critical (10)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea 
                required rows="3" value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Give details about the situation..."
                className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 outline-none resize-none transition-shadow dark:placeholder-gray-500"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loadingText}
              className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 mt-2"
            >
              {loadingText ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Report;
