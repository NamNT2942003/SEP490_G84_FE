// Audio service for real-time notifications
class AudioNotificationService {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
    this.isMuted = false;
  }

  // Initialize audio context (must be called after user interaction)
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
      console.log('[Audio] Audio context initialized');
    } catch (error) {
      console.warn('[Audio] Failed to initialize audio context:', error);
    }
  }

  // Generate beep sound using Web Audio API
  createBeepSound(frequency = 800, duration = 200, volume = 0.1) {
    if (!this.audioContext || this.isMuted) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('[Audio] Failed to create beep sound:', error);
    }
  }

  // Play warning sound for incidents
  playWarningSound() {
    this.createBeepSound(600, 300, 0.15); // Lower tone, longer duration
    setTimeout(() => {
      this.createBeepSound(800, 200, 0.15); // Higher tone
    }, 150);
  }

  // Play info sound for general notifications  
  playInfoSound() {
    this.createBeepSound(1000, 150, 0.1); // High pitch, short
  }

  // Play maintenance sound for equipment issues
  playMaintenanceSound() {
    this.createBeepSound(500, 200, 0.12); // Low tone
    setTimeout(() => {
      this.createBeepSound(700, 200, 0.12); // Mid tone
    }, 100);
    setTimeout(() => {
      this.createBeepSound(500, 200, 0.12); // Low tone again
    }, 200);
  }

  // Play success sound
  playSuccessSound() {
    this.createBeepSound(800, 100, 0.08);
    setTimeout(() => {
      this.createBeepSound(1200, 150, 0.08);
    }, 50);
  }

  // Toggle mute/unmute
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Check if audio is supported and initialized
  isReady() {
    return this.isInitialized && this.audioContext && this.audioContext.state === 'running';
  }

  // Resume audio context if suspended (needed for some browsers)
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('[Audio] Audio context resumed');
      } catch (error) {
        console.warn('[Audio] Failed to resume audio context:', error);
      }
    }
  }
}

// Create singleton instance
const audioNotificationService = new AudioNotificationService();

export default audioNotificationService;