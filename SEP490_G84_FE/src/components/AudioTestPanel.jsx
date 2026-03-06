import React, { useState } from 'react';
import audioNotificationService from '../services/audioNotificationService';

const AudioTestPanel = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  const initAudio = async () => {
    await audioNotificationService.initialize();
    await audioNotificationService.resumeAudioContext();
    setIsInitialized(true);
  };

  const testSounds = [
    { name: 'Warning Sound', fn: () => audioNotificationService.playWarningSound(), color: 'warning' },
    { name: 'Info Sound', fn: () => audioNotificationService.playInfoSound(), color: 'info' },
    { name: 'Maintenance Sound', fn: () => audioNotificationService.playMaintenanceSound(), color: 'danger' },
    { name: 'Success Sound', fn: () => audioNotificationService.playSuccessSound(), color: 'success' }
  ];

  return (
    <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: "12px" }}>
      <div className="card-body p-3">
        <h6 className="fw-bold mb-3">🔊 Audio Test Panel</h6>
        
        {!isInitialized ? (
          <button 
            className="btn btn-primary btn-sm"
            onClick={initAudio}
          >
            <i className="bi bi-play-circle me-1"></i>
            Initialize Audio
          </button>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {testSounds.map((sound, index) => (
              <button
                key={index}
                className={`btn btn-outline-${sound.color} btn-sm`}
                onClick={sound.fn}
                style={{ fontSize: "0.8rem" }}
              >
                <i className="bi bi-volume-up me-1"></i>
                {sound.name}
              </button>
            ))}
          </div>
        )}
        
        <small className="text-muted d-block mt-2">
          Click buttons to test different notification sounds
        </small>
      </div>
    </div>
  );
};

export default AudioTestPanel;