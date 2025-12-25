import React from 'react';
import { Cloud } from './Icons';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 pb-0 flex flex-col items-center">
             <div className="bg-blue-100 p-3 rounded-full mb-4">
                 <Cloud className="w-8 h-8 text-blue-600" />
             </div>
             <h2 className="text-xl font-bold text-gray-800 text-center">Welcome to My Drive 1024 GB!</h2>
        </div>
        
        <div className="p-6 text-gray-600 space-y-4">
            <p>This is a secure place to store your data locally in your browser.</p>
            
            <div>
                <p className="font-semibold text-gray-800 mb-2">Features:</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Create Notes</li>
                    <li>Upload Files (simulated)</li>
                    <li>Generate AI Images using Nano Banana model</li>
                </ul>
            </div>
            
            <p className="font-medium text-blue-600 text-center pt-2">Enjoy your 1 Terabyte of free simulated space!</p>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Get Started
            </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;