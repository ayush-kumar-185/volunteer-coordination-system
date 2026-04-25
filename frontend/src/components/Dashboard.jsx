import React, { useState, useEffect } from 'react';
import volunteersData from '../data/volunteers.json';
import NeedsMap from './NeedsMap';

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getUrgencyColors(urgency) {
  if (urgency >= 8) return 'bg-[#EF4444] text-white';
  if (urgency >= 4) return 'bg-[#F59E0B] text-white';
  return 'bg-[#22C55E] text-white';
}

function getUrgencyLabel(urgency) {
  if (urgency >= 8) return 'High';
  if (urgency >= 4) return 'Medium';
  return 'Low';
}

function useAnimatedCount(target) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const step = Math.ceil(target / 30) || 1;
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return prev + step;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return count;
}

function MetricCard({ value, label, borderClass }) {
  const animatedValue = useAnimatedCount(value);
  return (
    <div className={`bg-white rounded-xl shadow-sm hover:-translate-y-0.5 transition-transform duration-200 border-l-4 ${borderClass} p-4 flex flex-col justify-center`}>
      <div className="text-4xl font-bold text-gray-900">{animatedValue}</div>
      <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [needs, setNeeds] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedNeed, setSelectedNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiStats, setApiStats] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/stats');
      if (res.ok) {
        const data = await res.json();
        setApiStats(data);
      } else {
        setApiStats(null);
      }
    } catch (e) {
      setApiStats(null);
    }
  };

  const fetchNeeds = async (isBackgroundPoll = false) => {
    if (!isBackgroundPoll) {
      setLoading(true);
    }
    try {
      const needsRes = await fetch('http://localhost:5000/api/needs');
      if (needsRes.ok) {
        const needsData = await needsRes.json();
        setNeeds(prev => JSON.stringify(prev) !== JSON.stringify(needsData) ? needsData : prev);
      }
    } catch (error) {
      console.error('Error fetching needs:', error);
    } finally {
      if (!isBackgroundPoll) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchNeeds(false);
    fetchStats();

    const fetchVolunteers = async () => {
      try {
        const volRes = await fetch('http://localhost:5000/api/volunteers');
        if (volRes.ok) {
          const volData = await volRes.json();
          setVolunteers(prev => JSON.stringify(prev) !== JSON.stringify(volData) ? volData : prev);
        } else {
          const volRes3000 = await fetch('http://localhost:3000/api/volunteers');
          if (volRes3000.ok) {
             const volData = await volRes3000.json();
             setVolunteers(prev => JSON.stringify(prev) !== JSON.stringify(volData) ? volData : prev);
          } else {
             setVolunteers(prev => prev.length === 0 ? volunteersData : prev);
          }
        }
      } catch (e) {
        try {
           const volRes3000 = await fetch('http://localhost:3000/api/volunteers');
           if (volRes3000.ok) {
             const volData = await volRes3000.json();
             setVolunteers(prev => JSON.stringify(prev) !== JSON.stringify(volData) ? volData : prev);
           } else {
             setVolunteers(prev => prev.length === 0 ? volunteersData : prev);
           }
        } catch(e2) {
           setVolunteers(prev => prev.length === 0 ? volunteersData : prev);
        }
      }
    };
    fetchVolunteers();

    const interval = setInterval(() => {
      fetchNeeds(true);
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  let matchedVolunteers = [];
  if (selectedNeed && selectedNeed.lat && selectedNeed.lng) {
    const activeVols = volunteers.filter(v => 
      !v.status || v.status.toLowerCase() === 'active' || v.status === 'Active'
    );
    matchedVolunteers = activeVols.map(vol => {
      const distance = getDistanceKm(selectedNeed.lat, selectedNeed.lng, vol.lat, vol.lng);
      return { ...vol, distance };
    }).sort((a, b) => a.distance - b.distance).slice(0, 3);
  }

  const handleDispatch = (volName, needLocation) => {
    console.log(`Dispatching ${volName} to ${needLocation}`);
  };

  // Ranked List Behavior
  // Filter to status === "open" only
  // Sort by urgency descending
  const rankedNeeds = needs
    .filter(need => need.status === 'open' || need.status === 'Open')
    .sort((a, b) => {
       const uA = a.urgency_score !== undefined ? a.urgency_score : a.urgency;
       const uB = b.urgency_score !== undefined ? b.urgency_score : b.urgency;
       return uB - uA;
    });

  const isToday = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const computedStats = {
    total_needs: needs.length,
    resolved_today: needs.filter(n => n.status === 'resolved' && isToday(n.updated_at)).length,
    people_helped: needs.filter(n => n.status === 'resolved').reduce((sum, n) => sum + (Number(n.people_affected) || 0), 0),
    active_volunteers: volunteers.filter(v => !v.status || v.status.toLowerCase() === 'active' || v.status === 'Active').length
  };

  const finalStats = apiStats || computedStats;

  return (
    <div className="flex flex-col h-full w-full bg-white shadow overflow-hidden border border-gray-100">
      {/* Dashboard Header */}
      <div className="bg-gray-50 border-b px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <div>
            <h1 className="font-extrabold text-gray-900 text-2xl tracking-tight">Community Needs Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Real-time view &middot; New Delhi</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
          <style>
            {`
              @keyframes custompulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}
          </style>
          <span 
            className="rounded-full h-2.5 w-2.5 bg-green-500"
            style={{ animation: 'custompulse 2s infinite' }}
          ></span>
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Impact Tracker Panel */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard value={finalStats.total_needs} label="Total Needs" borderClass="border-blue-500" />
          <MetricCard value={finalStats.resolved_today} label="Resolved Today" borderClass="border-green-500" />
          <MetricCard value={finalStats.people_helped} label="People Helped" borderClass="border-purple-500" />
          <MetricCard value={finalStats.active_volunteers} label="Active Volunteers" borderClass="border-amber-500" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: Map Section */}
        <div className="w-full lg:w-[60%] h-[300px] md:h-[400px] lg:h-full relative border-b lg:border-r border-gray-200 shrink-0">
          <NeedsMap needs={needs} onSelectNeed={setSelectedNeed} />
        </div>

        {/* Right 40%: Ranked List & Detail Panel */}
        <div className="w-full lg:w-[40%] flex flex-col flex-1 lg:flex-none lg:h-full bg-gray-50 overflow-hidden">
          {/* Scrollable Ranked Needs List */}
          <div className={`overflow-y-auto transition-all duration-300 ${selectedNeed ? 'h-[300px] lg:h-1/2 border-b border-gray-200 shrink-0 lg:shrink' : 'flex-1 h-full'}`}>
            <div className="p-4 bg-white sticky top-0 border-b border-gray-100 shadow-sm z-10 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Active Ranked Needs</h3>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{rankedNeeds.length} Open</span>
            </div>
            
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : rankedNeeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <span className="text-4xl mb-3">🎉</span>
                <p className="text-gray-500 font-medium text-lg">No open needs right now</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {rankedNeeds.map(need => {
                  const urgencyVal = need.urgency_score !== undefined ? need.urgency_score : need.urgency;
                  return (
                    <div 
                      key={need.id} 
                      onClick={() => setSelectedNeed(need)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedNeed?.id === need.id ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-gray-900 truncate pr-2">
                          {need.category || 'Unknown'} &bull; {need.location}
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap shadow-sm ${getUrgencyColors(urgencyVal)}`}>
                          {urgencyVal}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {need.description ? (need.description.length > 60 ? need.description.substring(0, 60) + '...' : need.description) : 'No description provided.'}
                      </p>
                      <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {need.people_affected || 0} People Affected
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail Panel Below the List */}
          <div className={`overflow-y-auto bg-gray-50 shadow-inner ${selectedNeed ? 'flex-1 lg:h-1/2' : 'hidden lg:block lg:flex-1 lg:h-1/2'}`}>
            {!selectedNeed ? (
              <div className="flex items-center justify-center h-full p-6 text-center text-gray-500 font-medium">
                Select a need from the list to see matched volunteers
              </div>
            ) : (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-xl text-gray-900">Need Details</h3>
                  <button 
                    onClick={() => setSelectedNeed(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-5">
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Category</p>
                      <p className="text-gray-900 font-semibold">{selectedNeed.category}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Location</p>
                      <p className="text-gray-900 font-semibold">{selectedNeed.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Urgency</p>
                      <p className="text-gray-900 font-semibold">
                        {selectedNeed.urgency_score !== undefined ? selectedNeed.urgency_score : selectedNeed.urgency}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">People Affected</p>
                      <p className="text-gray-900 font-semibold">{selectedNeed.people_affected || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Full Description</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{selectedNeed.description}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">Top Matched Volunteers</h4>
                  {matchedVolunteers.length === 0 ? (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 text-center text-sm text-gray-500">
                      No volunteers in range.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {matchedVolunteers.map(vol => (
                        <div key={vol.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-bold text-gray-900">{vol.name}</h5>
                              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                {vol.distance.toFixed(1)} km away
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDispatch(vol.name, selectedNeed.location)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md font-bold shadow-sm transition-colors"
                            >
                              Dispatch
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {vol.skills && vol.skills.map((skill, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-sm font-medium border border-gray-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
