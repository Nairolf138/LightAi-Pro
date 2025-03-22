import React, { useState, useEffect } from 'react';
import { Save, Trash2, Share2 } from 'lucide-react';
import { supabase, type Preset } from '../lib/supabase';
import toast from 'react-hot-toast';

type PresetManagerProps = {
  userId: string;
  currentConfiguration: Record<string, any>;
  onLoadPreset: (configuration: Record<string, any>) => void;
};

export function PresetManager({ userId, currentConfiguration, onLoadPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPresets();
  }, [userId]);

  const fetchPresets = async () => {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load presets');
      return;
    }

    setPresets(data || []);
  };

  const savePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const { error } = await supabase
      .from('presets')
      .insert([{
        user_id: userId,
        name: newPresetName.trim(),
        configuration: currentConfiguration
      }]);

    if (error) {
      toast.error('Failed to save preset');
      return;
    }

    toast.success('Preset saved successfully');
    setNewPresetName('');
    setIsCreating(false);
    fetchPresets();
  };

  const deletePreset = async (presetId: string) => {
    const { error } = await supabase
      .from('presets')
      .delete()
      .eq('id', presetId);

    if (error) {
      toast.error('Failed to delete preset');
      return;
    }

    toast.success('Preset deleted');
    fetchPresets();
  };

  const sharePreset = async (preset: Preset) => {
    const shareUrl = `${window.location.origin}/preset/${preset.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">My Presets</h3>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors"
        >
          Save Current
        </button>
      </div>

      {isCreating && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Preset name"
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
          />
          <button
            onClick={savePreset}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <button
              onClick={() => onLoadPreset(preset.configuration)}
              className="flex-1 text-left hover:text-yellow-400 transition-colors"
            >
              {preset.name}
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => sharePreset(preset)}
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => deletePreset(preset.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}