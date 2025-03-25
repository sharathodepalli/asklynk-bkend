// This is a simplified way to initialize your app without complex imports
// Add this to your main.tsx or create a new entry point

document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('asklynk-root');
    if (!container) return;
    
    // Create a simple UI element instead of the full React app for now
    const appElement = document.createElement('div');
    appElement.className = 'asklynk-floating-button';
    appElement.innerHTML = `
      <button class="asklynk-toggle-button">
        <span class="asklynk-icon">AL</span>
      </button>
      <div class="asklynk-panel" style="display: none;">
        <div class="asklynk-panel-header">
          <h3>AskLynk</h3>
          <button class="asklynk-close-button">×</button>
        </div>
        <div class="asklynk-panel-content">
          <p>AskLynk is ready to assist you</p>
          <div class="asklynk-controls">
            <button class="asklynk-action-button">Start Transcript</button>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(appElement);
    
    // Add event listeners
    const toggleButton = appElement.querySelector('.asklynk-toggle-button');
    const closeButton = appElement.querySelector('.asklynk-close-button');
    const panel = appElement.querySelector('.asklynk-panel');
    
    toggleButton.addEventListener('click', function() {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    closeButton.addEventListener('click', function() {
      panel.style.display = 'none';
    });
    
    // Make the panel draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    const panelHeader = appElement.querySelector('.asklynk-panel-header');
    
    panelHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);
    
    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === panelHeader) {
        isDragging = true;
      }
    }
    
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        setTranslate(currentX, currentY, panel);
      }
    }
    
    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }
    
    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  });