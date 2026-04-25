import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function getUrgencyConfig(urgency) {
  if (urgency >= 8) return { color: 'bg-[#EF4444]', label: 'URGENT' };
  if (urgency >= 4) return { color: 'bg-[#F59E0B]', label: 'MODERATE' };
  return { color: 'bg-[#22C55E]', label: 'LOW PRIORITY' };
}

export default function VolunteerTaskPage() {
  const { id } = useParams();
  const [need, setNeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [actionStatus, setActionStatus] = useState('idle'); // 'idle', 'accepting', 'declining', 'accepted', 'declined'

  useEffect(() => {
    const fetchNeed = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/needs/${id}`);
        if (!res.ok) throw new Error('Failed to fetch task details.');
        const data = await res.json();
        setNeed(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNeed();
  }, [id]);

  const handleAction = async (actionType) => {
    setActionStatus(actionType === 'accept' ? 'accepting' : 'declining');
    try {
      const payload = actionType === 'accept' 
        ? { status: 'accepted', volunteer_accepted: true }
        : { status: 'declined', volunteer_accepted: false };

      const res = await fetch(`http://localhost:5000/api/needs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Action failed');
      
      setActionStatus(actionType === 'accept' ? 'accepted' : 'declined');
    } catch (err) {
      alert('Something went wrong. Please try again.');
      setActionStatus('idle');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 px-4 text-center">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  if (!need) return null;

  if (actionStatus === 'accepted') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank you! Task accepted.</h2>
        <p className="text-gray-600 text-lg mb-8">
          The NGO has been notified.<br/>Head to <strong>{need.location}</strong> as soon as possible.
        </p>
        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Powered by volunteers like you</p>
      </div>
    );
  }

  if (actionStatus === 'declined') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-6 text-center">
        <div className="text-6xl mb-6">👋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No problem.</h2>
        <p className="text-gray-600 text-lg mb-8">
          We'll find another volunteer nearby.
        </p>
        <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Powered by volunteers like you</p>
      </div>
    );
  }

  const urgencyVal = need.urgency_score !== undefined ? need.urgency_score : need.urgency;
  const config = getUrgencyConfig(urgencyVal);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center w-full py-0 sm:py-8">
      <div className="w-full max-w-[390px] bg-white min-h-screen sm:min-h-0 sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
        {/* App Name */}
        <div className="bg-white py-3 text-center border-b border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Community Response Network</p>
        </div>

        {/* Banner */}
        <div className={`${config.color} text-white px-6 py-5 flex justify-between items-center shadow-sm`}>
          <span className="font-extrabold tracking-widest text-sm">{config.label}</span>
          <span className="font-bold bg-black/20 px-3 py-1 rounded-full text-xs">Score: {urgencyVal}</span>
        </div>

        {/* Content */}
        <div className="p-7 flex-1 flex flex-col">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-8 leading-tight">{need.category}</h1>
          
          <div className="space-y-5 mb-8">
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">📍</span>
              <div>
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Location</p>
                <p className="text-gray-900 font-bold text-lg leading-snug">{need.location}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <span className="text-2xl mt-0.5">👥</span>
              <div>
                <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">People Affected</p>
                <p className="text-gray-900 font-bold text-lg">{need.people_affected || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-2">Description</p>
            <p className="text-gray-800 leading-relaxed text-[15px]">{need.description}</p>
          </div>

          <hr className="border-gray-200 mb-8 mt-auto" />

          {/* Buttons */}
          <div className="space-y-4 pb-4">
            <button
              onClick={() => handleAction('accept')}
              disabled={actionStatus !== 'idle'}
              className="w-full bg-[#22C55E] hover:bg-green-600 disabled:bg-green-400 text-white font-extrabold rounded-2xl flex items-center justify-center transition-all min-h-[56px] text-lg shadow-sm active:scale-[0.98]"
            >
              {actionStatus === 'accepting' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                'ACCEPT'
              )}
            </button>
            <button
              onClick={() => handleAction('decline')}
              disabled={actionStatus !== 'idle'}
              className="w-full bg-white border-[2.5px] border-[#EF4444] text-[#EF4444] hover:bg-red-50 disabled:border-red-200 disabled:text-red-300 font-extrabold rounded-2xl flex items-center justify-center transition-all min-h-[56px] text-lg active:scale-[0.98]"
            >
              {actionStatus === 'declining' ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#EF4444]"></div>
              ) : (
                'DECLINE'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
