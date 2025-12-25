import React, { useEffect, useState } from 'react';
import { Shield, Smartphone, Laptop, Tv, Monitor, Tablet, Lock } from './Icons';

interface PermissionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const [deviceType, setDeviceType] = useState('Device');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/SmartTV|TV|Web0S|Tizen|OAP-TV|Viera|SmartLabs-Console/.test(ua)) {
      setDeviceType('Smart TV');
    } else if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      setDeviceType('Tablet');
    } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      setDeviceType('Mobile Phone');
    } else {
      setDeviceType('Computer');
    }
  }, []);

  if (!isOpen) return null;

  const DeviceIcon = () => {
    switch (deviceType) {
      case 'Smart TV': return <Tv className="w-12 h-12 text-blue-500" />;
      case 'Tablet': return <Tablet className="w-12 h-12 text-blue-500" />;
      case 'Mobile Phone': return <Smartphone className="w-12 h-12 text-blue-500" />;
      default: return <Laptop className="w-12 h-12 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex flex-col items-center text-center">
           <div className="bg-blue-50 p-4 rounded-full mb-4 relative">
               <DeviceIcon />
               <div className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-white">
                   <Lock className="w-3 h-3 text-white" />
               </div>
           </div>
           
           <h2 className="text-xl font-bold text-gray-800 mb-2">Allow Access?</h2>
           <p className="text-gray-600 text-sm mb-4">
             "My Drive" would like to access photos, media, and files on your {deviceType} to upload content and save data.
           </p>

           <div className="flex flex-col w-full gap-3 mt-2">
             <button 
                onClick={onConfirm}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 active:scale-[0.98]"
             >
               Allow Access
             </button>
             <button 
                onClick={onCancel}
                className="w-full py-3 text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors active:scale-[0.98]"
             >
               Don't Allow
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;