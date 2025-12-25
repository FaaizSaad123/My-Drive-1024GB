import React, { useState } from 'react';
import { X, Cpu, Loader2, Download, Cloud } from './Icons';
import { generateNanoBananaImage } from '../services/geminiService';
import { DriveItem, FileType } from '../types';
import { saveItem } from '../services/storageService';

interface GenAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSaved: () => void;
  onShowToast?: (message: string) => void;
}

const GenAIModal: React.FC<GenAIModalProps> = ({ isOpen, onClose, onImageSaved, onShowToast }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const base64Image = await generateNanoBananaImage(prompt, aspectRatio);
      if (base64Image) {
        setGeneratedImage(base64Image);
      } else {
        setError("Failed to generate image. Try a different prompt.");
      }
    } catch (err) {
      setError("An error occurred while communicating with Nano Banana.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!generatedImage) return;
    setIsSaving(true);

    try {
      const newItem: DriveItem = {
        id: crypto.randomUUID(),
        name: `AI-${prompt.slice(0, 15).replace(/\s+/g, '-')}-${Date.now()}.png`,
        type: FileType.IMAGE,
        size: Math.round(generatedImage.length * 0.75), // Approx size in bytes
        createdAt: Date.now(),
        url: generatedImage,
        mimeType: 'image/png'
      };

      await saveItem(newItem);
      onImageSaved();
      if (onShowToast) {
        onShowToast("Image saved successfully to Drive!");
      }
      onClose();
      // Reset state
      setPrompt('');
      setGeneratedImage(null);
      setAspectRatio('1:1');
    } catch (e) {
      setError("Failed to save image.");
    } finally {
      setIsSaving(false);
    }
  };

  const ratios = [
    { label: 'Square (1:1)', value: '1:1' },
    { label: 'Landscape (4:3)', value: '4:3' },
    { label: 'Portrait (3:4)', value: '3:4' },
    { label: 'Widescreen (16:9)', value: '16:9' },
    { label: 'Mobile (9:16)', value: '9:16' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cpu className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Nano Banana</h2>
              <p className="text-xs text-purple-600 font-medium">Image Generator</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to create?
          </label>
          <div className="relative mb-4">
            <textarea
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-gray-700 bg-gray-50 h-28 transition-all"
              placeholder="E.g., A futuristic city made of crystals..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              gemini-2.5-flash-image
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <div className="flex flex-wrap gap-2">
              {ratios.map((ratio) => (
                <button
                  key={ratio.value}
                  onClick={() => setAspectRatio(ratio.value)}
                  disabled={isGenerating}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    aspectRatio === ratio.value
                      ? 'bg-purple-100 border-purple-200 text-purple-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {generatedImage && (
            <div className="mt-6 animate-in fade-in duration-300">
              <div className="w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group shadow-inner flex items-center justify-center">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="max-w-full max-h-[300px] object-contain"
                />
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">Generated by Nano Banana</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          {!generatedImage ? (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${
                !prompt.trim() || isGenerating
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Dreaming...
                </>
              ) : (
                'Generate Image'
              )}
            </button>
          ) : (
            <>
              <button
                onClick={() => setGeneratedImage(null)}
                disabled={isSaving}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveToDrive}
                disabled={isSaving}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:bg-blue-400"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Cloud className="w-4 h-4 mr-2" />}
                {isSaving ? 'Saving...' : 'Save to Drive'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenAIModal;