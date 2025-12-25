import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import FileGrid from './components/FileGrid';
import GenAIModal from './components/GenAIModal';
import NoteEditor from './components/NoteEditor';
import PreviewModal from './components/PreviewModal';
import WelcomeModal from './components/WelcomeModal';
import CreateFolderModal from './components/CreateFolderModal';
import PermissionModal from './components/PermissionModal';
import Toast from './components/Toast';
import { Search, Grid, List, Plus, FileText, Loader2, Menu, FolderPlus, ChevronRight } from './components/Icons';
import { DriveItem, FileType, FilterType, ViewMode, StorageStats } from './types';
import { getItems, deleteItem, softDeleteItem, restoreItem, toggleFavorite, getStorageStats, saveItem, renameItem } from './services/storageService';

const App: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [items, setItems] = useState<DriveItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DriveItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageStats, setStorageStats] = useState<StorageStats>({ used: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Folder Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{id: string | null, name: string}[]>([
    { id: null, name: 'My Drive' }
  ]);

  // Modal States
  const [isGenAIModalOpen, setIsGenAIModalOpen] = useState(false);
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DriveItem | null>(null);
  const [previewItem, setPreviewItem] = useState<DriveItem | null>(null);

  // Permission State
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, visible: false }));
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allItems = await getItems();
      setItems(allItems);
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error("Failed to refresh data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    
    // Check for first time welcome modal
    const hasSeenWelcome = localStorage.getItem('welcome_shown');
    if (!hasSeenWelcome) {
        setIsWelcomeModalOpen(true);
    }
    
    // Check if permission was previously granted in session (simulated persistence for UX)
    // For stricter simulation, we could reset this on reload, but keeping it per session is nicer.
    const hasPerm = sessionStorage.getItem('device_permission_granted');
    if (hasPerm === 'true') {
        setPermissionGranted(true);
    }
  }, [refreshData]);

  const checkPermission = (action: () => void) => {
    if (permissionGranted) {
      action();
    } else {
      setPendingAction(() => action);
      setIsPermissionModalOpen(true);
    }
  };

  const handlePermissionConfirm = () => {
    setPermissionGranted(true);
    sessionStorage.setItem('device_permission_granted', 'true');
    setIsPermissionModalOpen(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    showToast("Device access granted");
  };

  const handlePermissionCancel = () => {
    setIsPermissionModalOpen(false);
    setPendingAction(null);
  };

  const handleCloseWelcome = () => {
    localStorage.setItem('welcome_shown', 'true');
    setIsWelcomeModalOpen(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable shortcuts if any modal is open
      if (isNoteEditorOpen || isGenAIModalOpen || isCreateFolderModalOpen || isWelcomeModalOpen || previewItem || isPermissionModalOpen) {
        return;
      }

      // New Note: Ctrl + Shift + A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        checkPermission(() => {
            setEditingNote(null);
            setIsNoteEditorOpen(true);
        });
      }

      // New Folder: Ctrl + Shift + N
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        checkPermission(() => {
            setIsCreateFolderModalOpen(true);
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNoteEditorOpen, isGenAIModalOpen, isCreateFolderModalOpen, isWelcomeModalOpen, previewItem, isPermissionModalOpen, permissionGranted]);

  useEffect(() => {
    let result = items;

    if (activeFilter === 'TRASH') {
      result = result.filter(i => i.isDeleted);
    } else {
      result = result.filter(i => !i.isDeleted);

      if (activeFilter === 'IMAGES') {
        result = result.filter(i => i.type === FileType.IMAGE);
      } else if (activeFilter === 'NOTES') {
        result = result.filter(i => i.type === FileType.NOTE);
      } else if (activeFilter === 'FAVORITES') {
        result = result.filter(i => i.isFavorite);
      } else if (activeFilter === 'ALL') {
        // Only in "My Drive" do we respect folder hierarchy
        if (searchQuery) {
            // If searching, show all matching files across all folders
            // No additional filtering based on parentId
        } else {
            // Standard hierarchical view
            result = result.filter(i => {
                if (currentFolderId === null) {
                    return !i.parentId; // items with no parent (root)
                }
                return i.parentId === currentFolderId;
            });
        }
      }
    }

    if (searchQuery) {
      result = result.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    setFilteredItems(result);
  }, [items, activeFilter, searchQuery, currentFolderId]);

  const handleDelete = async (id: string) => {
    const isTrashView = activeFilter === 'TRASH';
    const message = isTrashView 
      ? 'Are you sure you want to permanently delete this item?' 
      : 'Move this item to Recycle Bin?';

    if (confirm(message)) {
      if (isTrashView) {
        await deleteItem(id);
      } else {
        await softDeleteItem(id);
      }
      refreshData();
    }
  };

  const handleRestore = async (id: string) => {
    await restoreItem(id);
    refreshData();
  };

  const handleToggleStar = async (id: string) => {
    await toggleFavorite(id);
    refreshData();
  };

  const handleRename = async (id: string, newName: string) => {
    await renameItem(id, newName);
    refreshData();
  };

  const handleDownload = (item: DriveItem) => {
    const link = document.createElement('a');
    link.download = item.name;

    if (item.type === FileType.NOTE && item.content) {
      const blob = new Blob([item.content], { type: 'text/plain' });
      link.href = URL.createObjectURL(blob);
    } else if (item.url) {
      link.href = item.url;
    } else {
      return;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (item.type === FileType.NOTE) {
      URL.revokeObjectURL(link.href);
    }
  };

  const handleUploadClick = () => {
    checkPermission(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);

    try {
      const filePromises = Array.from(files).map((file: File) => {
        return new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const result = e.target?.result as string;
            const isImage = file.type.startsWith('image/');
            const isText = file.type.startsWith('text/');
            
            const newItem: DriveItem = {
              id: crypto.randomUUID(),
              name: file.name,
              type: isImage ? FileType.IMAGE : isText ? FileType.NOTE : FileType.FILE,
              size: file.size,
              createdAt: Date.now(),
              mimeType: file.type,
              url: result,
              content: isText ? atob(result.split(',')[1]) : undefined,
              isDeleted: false,
              parentId: currentFolderId
            };
            
            await saveItem(newItem);
            resolve();
          };
          reader.readAsDataURL(file); 
        });
      });

      await Promise.all(filePromises);
      await refreshData();
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload files.");
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleCreateFolder = async (name: string) => {
    const newFolder: DriveItem = {
      id: crypto.randomUUID(),
      name,
      type: FileType.FOLDER,
      size: 0,
      createdAt: Date.now(),
      isDeleted: false,
      parentId: currentFolderId
    };

    await saveItem(newFolder);
    refreshData();
  };

  const handleItemClick = (item: DriveItem) => {
    if (item.type === FileType.FOLDER) {
        // Navigate into folder
        setCurrentFolderId(item.id);
        setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
        setSearchQuery(''); // Clear search when navigating
    } else if (item.type === FileType.NOTE) {
      checkPermission(() => {
        setEditingNote(item);
        setIsNoteEditorOpen(true);
      });
    } else if (item.type === FileType.IMAGE) {
      setPreviewItem(item);
    } else {
       // Check for files that can be previewed
       const isPdf = item.mimeType?.includes('pdf') || item.name.toLowerCase().endsWith('.pdf');
       const isTextLike = item.mimeType?.includes('text') || 
                          item.mimeType?.includes('json') || 
                          item.mimeType?.includes('javascript') ||
                          item.name.match(/\.(txt|md|json|js|ts|css|html|xml|csv)$/i);
       
       if (isPdf || isTextLike) {
           setPreviewItem(item);
       } else {
           handleDownload(item);
       }
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    // Reset folder navigation when switching main filters, 
    // but keep it if clicking "My Drive" again (logic handled in Sidebar usually)
    if (filter !== 'ALL') {
        setCurrentFolderId(null);
        setBreadcrumbs([{ id: null, name: 'My Drive' }]);
    }
  };

  const handleCreateNoteTrigger = () => {
    checkPermission(() => {
        setEditingNote(null);
        setIsNoteEditorOpen(true);
    });
  };
  
  const handleCreateFolderTrigger = () => {
      checkPermission(() => {
          setIsCreateFolderModalOpen(true);
      });
  };

  const handleNoteSaved = () => {
    refreshData();
    setEditingNote(null);
  };

  const handleOpenAITrigger = () => {
      checkPermission(() => {
          setIsGenAIModalOpen(true);
      });
  };

  if (isLoading && !items.length) {
      return (
          <div className="flex h-screen items-center justify-center bg-gray-50">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600 font-medium">Loading files...</span>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar 
        activeFilter={activeFilter} 
        onFilterChange={handleFilterChange}
        storageStats={storageStats}
        onOpenAI={handleOpenAITrigger}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center flex-1 max-w-2xl">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 mr-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center flex-1 bg-gray-100 rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
              <Search className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search in Drive" 
                className="bg-transparent border-none outline-none w-full text-sm text-gray-700 placeholder-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 ml-3">
             <div className="hidden sm:flex bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`p-1.5 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode === 'LIST' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode === 'GRID' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
             </div>
          </div>
        </header>

        {/* Action Bar */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                {activeFilter === 'ALL' && breadcrumbs.length > 1 ? (
                    <nav className="flex items-center text-sm">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.id || 'root'}>
                                {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
                                <button 
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className={`hover:bg-gray-100 px-2 py-1 rounded transition-colors ${index === breadcrumbs.length - 1 ? 'font-bold text-gray-800' : 'text-gray-600'}`}
                                >
                                    {crumb.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </nav>
                ) : (
                    <>
                    {activeFilter === 'ALL' ? 'My Drive' : 
                    activeFilter === 'IMAGES' ? 'Images' : 
                    activeFilter === 'NOTES' ? 'Notes' : 
                    activeFilter === 'TRASH' ? 'Recycle Bin' : 'Starred'}
                    </>
                )}
            </h2>
          </div>

          {activeFilter !== 'TRASH' && (
              <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                 <button 
                   onClick={handleCreateFolderTrigger}
                   title="New Folder (Ctrl+Shift+N)"
                   className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                 </button>

                 <button 
                   onClick={handleCreateNoteTrigger}
                   title="New Note (Ctrl+Shift+A)"
                   className="flex-1 sm:flex-none justify-center flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 >
                    <FileText className="w-4 h-4 mr-2" />
                    New Note
                 </button>
                 
                 <button 
                    onClick={handleUploadClick}
                    className={`flex-1 sm:flex-none justify-center flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isUploading ? 'opacity-75 cursor-wait' : ''}`}
                    disabled={isUploading}
                 >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    {isUploading ? 'Uploading...' : 'Upload File'}
                 </button>
                 <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    multiple 
                    disabled={isUploading} 
                 />
              </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 scroll-smooth">
          <FileGrid 
            items={filteredItems} 
            viewMode={viewMode}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onToggleStar={handleToggleStar}
            onOpen={handleItemClick}
            onDownload={handleDownload}
            onRename={handleRename}
          />
        </div>
      </div>

      {/* Modals */}
      <GenAIModal 
        isOpen={isGenAIModalOpen} 
        onClose={() => setIsGenAIModalOpen(false)}
        onImageSaved={refreshData}
        onShowToast={showToast}
      />

      <NoteEditor 
        isOpen={isNoteEditorOpen}
        onClose={() => setIsNoteEditorOpen(false)}
        onSaved={handleNoteSaved}
        initialItem={editingNote}
      />
      
      <CreateFolderModal 
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        onCreate={handleCreateFolder}
      />

      <PreviewModal 
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <PermissionModal 
        isOpen={isPermissionModalOpen}
        onConfirm={handlePermissionConfirm}
        onCancel={handlePermissionCancel}
      />

      <WelcomeModal 
        isOpen={isWelcomeModalOpen}
        onClose={handleCloseWelcome}
      />
      
      <Toast 
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </div>
  );
};

export default App;