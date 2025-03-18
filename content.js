let audioContext;
let gainNode;
let sourceNodes = new Map();

function setupAudioBoost() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
  }
}

function boostAudioElement(element) {
  if (!sourceNodes.has(element)) {
    setupAudioBoost();
    const source = audioContext.createMediaElementSource(element);
    source.connect(gainNode);
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
    setupAudioBoost();
    gainNode.gain.value = message.value;
    
    // Apply to existing elements
    const elements = document.querySelectorAll('audio, video');
    elements.forEach(element => boostAudioElement(element));
  }
});

// Initialize with existing elements
document.querySelectorAll('audio, video').forEach(element => {
  boostAudioElement(element);
});