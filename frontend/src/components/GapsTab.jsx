import React, { useState, useCallback } from 'react';
import { usePolling } from '../hooks/usePolling';
import api from '../services/api';
import { AlertTriangle, Clock } from 'lucide-react';

const CATEGORY_ICONS = {
  food: '🍱',
  water: '💧',
  medical: '🏥',
  shelter: '🏠',
  education: '📚',
  other: '📋'
};

const GapsTab = () => {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGaps = useCallback(async () => {
    try {
      const res = await api.get('/api/needs/gaps');
      setGaps(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading]);

  usePolling(fetchGaps, 60000);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center space-y-3 flex-col">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium text-sm">Identifying gaps...</p>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 text-center m-4 rounded-xl border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-green-50 text-green-400 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h3 className="text-gray-900 font-semibold mb-1">No Service Gaps</h3>
        <p className="text-sm text-gray-500">Every critical need has been matched or is recent.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      <div className="bg-red-50 text-red-700 p-3.5 rounded-lg text-sm flex items-start border border-red-100 shadow-sm font-medium">
        <AlertTriangle className="w-5 h-5 mr-2.5 shrink-0 mt-0.5 text-red-600" />
        <p>Critical: These needs have been open for over 6 hours without any assigned volunteers.</p>
      </div>
      
      {gaps.map(gap => (
        <div key={gap.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="border-l-4 border-l-red-500 p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3 bg-red-50 p-1.5 rounded-lg">{CATEGORY_ICONS[gap.category] || CATEGORY_ICONS.other}</span>
                <div>
                  <p className="font-extrabold text-gray-900 capitalize leading-tight">{gap.category} Need</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{gap.location_text}</p>
                </div>
              </div>
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border border-red-100 shadow-sm">
                Urgency: {gap.urgency_score}/10
              </span>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-3 font-semibold">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-red-500" />
                <span className="text-red-600 font-bold">Unmet for {Math.floor(Number(gap?.hours_open || 0))} hours</span>
              </div>
              <span className="text-gray-400">Needs attention</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Quick stub for valid render if missing icon import above (was missing check circle)
import { CheckCircle } from 'lucide-react';

export default GapsTab;
