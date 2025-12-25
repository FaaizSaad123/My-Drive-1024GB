import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Download } from './Icons';
import { DriveItem, FileType } from '../types';
import { saveItem } from '../services/storageService';

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialItem?: DriveItem | null;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ isOpen, onClose, onSaved, initialItem }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.name.replace('.txt', ''));
      setContent(initialItem.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
        alert("Please enter a title");
        return;
    }
    
    setIsSaving(true);
    
    try {
        const item: DriveItem = {
          id: initialItem ? initialItem.id : crypto.randomUUID(),
          name: title.endsWith('.txt') ? title : `${title}.txt`,
          type: FileType.NOTE,
          size: new Blob([content]).size,
          createdAt: Date.now(), 
          content: content,
          mimeType: 'text/plain',
          isFavorite: initialItem?.isFavorite || false,
          isDeleted: initialItem?.isDeleted || false,
        };

        await saveItem(item);
        onSaved();
        onClose();
    } catch (e) {
        console.error("Error saving note", e);
        alert("Failed to save note");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = title.endsWith('.txt') ? title : `${title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 transition-all">
      <div className="bg-white md:rounded-xl shadow-2xl w-full max-w-2xl h-full md:h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
            <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Note"
                className="text-xl font-bold text-gray-800 outline-none w-full bg-transparent min-w-0"
            />
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                 <button 
                    onClick={handleDownload}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Download Note"
                 >
                    <Download className="w-5 h-5" />
                 </button>
                 <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 font-medium text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                 >
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                 </button>
                 <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
                 <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <X className="w-5 h-5" />
                 </button>
            </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing your note here..."
                className="w-full h-full resize-none outline-none text-gray-700 leading-relaxed text-lg p-2"
                autoFocus
            />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;