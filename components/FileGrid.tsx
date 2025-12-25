import React, { useRef, useEffect, useState } from 'react';
import { DriveItem, FileType, ViewMode } from '../types';
import { ImageIcon, FileText, MoreVertical, Trash2, Star, File, Download, RotateCcw, Grid, Folder, Edit2 } from './Icons';
import { formatBytes } from '../services/storageService';

interface FileGridProps {
  items: DriveItem[];
  viewMode: ViewMode;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onToggleStar: (id: string) => void;
  onOpen: (item: DriveItem) => void;
  onDownload: (item: DriveItem) => void;
  onRename?: (id: string, newName: string) => void;
}

const FileGrid: React.FC<FileGridProps> = ({ items, viewMode, onDelete, onRestore, onToggleStar, onOpen, onDownload, onRename }) => {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Reset refs when items change to avoid stale references
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
  }, [items]);

  const startEditing = (item: DriveItem) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEditing = () => {
    if (editingId && editName.trim() && onRename) {
        onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  // Helper to determine number of columns based on window width
  const getGridColumns = () => {
    const width = window.innerWidth;
    if (width >= 1280) return 5; // xl:grid-cols-5
    if (width >= 1024) return 4; // lg:grid-cols-4
    if (width >= 768) return 3;  // md:grid-cols-3
    return 2;                    // grid-cols-2
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (editingId) return; // Don't navigate while editing

    // Determine number of columns
    const cols = viewMode === 'LIST' ? 1 : getGridColumns();
    const total = items.length;

    let nextIndex = index;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = Math.min(index + 1, total - 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = Math.max(index - 1, 0);
        break;
      case 'ArrowDown':
        e.preventDefault();
        // In list view or grid, down means next row
        nextIndex = Math.min(index + cols, total - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = Math.max(index - cols, 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (!items[index].isDeleted) {
          onOpen(items[index]);
        }
        break;
      case 'F2':
        e.preventDefault();
        if (!items[index].isDeleted && onRename) {
            startEditing(items[index]);
        }
        break;
      default:
        return;
    }

    if (nextIndex !== index && itemRefs.current[nextIndex]) {
      itemRefs.current[nextIndex]?.focus();
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-lg font-medium">No items found</p>
        <p className="text-sm">Upload files, create notes, or add folders to get started</p>
      </div>
    );
  }

  const getFileIconProps = (mimeType: string = '', name: string = '') => {
    const lowerName = name.toLowerCase();
    
    if (mimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
      return { color: 'bg-red-100 text-red-600', Icon: FileText, label: 'PDF' };
    }
    if (mimeType.includes('word') || mimeType.includes('document') || lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
      return { color: 'bg-blue-100 text-blue-600', Icon: FileText, label: 'DOC' };
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv') || lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) {
      return { color: 'bg-green-100 text-green-600', Icon: Grid, label: 'XLS' };
    }
    if (mimeType.includes('zip') || mimeType.includes('compressed') || lowerName.endsWith('.zip') || lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) {
      return { color: 'bg-orange-100 text-orange-600', Icon: File, label: 'ZIP' };
    }
    if (mimeType.includes('json') || lowerName.endsWith('.json') || lowerName.endsWith('.js') || lowerName.endsWith('.ts') || lowerName.endsWith('.html') || lowerName.endsWith('.css')) {
      return { color: 'bg-slate-100 text-slate-600', Icon: File, label: 'CODE' };
    }
    if (mimeType.includes('text') || lowerName.endsWith('.txt')) {
      return { color: 'bg-gray-100 text-gray-600', Icon: FileText, label: 'TXT' };
    }
    
    return { color: 'bg-blue-50 text-blue-500', Icon: File, label: 'FILE' };
  };

  const FileIcon = ({ item, minimal = false }: { item: DriveItem, minimal?: boolean }) => {
    if (item.type === FileType.FOLDER) {
        return (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                 <Folder className={`text-gray-500 fill-gray-200 ${minimal ? 'w-5 h-5' : 'w-12 h-12'}`} />
            </div>
        );
    }
    if (item.type === FileType.IMAGE && item.url) {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
             <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
        </div>
      );
    }
    if (item.type === FileType.IMAGE) {
        return <div className="w-full h-full bg-purple-100 flex items-center justify-center"><ImageIcon className={`text-purple-500 ${minimal ? 'w-5 h-5' : 'w-8 h-8'}`} /></div>;
    }
    if (item.type === FileType.NOTE) {
         return <div className="w-full h-full bg-yellow-50 flex items-center justify-center"><FileText className={`text-yellow-500 ${minimal ? 'w-5 h-5' : 'w-8 h-8'}`} /></div>;
    }
    const { color, Icon, label } = getFileIconProps(item.mimeType, item.name);
    return (
        <div className={`w-full h-full flex flex-col items-center justify-center ${color}`}>
            <Icon className={`${minimal ? 'w-5 h-5' : 'w-8 h-8 mb-1'}`} />
            {!minimal && <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</span>}
        </div>
    );
  };

  if (viewMode === 'LIST') {
    return (
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Last Modified</th>
              <th className="px-6 py-3 font-medium">Size</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item, index) => (
              <tr 
                key={item.id} 
                className="hover:bg-gray-50 group transition-colors focus:bg-blue-50 outline-none"
                tabIndex={0}
                ref={el => { itemRefs.current[index] = el as unknown as HTMLDivElement }}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3 cursor-pointer" onClick={() => !item.isDeleted && !editingId && onOpen(item)}>
                  <div className={`w-8 h-8 rounded overflow-hidden flex-shrink-0 ${item.isDeleted ? 'opacity-50 grayscale' : ''}`}>
                     <FileIcon item={item} minimal={true} />
                  </div>
                  {editingId === item.id ? (
                      <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') cancelEditing();
                            e.stopPropagation();
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="border border-blue-500 rounded px-1 py-0.5 outline-none text-sm w-full max-w-[300px]"
                      />
                  ) : (
                      <span className={item.isDeleted ? 'text-gray-500 line-through' : ''}>{item.name}</span>
                  )}
                </td>
                <td className="px-6 py-4">{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">{item.type === FileType.FOLDER ? '-' : formatBytes(item.size)}</td>
                <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!item.isDeleted && onRename && (
                           <button onClick={(e) => { e.stopPropagation(); startEditing(item); }} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-blue-600" title="Rename (F2)">
                              <Edit2 className="w-4 h-4" />
                           </button>
                        )}

                        {!item.isDeleted && item.type !== FileType.FOLDER && (
                          <button onClick={(e) => { e.stopPropagation(); onDownload(item); }} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-blue-600" title="Download">
                              <Download className="w-4 h-4" />
                          </button>
                        )}
                        
                        {item.isDeleted && onRestore ? (
                          <button onClick={(e) => { e.stopPropagation(); onRestore(item.id); }} className="p-1.5 rounded-full hover:bg-green-100 text-gray-400 hover:text-green-600" title="Restore">
                             <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }} className={`p-1.5 rounded-full hover:bg-gray-200 ${item.isFavorite ? 'text-yellow-400' : 'text-gray-400'}`} title="Star">
                              <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                        )}

                        <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1.5 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600" title={item.isDeleted ? "Delete Forever" : "Move to Trash"}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[400px] content-start">
      {items.map((item, index) => (
        <div 
          key={item.id} 
          ref={el => { itemRefs.current[index] = el }}
          tabIndex={0}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={`group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col focus:ring-2 focus:ring-blue-500 outline-none ${item.isDeleted ? 'opacity-75' : ''}`}
          onClick={() => !item.isDeleted && !editingId && onOpen(item)}
        >
          <div className={`h-40 w-full bg-gray-50 relative ${item.isDeleted ? 'grayscale' : ''} ${item.type === FileType.FOLDER ? 'flex items-center justify-center' : ''}`}>
             <FileIcon item={item} />
             {/* Overlay Actions */}
             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.isDeleted && (
                  <button 
                      onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }} 
                      className={`p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm ${item.isFavorite ? 'text-yellow-400' : 'text-gray-500'}`}
                  >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                )}
             </div>
             
             {/* Bottom Overlay Actions */}
             <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 {!item.isDeleted && onRename && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); startEditing(item); }} 
                        className="p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-500 hover:text-blue-600"
                        title="Rename"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                 )}
                 {!item.isDeleted && item.type !== FileType.FOLDER && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDownload(item); }} 
                        className="p-1.5 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-500 hover:text-blue-600"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                 )}
             </div>
          </div>
          
          <div className="p-3 flex items-center justify-between mt-auto bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 overflow-hidden w-full">
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    item.type === FileType.FOLDER ? 'bg-gray-100 text-gray-600' :
                    item.type === FileType.IMAGE ? 'bg-purple-100 text-purple-600' : 
                    item.type === FileType.NOTE ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-50 text-blue-500'
                }`}>
                    {item.type === FileType.FOLDER ? <Folder className="w-3 h-3" /> :
                     item.type === FileType.IMAGE ? <ImageIcon className="w-3 h-3" /> : 
                     item.type === FileType.NOTE ? <FileText className="w-3 h-3" /> : 
                     <File className="w-3 h-3" />}
                </div>
                
                {editingId === item.id ? (
                     <input 
                        type="text" 
                        value={editName} 
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={saveEditing}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditing();
                            if (e.key === 'Escape') cancelEditing();
                            e.stopPropagation();
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="border border-blue-500 rounded px-1 py-0.5 outline-none text-xs w-full"
                      />
                ) : (
                    <span className="text-sm font-medium text-gray-700 truncate">{item.name}</span>
                )}
            </div>
            
            {!editingId && (
                <div className="flex items-center flex-shrink-0 ml-1">
                {item.isDeleted && onRestore && (
                    <button 
                    onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}
                    className="p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Restore"
                    >
                    <RotateCcw className="w-4 h-4" />
                    </button>
                )}
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title={item.isDeleted ? "Delete Forever" : "Move to Trash"}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileGrid;