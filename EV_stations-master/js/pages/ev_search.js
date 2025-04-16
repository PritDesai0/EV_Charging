// Handle search button click
function handleSearch() {
  const overlay = document.getElementById('mapOverlay');
  const centralBox = document.getElementById('central-box');
  const sidebar = document.getElementById('sidebar');

  // Add loading indicator
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = `
    <div class="spinner"></div>
    <div>Searching for stations...</div>
  `;
  document.body.appendChild(loading);

  // Hide central box and overlay
  centralBox.classList.add('hidden');
  overlay.classList.add('hidden');

  // Call the original search function
  findLocation();

  // Show sidebar after a delay
  setTimeout(() => {
    sidebar.classList.add('active');
    document.body.removeChild(loading);
  }, 1500);
}

// Function to show station details in sidebar
function showStationDetails(station) {
  const stationsList = document.getElementById('stations-list');
  
  // Create station details HTML
  const detailsHTML = `
    <div class="station-details">
      <div class="station-name">${station.address.freeformAddress}</div>
      
      <div class="station-status ${getStatusClass(station)}">
        ${getStatusText(station)}
      </div>

      <div class="ports-available">
        <i class="fas fa-charging-station"></i>
        ${getPortsInfo(station)}
      </div>

      <div class="station-info">
        <div class="info-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${station.address.freeformAddress}</span>
        </div>
        <div class="info-item">
          <i class="fas fa-road"></i>
          <span>${(station.distance / 1000).toFixed(1)} km away</span>
        </div>
        <div class="info-item">
          <i class="fas fa-clock"></i>
          <span>Open 24/7</span>
        </div>
      </div>

      <div class="station-actions">
        <button class="action-btn direction-btn" onclick="getDirections('${station.position.lat}', '${station.position.lng}')">
          <i class="fas fa-directions"></i>
          Directions
        </button>
        
        <button class="action-btn book-btn" onclick="bookSlot('${station.id}', '${station.position.lat}', '${station.position.lng}')">
          <i class="fas fa-calendar-check"></i>
          Book Now
        </button>
      </div>
    </div>
  `;

  stationsList.innerHTML = detailsHTML;
  
  // Save current station details for later use
  window.currentStationDetails = station;
}

// Helper functions for station details
function getStatusClass(station) {
  // You can modify this based on your actual data
  const availability = station.dataSources?.chargingAvailability?.total || 0;
  if (availability > 5) return 'status-available';
  if (availability > 0) return 'status-busy';
  return 'status-full';
}

function getStatusText(station) {
  // You can modify this based on your actual data
  const availability = station.dataSources?.chargingAvailability?.total || 0;
  if (availability > 5) return 'Available';
  if (availability > 0) return 'Busy';
  return 'Full';
}

function getPortsInfo(station) {
  // You can modify this based on your actual data
  const total = station.dataSources?.chargingAvailability?.total || 0;
  const available = station.dataSources?.chargingAvailability?.available || 0;
  return `${available}/${total} Ports Available`;
}

// Function to handle getting directions
function getDirections(lat, lng) {
  window.location.href = `ev_routing.html?dest=${lat},${lng}`;
}

// Function to handle booking a slot
function bookSlot(stationId, lat, lng) {
  // Get the station details
  const station = window.currentStationDetails;
  
  if (station && station.address) {
    // Store the station information in localStorage for later retrieval
    localStorage.setItem('selectedStationAddress', station.address.freeformAddress);
    localStorage.setItem('selectedStationName', station.poi?.name || 'Green EV Charging Hub');
    localStorage.setItem('selectedStationId', stationId);
    localStorage.setItem('selectedStationLat', lat);
    localStorage.setItem('selectedStationLng', lng);
    
    // Navigate to booking page
    window.location.href = 'book_slot.html';
  } else {
    alert('Station details not available');
  }
}

// Modify the existing marker click handler in your map code
function onMarkerClick(station) {
  showStationDetails(station);
  
  // Ensure sidebar is visible
  document.getElementById('sidebar').classList.add('active');
}

// Add this to your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const closeSidebar = document.getElementById('closeSidebar');
  
  // Toggle sidebar
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('active');
  });
  
  // Close sidebar
  closeSidebar.addEventListener('click', function() {
    sidebar.classList.remove('active');
  });
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(event) {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnToggle = sidebarToggle.contains(event.target);
    
    if (!isClickInsideSidebar && !isClickOnToggle && window.innerWidth <= 576 && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
    }
  });
}); 