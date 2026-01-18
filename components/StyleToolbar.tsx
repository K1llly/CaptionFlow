import React, { useState } from 'react';
import { StyleConfig, AnimationType, Caption } from '../types';
import { FONTS, ANIMATIONS } from '../constants';
import { Palette, Layers, Globe } from 'lucide-react';
import { getEffectiveStyle } from '../utils';

interface StyleToolbarProps {
  globalConfig: StyleConfig;
  activeCaption?: Caption;
  onGlobalChange: (newConfig: StyleConfig) => void;
  onCaptionChange: (id: string, updates: Partial<Caption>) => void;
}

const StyleToolbar: React.FC<StyleToolbarProps> = ({ 
  globalConfig, 
  activeCaption, 
  onGlobalChange, 
  onCaptionChange 
}) => {
  const [editMode, setEditMode] = useState<'global' | 'current'>('global');

  // Determine what values to show in the inputs
  // If 'current' mode and a caption is active, show the merged effective style.
  // Otherwise show global style.
  const displayConfig = (editMode === 'current' && activeCaption) 
    ? getEffectiveStyle(globalConfig, activeCaption)
    : globalConfig;

  const handleChange = <K extends keyof StyleConfig>(key: K, value: StyleConfig[K]) => {
    if (editMode === 'global') {
      onGlobalChange({ ...globalConfig, [key]: value });
    } else {
      if (activeCaption) {
        // Save ONLY the override to the caption style
        onCaptionChange(activeCaption.id, {
          style: {
            ...activeCaption.style,
            [key]: value
          }
        });
      }
    }
  };

  const handleResetCurrent = () => {
    if (activeCaption) {
      onCaptionChange(activeCaption.id, { style: undefined });
    }
  }

  return (
    <div className="bg-slate-800 border-l border-slate-700 w-80 flex flex-col h-full overflow-y-auto p-4 text-sm">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Palette size={18} className="text-blue-400" /> Style Editor
      </h3>

      {/* Mode Toggle */}
      <div className="bg-slate-900 p-1 rounded-lg flex mb-6 border border-slate-700">
        <button
          onClick={() => setEditMode('global')}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            editMode === 'global' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe size={12} /> Global
        </button>
        <button
          onClick={() => setEditMode('current')}
          disabled={!activeCaption}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
            editMode === 'current' 
                ? 'bg-blue-600 text-white shadow' 
                : !activeCaption 
                    ? 'text-slate-600 cursor-not-allowed' 
                    : 'text-slate-400 hover:text-slate-200'
          }`}
          title={!activeCaption ? "No caption active" : "Edit current caption only"}
        >
          <Layers size={12} /> Current
        </button>
      </div>

      {editMode === 'current' && !activeCaption && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200 text-xs">
          Select a caption on the timeline or scrub the video to edit individual styles.
        </div>
      )}

      {editMode === 'current' && activeCaption && (
         <div className="mb-4 flex justify-end">
            <button 
                onClick={handleResetCurrent}
                className="text-xs text-red-400 hover:text-red-300 underline"
            >
                Reset to Global Defaults
            </button>
         </div>
      )}

      <div className={`space-y-6 ${editMode === 'current' && !activeCaption ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Font */}
        <div className="space-y-2">
          <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Typography</label>
          <div className="grid grid-cols-1 gap-2">
            <select
              value={displayConfig.fontFamily}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
              className="bg-slate-900 text-white p-2 rounded border border-slate-700 focus:border-blue-500 outline-none"
            >
              {FONTS.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
            <div className="flex gap-2">
                <input
                    type="number"
                    value={displayConfig.fontSize}
                    onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                    className="bg-slate-900 text-white p-2 rounded border border-slate-700 w-full"
                    placeholder="Size"
                />
                 <select
                    value={displayConfig.fontWeight}
                    onChange={(e) => handleChange('fontWeight', e.target.value)}
                    className="bg-slate-900 text-white p-2 rounded border border-slate-700 w-full"
                >
                    <option value="400">Normal</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                </select>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2">
          <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Colors</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Text</label>
              <div className="flex items-center gap-2">
                 <input
                  type="color"
                  value={displayConfig.textColor}
                  onChange={(e) => handleChange('textColor', e.target.value)}
                  className="bg-transparent w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs text-slate-300">{displayConfig.textColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Stroke</label>
              <div className="flex items-center gap-2">
                 <input
                  type="color"
                  value={displayConfig.borderColor}
                  onChange={(e) => handleChange('borderColor', e.target.value)}
                  className="bg-transparent w-8 h-8 rounded cursor-pointer"
                />
                 <span className="text-xs text-slate-300">{displayConfig.borderColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Background</label>
               <div className="flex items-center gap-2">
                 <input
                  type="color"
                  value={displayConfig.backgroundColor}
                  onChange={(e) => handleChange('backgroundColor', e.target.value)}
                  className="bg-transparent w-8 h-8 rounded cursor-pointer"
                />
                 <span className="text-xs text-slate-300">{displayConfig.backgroundColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-2">
          <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Appearance</label>
          <div className="space-y-3">
             <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Stroke Width</span>
                    <span>{displayConfig.borderWidth}px</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="10"
                    value={displayConfig.borderWidth}
                    onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
            <div>
                 <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Bg Opacity</span>
                    <span>{(displayConfig.backgroundOpacity * 100).toFixed(0)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={displayConfig.backgroundOpacity}
                    onChange={(e) => handleChange('backgroundOpacity', Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
             <div>
                 <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Vertical Position</span>
                    <span>{displayConfig.positionY.toFixed(0)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={displayConfig.positionY}
                    onChange={(e) => handleChange('positionY', Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
             <div>
                 <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Horizontal Position</span>
                    <span>{displayConfig.positionX.toFixed(0)}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={displayConfig.positionX}
                    onChange={(e) => handleChange('positionX', Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>
          </div>
        </div>

        {/* Animation */}
        <div className="space-y-2">
          <label className="text-slate-400 text-xs uppercase font-bold tracking-wider">Animation</label>
          <select
            value={displayConfig.animationType}
            onChange={(e) => handleChange('animationType', e.target.value as AnimationType)}
            className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700 focus:border-blue-500 outline-none"
          >
            {ANIMATIONS.map(anim => (
              <option key={anim.value} value={anim.value}>{anim.label}</option>
            ))}
          </select>
           {displayConfig.animationType === AnimationType.KARAOKE_HIGHLIGHT && (
               <p className="text-xs text-yellow-500/80 mt-1">Highlights text when active (Karaoke style)</p>
           )}
        </div>

      </div>
    </div>
  );
};

export default StyleToolbar;