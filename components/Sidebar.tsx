import React from 'react';
import { HardDrive, ImageIcon, FileText, Star, Cpu, Trash2, X } from './Icons';
import { FilterType, StorageStats } from '../types';
import { formatBytes } from '../services/storageService';

// Logo URL
const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3143/3143160.png";

interface SidebarProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  storageStats: StorageStats;
  onOpenAI: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeFilter, onFilterChange, storageStats, onOpenAI, isOpen, onClose }) => {
  const usagePercent = (storageStats.used / storageStats.total) * 100;

  const handleNavClick = (filter: FilterType) => {
    onFilterChange(filter);
    onClose();
  };

  const NavItem = ({ filter, icon: Icon, label }: { filter: FilterType, icon: any, label: string }) => (
    <button
      onClick={() => handleNavClick(filter)}
      className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium rounded-r-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
        activeFilter === filter
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 ${activeFilter === filter ? 'text-blue-700' : 'text-gray-500'}`} />
      {label}
    </button>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 h-full flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-auto
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-full lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo Section */}
        <div className="p-6 flex flex-col items-center border-b border-gray-50 mb-4">
           <div className="relative group">
              <img 
                src={LOGO_URL} 
                alt="My Drive Logo" 
                className="w-16 h-16 mx-auto mb-2 object-contain"
              />
              <div className="text-center">
                 <h1 className="text-xl font-bold text-gray-800">My Drive</h1>
                 <span className="text-xs text-blue-600 font-semibold px-2 py-1 bg-blue-50 rounded-full mt-2 inline-block">1024 GB</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 pr-4 overflow-y-auto">
          <NavItem filter="ALL" icon={HardDrive} label="My Drive" />
          <NavItem filter="IMAGES" icon={ImageIcon} label="Images" />
          <NavItem filter="NOTES" icon={FileText} label="Notes" />
          <NavItem filter="FAVORITES" icon={Star} label="Starred" />
          <div className="my-2 border-t border-gray-100 mx-4"></div>
          <NavItem filter="TRASH" icon={Trash2} label="Recycle Bin" />
          
          <div className="mt-8 px-4">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tools</p>
            <button
              onClick={() => { onOpenAI(); onClose(); }}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
            >
              <Cpu className="w-5 h-5 mr-3" />
              Nano Banana
            </button>
          </div>
        </nav>

        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs text-gray-500">Storage used</span>
            <span className="text-xs font-semibold text-gray-700">{formatBytes(storageStats.used)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(usagePercent, 1)}%` }} // Minimum 1% for visibility
            ></div>
          </div>
          <p className="text-xs text-gray-400">of {formatBytes(storageStats.total)} used</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;