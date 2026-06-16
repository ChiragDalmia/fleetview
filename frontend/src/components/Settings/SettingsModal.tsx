import { useState } from "react";
import type { Settings } from "../../lib/settings";
import { saveSettings } from "../../lib/settings";

interface Props {
  settings: Settings;
  onClose: () => void;
  onSave: (s: Settings) => void;
}

export function SettingsModal({ settings, onClose, onSave }: Props) {
  const [key, setKey] = useState(settings.maptilerKey);

  function handleSave() {
    const next: Settings = { ...settings, maptilerKey: key.trim() };
    saveSettings(next);
    onSave(next);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>

        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
          MapTiler API Key (optional)
        </label>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Leave blank to use free tiles"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-blue-500 outline-none"
        />

        <div className="mt-3 text-xs text-gray-400 space-y-1.5 leading-relaxed">
          <p className="font-semibold text-gray-300">How to get a free key:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <a href="https://www.maptiler.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">maptiler.com</a> and sign up free.</li>
            <li>Open <span className="text-gray-300">Account → API Keys</span>.</li>
            <li>Copy your key and paste it above.</li>
          </ol>
          <p className="text-gray-500 pt-1">
            Stored only in this browser — never uploaded or sent to the backend. Leave blank to use free OpenFreeMap tiles.
          </p>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg py-2 transition-colors">
            Save
          </button>
          <button onClick={() => setKey("")} className="px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg py-2 transition-colors">
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
