import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { X, MessageCircle, Mic, Camera, FileText, Loader2, UserMinus, ShieldAlert, CheckCircle, Navigation } from 'lucide-react';

const ICONS = {
  whatsapp: <MessageCircle className="w-4 h-4" />,
  voice: <Mic className="w-4 h-4" />,
  photo: <Camera className="w-4 h-4" />,
  form: <FileText className="w-4 h-4" />
};

const NeedDetailPanel = ({ need, onClose, onRefreshRequired }) => {
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [dispatchedVolunteers, setDispatchedVolunteers] = useState(new Set());

  const fetchMatches = useCallback(async () => {
    if (!need) return;
    setLoadingMatches(true);
    try {
      const res = await api.get(`/api/needs/${need.id}/matches`);
      setMatches(res.data.data?.matches || []);
    } catch (err) {
      toast.error('Failed to find matches');
    } finally {
      setLoadingMatches(false);
    }
  }, [need]);

  useEffect(() => {
    if (need && need.status === 'open') {
      // Only auto fetch matches if the need is open and hasn't been assigned
      fetchMatches();
    }
  }, [need, fetchMatches]);

  if (!need) return null;

  const handleDispatch = async (volunteerId) => {
    setActionLoading(true);
    try {
      await api.post(`/api/needs/${need.id}/dispatch`, { volunteer_id: volunteerId });
      toast.success('Volunteer notified via WhatsApp ✓');
      setDispatchedVolunteers(prev => new Set([...prev, volunteerId]));
      onRefreshRequired(); // notify parent to refresh lists
    } catch (err) {
      toast.error('Dispatch failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/needs/${need.id}/complete`);
      toast.success('Need marked as complete!');
      onRefreshRequired();
      onClose(); // close panel
    } catch (err) {
      toast.error('Completion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-20 flex flex-col border-l border-gray-200 animate-in slide-in-from-right duration-300">
      <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-white">
        <div>
          <h2 className="font-extrabold text-gray-900 text-lg flex items-center leading-tight mb-1.5">
            <span className="capitalize mr-2">{need.category} Need</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              need.status === 'open' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
              need.status === 'pending' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
              need.status === 'assigned' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
              'bg-green-50 text-green-700 border border-green-100'
            }`}>
              {need.status}
            </span>
          </h2>
          <p className="text-sm text-gray-500 font-medium">{need.location_text}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition" title="Close Panel">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Core Info */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-sm text-gray-700">
            <span className={`font-semibold border px-2.5 py-1 rounded-md flex items-center ${need.urgency_score >= 8 ? 'bg-red-50 border-red-100 text-red-700' : need.urgency_score >= 5 ? 'bg-orange-50 border-orange-100 text-orange-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
              Urgency: {need.urgency_score}/10
            </span>
            <span className="font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md flex items-center">
              Affected: {need.people_affected}
            </span>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 text-sm text-gray-800 leading-relaxed shadow-sm">
            {need.description}
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center text-gray-600 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 font-medium shadow-sm">
              {ICONS[need.source_channel] || ICONS.form}
              <span className="ml-1.5 capitalize">{need.source_channel}</span>
            </span>
            {need.report_count > 1 && (
              <span className="flex items-center text-red-700 bg-white px-2.5 py-1.5 rounded-lg border border-red-200 font-bold shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                Reported {need.report_count}x
              </span>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Action Area based on status */}
        {(need.status === 'pending' || need.status === 'assigned' || need.status === 'confirmed') ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">Volunteer Deployed</h3>
            <p className="text-xs text-gray-600 font-medium">
              A volunteer is handling this task. {need.status === 'confirmed' ? "They have accepted it." : "Waiting for their confirmation."}
            </p>
          </div>
        ) : need.status === 'open' ? (
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-gray-900">Top Volunteer Matches</h3>
              <button 
                onClick={fetchMatches}
                disabled={loadingMatches}
                className="text-xs text-indigo-600 font-medium flex items-center hover:underline disabled:opacity-50"
              >
                {loadingMatches ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Refresh Matches
              </button>
            </div>

            {loadingMatches ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-3">
                {matches.map(vol => (
                  <div key={vol.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-extrabold text-gray-900 leading-none">{vol.name}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1.5 font-medium">
                          <Navigation className="w-3 h-3 mr-1 text-gray-400" />
                          {vol.distance_km ? `${vol.distance_km.toFixed(1)} km away` : 'Distance unknown'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-green-50 text-green-700 border border-green-200 font-extrabold text-xs px-2 py-1 rounded-lg">Match: {vol.match_score}%</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {vol.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 text-[10px] rounded uppercase tracking-wider font-bold">
                          {skill.replace('_', ' ')}
                        </span>
                      ))}
                      {vol.skills.length > 3 && <span className="px-2 py-0.5 text-gray-400 text-[10px] font-medium">+{vol.skills.length - 3}</span>}
                    </div>

                    {dispatchedVolunteers.has(vol.id) ? (
                      <button disabled className="w-full py-2 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-bold rounded-lg flex items-center justify-center shadow-sm">
                        <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                        Notified via WhatsApp
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDispatch(vol.id)}
                        disabled={actionLoading}
                        className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white shadow-sm text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                        Dispatch Volunteer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <UserMinus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No available volunteers matched.</p>
              </div>
            )}
          </div>
        ) : (
           <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm text-gray-500">
             This need is closed.
           </div>
        )}
      </div>
    </div>
  );
};

export default NeedDetailPanel;
