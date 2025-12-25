import React, { useEffect, useState } from 'react';
import { X, Download, FileText } from './Icons';
import { DriveItem, FileType } from '../types';

interface PreviewModalProps {
  item: DriveItem | null;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  const [textContent, setTextContent] = useState<string | null>(null);

  const isTextFile = (item: DriveItem) => {
    const name = item.name.toLowerCase();
    const mime = item.mimeType?.toLowerCase() || '';
    return item.type === FileType.NOTE || 
           mime.includes('text') || 
           mime.includes('json') || 
           mime.includes('javascript') || 
           mime.includes('xml') ||
           name.endsWith('.txt') ||
           name.endsWith('.md') ||
           name.endsWith('.json') ||
           name.endsWith('.js') ||
           name.endsWith('.ts') ||
           name.endsWith('.css') ||
           name.endsWith('.html') ||
           name.endsWith('.xml') ||
           name.endsWith('.csv');
  };

  useEffect(() => {
    if (item && isTextFile(item)) {
        if (item.content) {
            setTextContent(item.content);
        } else if (item.url) {
            try {
                // Handle base64 data url
                const base64 = item.url.split(',')[1];
                if (base64) {
                     // Handle UTF-8 characters correctly
                     const decoded = decodeURIComponent(escape(window.atob(base64)));
                     setTextContent(decoded);
                } else {
                    setTextContent("No content available.");
                }
            } catch (e) {
                console.error("Error decoding file content", e);
                setTextContent("Error displaying file content. Try downloading it.");
            }
        }
    } else {
        setTextContent(null);
    }
  }, [item]);

  if (!item) return null;

  const isPdf = item.mimeType?.includes('pdf') || item.name.toLowerCase().endsWith('.pdf');
  const isImage = item.type === FileType.IMAGE;
  const isText = isTextFile(item);

  // Fallback for unsupported types if they somehow get here
  if (!isPdf && !isImage && !isText) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      <div 
        className={`relative flex flex-col items-center max-h-full w-full ${isImage ? 'max-w-5xl' : 'max-w-4xl h-[85vh]'}`} 
        onClick={e => e.stopPropagation()}
      >
         {/* Content Area */}
         <div className="flex-1 w-full overflow-hidden flex items-center justify-center bg-transparent relative rounded-lg">
             {isImage && (
                 <img 
                    src={item.url} 
                    alt={item.name} 
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white"
                 />
             )}

             {isPdf && item.url && (
                 <iframe 
                    src={item.url} 
                    className="w-full h-full bg-white rounded-lg shadow-2xl"
                    title={item.name}
                 />
             )}

             {isText && (
                 <div className="w-full h-full bg-white rounded-lg p-6 overflow-auto shadow-2xl text-left">
                     <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-words">{textContent || "Loading..."}</pre>
                 </div>
             )}
         </div>

         {/* Footer / Actions */}
         <div className="mt-4 flex items-center justify-between w-full px-4 text-white">
             <div className="flex items-center gap-2">
                {isText ? <FileText className="w-5 h-5" /> : null}
                <p className="font-medium text-lg truncate max-w-md">{item.name}</p>
             </div>
             
             <a 
                href={item.url} 
                download={item.name}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center px-4 py-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-colors font-medium text-sm"
            >
                <Download className="w-4 h-4 mr-2" />
                Download
             </a>
         </div>
      </div>
    </div>
  );
};

export default PreviewModal;