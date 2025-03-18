let audioContext;
let gainNode;
let compressorNode;
let limiterNode;
let sourceNodes = new Map();

function setupAudioProcessing() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create Gain Node for volume control
    gainNode = audioContext.createGain();
    
    // Create Compressor to manage dynamic range
    compressorNode = audioContext.createDynamicsCompressor();
    compressorNode.threshold.setValueAtTime(-10, audioContext.currentTime); // Threshold in dB
    compressorNode.knee.setValueAtTime(30, audioContext.currentTime);      // Smooth transition
    compressorNode.ratio.setValueAtTime(12, audioContext.currentTime);     // Compression ratio
    compressorNode.attack.setValueAtTime(0.003, audioContext.currentTime); // Attack time in seconds
    compressorNode.release.setValueAtTime(0.250, audioContext.currentTime); // Release time in seconds

    // Create Limiter to prevent clipping
    limiterNode = audioContext.createGain();
    limiterNode.gain.value = 0.95; // Set a safe maximum level (below 1.0 to avoid clipping)

    // Connect nodes: Source -> Compressor -> Gain -> Limiter -> Destination
    compressorNode.connect(gainNode);
    gainNode.connect(limiterNode);
    limiterNode.connect(audioContext.destination);
  }
}

function boostAudioElement(element) {
  if (!sourceNodes.has(element) && element.paused === false) {
    setupAudioProcessing();
    const source = audioContext.createMediaElementSource(element);
    source.connect(compressorNode);
    sourceNodes.set(element, source);
  }
}

// Observe DOM for new audio/video elements
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const elements = document.querySelectorAll('audio, video');
    elements.forEach(element => boostAudioElement(element));
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setVolume") {
    setupAudioProcessing();
    const gainValue = message.value > 5 ? 5 : message.value; // Cap gain at 5x to prevent extreme distortion
    gainNode.gain.setValueAtTime(gainValue, audioContext.currentTime);
    
    // Apply to existing elements
    const elements = document.querySelectorAll('audio, video');
    elements.forEach(element => boostAudioElement(element));
  }
});

// Initialize with existing elements
document.querySelectorAll('audio, video').forEach(element => {
  boostAudioElement(element);
});

// Handle audio element state changes
document.addEventListener('play', (event) => {
  const element = event.target;
  if (element.tagName.toLowerCase() === 'audio' || element.tagName.toLowerCase() === 'video') {
    boostAudioElement(element);
  }
}, true);

document.addEventListener('pause', (event) => {
  const element = event.target;
  if (sourceNodes.has(element)) {
    sourceNodes.get(element).disconnect();
    sourceNodes.delete(element);
  }
}, true);