document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('volumeSlider');
    const volumeDisplay = document.getElementById('volumeValue');
  
    // Update display when slider changes
    slider.oninput = function() {
      const volume = this.value;
      volumeDisplay.textContent = `${volume}%`;
      console.log('volume', volume);
      
      applyVolumeBoost(volume / 100);
    };
  
    // Inject content script when popup opens
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content.js']
      });
    });
  });
  
  function applyVolumeBoost(gainValue) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "setVolume",
        value: gainValue
      });
    });
  }