document.addEventListener('DOMContentLoaded', function() {
  const slider = document.getElementById('volumeSlider');
  const volumeDisplay = document.getElementById('volumeValue');

  slider.oninput = function() {
    const volume = this.value;
    volumeDisplay.textContent = `${volume}%`;
    console.log(volume);
    
    
    applyVolumeBoost(volume / 100);
  };

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