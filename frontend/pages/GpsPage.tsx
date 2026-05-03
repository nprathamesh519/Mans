import React, { useState, useEffect } from 'react';
import { useGpsStore } from '../store/gpsStore';
import { useAuthStore } from '../store/authStore';
import { MapPinIcon, SparklesIcon, SpinnerIcon } from '../components/icons/Icons';
import { AIService } from '../services/aiService';
import Button from '../components/ui/Button';

const GpsPage: React.FC = () => {
  const { patientLocation } = useGpsStore();
  const { user } = useAuthStore();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeCurrentLocation = async () => {
    setLoading(true);
    try {
      const result = await AIService.analyzeLocation(
        patientLocation.location.lat,
        patientLocation.location.lng,
        user?.name || "the patient"
      );
      setAnalysis(result.text || "Unable to determine exact surroundings.");
      setSources(result.sources);
    } catch (e) {
      console.error(e);
      setAnalysis("Error connecting to location services.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Live Patient Monitor</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-8 flex flex-col items-center justify-center bg-white/60 min-h-[300px]">
          <div className="w-16 h-16 text-brand-primary mb-4">
            <MapPinIcon />
          </div>
          <p className="font-bold text-xl">Current Position</p>
          <div className="mt-4 p-4 bg-slate-100 rounded-2xl font-mono text-brand-text">
            {patientLocation.location.lat.toFixed(6)}, {patientLocation.location.lng.toFixed(6)}
          </div>
          <p className="text-sm text-brand-text-light mt-4">
            Last updated: {new Date(patientLocation.timestamp).toLocaleTimeString()}
          </p>
          <Button 
            className="mt-8 w-full gap-2" 
            onClick={analyzeCurrentLocation}
            loading={loading}
            leftIcon={<SparklesIcon />}
          >
            Analyze Surroundings
          </Button>
        </div>

        <div className="glass-card p-8 bg-brand-primary/5 border-brand-primary/20">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <SparklesIcon /> AI Interpretation
          </h3>
          {analysis ? (
            <div className="space-y-4">
              <p className="text-brand-text leading-relaxed italic">"{analysis}"</p>
              {sources.length > 0 && (
                <div className="pt-4 border-t border-brand-primary/10">
                  <p className="text-xs font-bold text-brand-text-light uppercase tracking-wider mb-2">Sources Found</p>
                  <ul className="space-y-2">
                    {sources.map((s, i) => (
                      <li key={i} className="text-xs">
                        {s.maps?.uri && (
                          <a href={s.maps.uri} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline flex items-center gap-1">
                            <MapPinIcon /> {s.maps.title || 'View on Maps'}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-brand-text-light py-10">
              <p className="text-center italic">Click "Analyze Surroundings" to get a detailed context of the patient's current environment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GpsPage;