import React, { useState, useEffect } from 'react';
import { QrCode, MapPin, Phone, Shield, AlertTriangle, Globe, Battery, Wifi, Signal } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LiveLocationMap from './LiveLocationMap';

interface MobileAppProps {
  onPanicTrigger: () => void;
}

const MobileApp: React.FC<MobileAppProps> = ({ onPanicTrigger }) => {
  const { language, setLanguage, t } = useLanguage();
  const [safetyScore, setSafetyScore] = useState(85);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [callInitiated, setCallInitiated] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate dynamic safety score
      setSafetyScore(prev => Math.max(70, Math.min(95, prev + (Math.random() - 0.5) * 2)));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSafetyBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleEmergencyCall = () => {
    if (isEmergencyActive || callInitiated) return;
    
    setIsEmergencyActive(true);
    setCallInitiated(true);
    
    // Create emergency call link
    const emergencyNumber = "918822683839";
    const callLink = document.createElement('a');
    callLink.href = `tel:+${emergencyNumber}`;
    callLink.style.display = 'none';
    document.body.appendChild(callLink);
    
    // Add haptic feedback for mobile devices
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
    // Trigger the call immediately
    setTimeout(() => {
      callLink.click();
      document.body.removeChild(callLink);
      
      // Also trigger the panic alert flow
      onPanicTrigger();
      
      // Reset states after a delay
      setTimeout(() => {
        setIsEmergencyActive(false);
        setCallInitiated(false);
      }, 3000);
    }, 100);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-gray-900 dark:bg-black rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">
      {/* Status Bar */}
      <div className="bg-black dark:bg-gray-900 px-6 py-2 flex justify-between items-center text-white text-sm">
        <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-1">
          <Signal className="w-4 h-4" />
          <Wifi className="w-4 h-4" />
          <Battery className="w-4 h-4" />
          <span>89%</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">{t.travelSafetyId}</h1>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="EN" className="bg-gray-800">EN</option>
              <option value="fr" className="bg-gray-800">FR</option>
              <option value="de" className="bg-gray-800">DE</option>
              <option value="ja" className="bg-gray-800">日本</option>
              <option value="hi" className="bg-gray-800">हिं</option>
              <option value="ES" className="bg-gray-800">ES</option>
            </select>
          </div>
        </div>

        {/* Digital ID Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-white/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold">Raj Kumar Sharma</h2>
              <p className="text-sm text-blue-200">{t.touristId}: IND-2024-789</p>
              <p className="text-xs text-gray-300">{t.expires}: December 31, 2024</p>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <QrCode className="w-12 h-12 text-black" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${getSafetyColor(safetyScore)}`} />
              <span className="text-sm">{t.safetyScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-12 h-2 ${getSafetyBg(safetyScore)} rounded-full`}></div>
              <span className={`font-bold ${getSafetyColor(safetyScore)}`}>{Math.round(safetyScore)}%</span>
            </div>
          </div>
        </div>

        {/* Live Location Map */}
        <div className="mb-6">
          <LiveLocationMap
            userLocation={userLocation || undefined}
            onLocationUpdate={(location) => setUserLocation(location)}
          />
        </div>

        {/* Current Location & Alert */}
        <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{t.currentArea}</span>
          </div>
          {userLocation ? (
            <>
              <p className="text-xs text-green-200">
                Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}
              </p>
              <p className="text-xs text-gray-300 mt-1">{t.lastUpdate}: {currentTime.toLocaleTimeString()}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-green-200">{t.indiaGate}, {t.newDelhi} - {t.lowRiskArea}</p>
              <p className="text-xs text-gray-300 mt-1">{t.lastUpdate}: {currentTime.toLocaleTimeString()}</p>
            </>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/20">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {t.emergencyContacts}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{t.localEmergency}</span>
              <span className="text-red-300">100</span>
            </div>
            <div className="flex justify-between">
              <span>{t.touristHelpline}</span>
              <span className="text-blue-300">1363</span>
            </div>
            <div className="flex justify-between">
              <span>{t.embassy}</span>
              <span className="text-yellow-300">+91-11-2419-8000</span>
            </div>
          </div>
        </div>

        {/* Today's Itinerary */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/20">
          <h3 className="text-sm font-medium mb-3">{t.todaysItinerary}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>10:00 AM - {t.redFort} ({t.completed})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>2:00 PM - {t.indiaGate} ({t.current})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>6:00 PM - {t.connaught}</span>
            </div>
          </div>
        </div>

        {/* Panic Button */}
        <button
          onClick={handleEmergencyCall}
          disabled={isEmergencyActive}
          className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 transform shadow-lg active:scale-95 ${
            isEmergencyActive 
              ? 'bg-red-800 text-red-200 cursor-not-allowed animate-pulse' 
              : 'bg-red-600 hover:bg-red-700 text-white hover:scale-105 hover:shadow-red-600/50 active:shadow-red-700/60'
          } 
          focus:outline-none focus:ring-4 focus:ring-red-500/50 
          sm:py-5 sm:text-lg
          touch-manipulation select-none`}
          style={{ 
            minHeight: '60px',
            WebkitTapHighlightColor: 'transparent',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <AlertTriangle className={`w-6 h-6 sm:w-7 sm:h-7 ${isEmergencyActive ? 'animate-bounce' : ''}`} />
          <span className="font-extrabold tracking-wide">
            {isEmergencyActive ? 'CALLING EMERGENCY...' : t.emergencyPanicButton}
          </span>
        </button>
        
        <div className="text-center mt-3 space-y-1">
          <p className="text-xs text-gray-400">
            {isEmergencyActive ? 'Emergency call initiated to +91 8822683839' : t.tapForEmergencyResponse}
          </p>
          <p className="text-xs text-red-400 font-medium">
            🚨 Direct call to: +91 8822683839
          </p>
        </div>
        
        {/* Emergency Instructions */}
        <div className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-red-300 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Emergency Protocol
          </h4>
          <ul className="text-xs text-red-200 space-y-1">
            <li>• Calls emergency contact immediately</li>
            <li>• Shares your live location</li>
            <li>• Alerts local authorities</li>
            <li>• Activates emergency response</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileApp;