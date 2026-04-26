import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MapPin, AlertCircle, Users, Check, X, LogOut, Clock } from 'lucide-react';
import UserMenu from '../components/UserMenu';

const CATEGORY_ICONS = {
  food: '🍱',
  water: '💧',
  medical: '🏥',
  shelter: '🏠',
  education: '📚',
  other: '📋'
};

const VolunteerTaskPage = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/api/volunteers/${user.id}/tasks`);
      setTasks(res.data.data || []);
      setErrorMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch tasks.');
    } finally {
      if (loading) setLoading(false);
    }
  }, [user?.id, loading]);

  usePolling(fetchTasks, 15000, !!user?.id);

  const activeTask = tasks.find(t => t.status === 'assigned' || t.status === 'confirmed');
  const historyTasks = tasks.filter(t => t.id !== activeTask?.id);

  const getUrgencyColor = (score) => {
    if (score >= 8) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 5) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getMapsLink = (task) => {
    if (task.latitude && task.longitude) {
      return `https://maps.google.com/?q=${task.latitude},${task.longitude}`;
    }
    return `https://maps.google.com/?q=${encodeURIComponent(task.location_text)}`;
  };

  const handleAccept = async () => {
    setProcessing(true);
    // Ideally calls an endpoint to confirm task
    toast.success('Task accepted! Please proceed to the location.');
    setProcessing(false);
  };

  const handleDecline = async () => {
    if (window.confirm('Are you sure you want to decline this task? It will be re-assigned to someone else.')) {
      setProcessing(true);
      // In a full implementation, call an endpoint to unassign
      toast.success('Task declined. You are available for new matches.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:items-center pb-20 text-gray-900 dark:text-gray-100 transition-colors">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center shadow-sm md:w-full md:max-w-md sticky top-0 z-10 w-full transition-colors">
        <h1 className="font-extrabold text-xl tracking-tight">My Assignments</h1>
        <UserMenu />
      </div>

      <div className="flex-1 p-4 w-full md:max-w-md space-y-6 mt-2">
        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center justify-between">
            {errorMsg}
            <button onClick={fetchTasks} className="underline font-medium">Retry</button>
          </div>
        )}

        {/* ACTIVE TASK */}
        {activeTask ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative transition-colors">
            <div className={`absolute top-0 left-0 w-full h-1 ${activeTask.urgency_score >= 8 ? 'bg-red-500' : activeTask.urgency_score >= 5 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl bg-gray-50 dark:bg-gray-900 p-2 rounded-xl">{CATEGORY_ICONS[activeTask.category] || CATEGORY_ICONS.other}</span>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white capitalize text-lg">{activeTask.category} required</h2>
                    <a 
                      href={getMapsLink(activeTask)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline flex items-center mt-1 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {activeTask.location_text}
                    </a>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 leading-relaxed">{activeTask.description}</p>
              
              <div className="flex space-x-2 mb-6">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center ${getUrgencyColor(activeTask.urgency_score)}`}>
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Urgency: {activeTask.urgency_score}/10
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 flex items-center">
                  <Users className="w-3.5 h-3.5 mr-1" />
                  {activeTask.people_affected} affected
                </span>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleAccept}
                  disabled={processing}
                  className="w-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-bold py-3 rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
                >
                  <Check className="w-5 h-5 mr-2" /> Accept Mission
                </button>
                <button 
                  onClick={handleDecline}
                  disabled={processing}
                  className="w-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4 mr-1.5" /> Decline
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center text-center transition-colors">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-1">No Active Assignments</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You are on standby. We will match you when a need arises.</p>
          </div>
        )}

        {/* HISTORY */}
        <div>
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Task History</h3>
          {historyTasks.length > 0 ? (
            <div className="space-y-3">
              {historyTasks.map(task => (
                <div key={task.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg">{CATEGORY_ICONS[task.category] || CATEGORY_ICONS.other}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm capitalize">{task.category}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-40">{task.location_text}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.status === 'closed' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 
                      task.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {task.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(task.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              No previous tasks
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerTaskPage;
