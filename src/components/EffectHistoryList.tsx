import React, { useState, useEffect } from 'react';
import { Clock, ArrowUpRight } from 'lucide-react';
import { supabase, type EffectHistory } from '../lib/supabase';
import toast from 'react-hot-toast';

type EffectHistoryListProps = {
  userId: string;
  onLoadConfiguration: (configuration: Record<string, any>) => void;
};

export function EffectHistoryList({ userId, onLoadConfiguration }: EffectHistoryListProps) {
  const [history, setHistory] = useState<EffectHistory[]>([]);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('effect_history')
      .select('*')
      .eq('user_id', userId)
      .order('used_at', { ascending: false })
      .limit(10);

    if (error) {
      toast.error('Failed to load effect history');
      return;
    }

    setHistory(data || []);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-2">
        <Clock className="w-5 h-5 text-yellow-400" />
        <h3 className="text-xl font-semibold">Recent Effects</h3>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div>
              <div className="font-medium">{item.effect_name}</div>
              <div className="text-sm text-gray-400">{formatDate(item.used_at)}</div>
            </div>
            <button
              onClick={() => onLoadConfiguration(item.configuration)}
              className="text-gray-400 hover:text-yellow-400 transition-colors"
            >
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}