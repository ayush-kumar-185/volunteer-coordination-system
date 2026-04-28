import React, { useState, useCallback, useMemo, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LogOut, Filter, Activity, Users, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

import UserMenu from './UserMenu';
import NeedsMap from './NeedsMap';
import NeedDetailPanel from './NeedDetailPanel';
import GapsTab from './GapsTab';

const SKILLS = ['food', 'cooking', 'water', 'plumbing', 'medical', 'first_aid', 'shelter', 'construction', 'education', 'teaching', 'driving', 'logistics'];

const CATEGORY_ICONS = {
  food: '🍱',
  cooking: '🍳',
  water: '💧',
  plumbing: '🔧',
  medical: '🏥',
  first_aid: '🩹',
  shelter: '🏠',
  construction: '🏗️',
  education: '📚',
  teaching: '🧑‍🏫',
  driving: '🚗',
  logistics: '📦',
  other: '📋'
};

const Dashboard = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('needs');
  const [selectedNeedId, setSelectedNeedId] = useState(null);
  
  // Data States
  const [needs, setNeeds] = useState([]);
  const [stats, setStats] = useState({ open_needs: 0, resolved_needs: 0, people_helped: 0, volunteers_deployed: 0, total_needs: 0 });
  
  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Initial Loadings
  const [loadingNeeds, setLoadingNeeds] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchNeeds = useCallback(async () => {
    setLoadingNeeds(true);
    try {
      const res = await api.get('/api/needs');
      setNeeds(res.data.data || []);
    } catch (err) {
      toast.error('Failed to update needs list.');
    } finally {
      setLoadingNeeds(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/api/needs/stats');
      setStats(res.data.data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNeeds();
    fetchStats();
  }, [fetchNeeds, fetchStats]);

  // Derived filtered needs
  const filteredNeeds = useMemo(() => {
    return needs.filter(n => {
      const matchesStatus = statusFilter ? n.status === statusFilter : true;
      const matchesCat = categoryFilter ? n.category === categoryFilter : true;
      return matchesStatus && matchesCat;
    });
  }, [needs, statusFilter, categoryFilter]);

  const selectedNeed = useMemo(() => needs.find(n => n.id === selectedNeedId), [needs, selectedNeedId]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header & Stats Strip */}
      <header className="bg-white dark:bg-gray-800 shadow-sm z-50 relative shrink-0 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex justify-between items-center py-3 px-6">
          <h1 className="font-extrabold text-xl tracking-tight text-gray-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => { fetchNeeds(); fetchStats(); }}
              className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100/50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loadingNeeds || loadingStats ? 'animate-spin' : ''}`} />
            </button>
            <UserMenu />
          </div>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-6 pb-4">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 flex-1 min-w-[120px]">
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Reported</p>
            {loadingStats ? <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : <p className="text-xl font-black text-gray-900 dark:text-white">{stats.total_needs || 0}</p>}
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 flex-1 min-w-[120px]">
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Needs Resolved</p>
            {loadingStats ? <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : <p className="text-xl font-black text-gray-900 dark:text-white">{stats.resolved_needs || 0}</p>}
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 flex-1 min-w-[120px]">
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">People Helped</p>
            {loadingStats ? <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.people_helped || 0}</p>}
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 flex-1 min-w-[120px]">
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Vols Deployed</p>
            {loadingStats ? <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" /> : <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{stats.volunteers_deployed || 0}</p>}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Map Container */}
        <div className="hidden md:block md:w-1/2 lg:w-2/3 h-full relative">
          <NeedsMap needs={filteredNeeds} onSelectNeed={setSelectedNeedId} />
        </div>

        {/* Right Side: Sidebar */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-gray-800 h-full flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] z-10 relative transition-colors">
          
          <div className="flex p-2 gap-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0 transition-colors">
            <button 
              onClick={() => setActiveTab('needs')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center transition-all ${activeTab === 'needs' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-transparent'}`}
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" /> Live Needs
            </button>
            <button 
              onClick={() => setActiveTab('gaps')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center transition-all ${activeTab === 'gaps' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-800' : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 border border-transparent'}`}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Unmet Gaps
            </button>
          </div>

          {activeTab === 'needs' ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex space-x-2 shrink-0 transition-colors">
                <select 
                  value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded shadow-sm focus:ring-gray-900 dark:focus:ring-gray-500 px-2 py-1.5 outline-none transition-colors"
                >
                  <option value="">All Needs</option>
                  {SKILLS.map((skill) => (
                    <option key={skill} value={skill} className="dark:bg-gray-800">
                      {skill.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
                <select 
                  value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded shadow-sm focus:ring-gray-900 dark:focus:ring-gray-500 px-2 py-1.5 outline-none transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-100 dark:bg-gray-900 transition-colors">
                {loadingNeeds ? (
                  <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-gray-900 dark:border-gray-100 border-t-transparent rounded-full animate-spin"></div></div>
                ) : filteredNeeds.length > 0 ? (
                  filteredNeeds.map(need => (
                    <div 
                      key={need.id} 
                      onClick={() => setSelectedNeedId(need.id)}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all cursor-pointer hover:shadow-md overflow-hidden ${selectedNeedId === need.id ? 'border-gray-900 dark:border-gray-400 ring-1 ring-gray-900 dark:ring-gray-400' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      <div className={`flex flex-col h-full border-l-4 ${need.urgency_score >= 8 ? 'border-l-red-500' : need.urgency_score >= 5 ? 'border-l-orange-500' : 'border-l-green-500'}`}>
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className="text-xl mr-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-lg">{CATEGORY_ICONS[need.category] || CATEGORY_ICONS.other}</span>
                              <div>
                                <p className="font-extrabold text-gray-900 dark:text-white text-sm capitalize leading-none">{need.category}</p>
                                <p className="text-xs font-semibold mt-1">
                                  {need.urgency_score >= 8 ? <span className="text-red-600 dark:text-red-400">High Urgency</span> : need.urgency_score >= 5 ? <span className="text-orange-600 dark:text-orange-400">Med Urgency</span> : <span className="text-green-600 dark:text-green-400">Low Urgency</span>}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                need.status === 'open' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-800/50' :
                                need.status === 'pending' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50' :
                                need.status === 'assigned' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600' :
                                'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800/50'
                              }`}>
                              {need.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">{need.location_text}</p>
                          
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 dark:border-gray-700 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            <div className="flex items-center bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                              <Users className="w-3.5 h-3.5 mr-1" /> {need.people_affected} affected
                            </div>
                            <span>{formatDistanceToNow(new Date(need.created_at))} ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-sm text-gray-400 italic">No needs match the current filters.</div>
                )}
              </div>
            </div>
          ) : (
            <GapsTab onSelectNeed={setSelectedNeedId} />
          )}

          {/* Need Detail Panel Overlay */}
          {selectedNeedId && (
            <NeedDetailPanel 
              need={selectedNeed} 
              onClose={() => setSelectedNeedId(null)} 
              onRefreshRequired={() => {
                fetchNeeds();
                fetchStats();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
