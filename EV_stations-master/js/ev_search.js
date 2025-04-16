const application = {
  key: 'btVdXlLhF1rgfMqkkAZv8aWClICR4ruk',
  name: 'EV Search',
  version: '1.0'
};

const ids = {
  map: 'map',
  location: 'location',
  distance: 'distance',
  overlay: 'overlay',
  centralBox: 'central-box',
  sidebar: 'sidebar',
  stationsList: 'stations-list'
};

const connectorProperties = [
  { name: 'available', label: 'available' },
  { name: 'occupied', label: 'occupied' },
  { name: 'outOfService', label: 'out of service' },
  { name: 'reserved', label: 'reserved' },
  { name: 'unknown', label: 'unknown' }
];

const labels = {
  kilometers: "km",
  total: "ports",
  available: "available",
  occupied: "occupied",
  reserved: "reserved",
  unknown: "unknown",
  outOfService: "out of service"
};

const metersPerKilometer = 1000;
const markerColor = 'blue';
const mapPadding = 40;
const searchLimit = 100;
let markers = [];
let map, currentStation, center, radius;

document.addEventListener('DOMContentLoaded', init);

// Initialize the map with TomTom SDK
function init() {
  tt.setProductInfo(application.name, application.version);
  map = tt.map({
    key: application.key,
    container: ids.map,
    center: [77.2090, 28.6139], // Default center (Delhi)
    zoom: 10
  });

  map.addControl(new tt.FullscreenControl());
  map.addControl(new tt.NavigationControl());
}

// Find location based on user input
function findLocation() {
  if (!map.loaded()) {
    alert('Please try again later, the map is still loading.');
    return;
  }

  clearMarkers();
  const queryText = document.getElementById(ids.location).value.trim();

  if (!queryText) {
    alert('Please enter a location.');
    return;
  }

  tt.services.fuzzySearch({ key: application.key, query: queryText })
    .go()
    .then(findStations)
    .catch(error => alert(`Could not find location (${queryText}). ${error.message}`));
}

// Find charging stations near the selected location
function findStations(results) {
  const location = getLocation(results);
  if (!location) return;

  radius = document.getElementById(ids.distance).value * metersPerKilometer;
  center = location.position;

  tt.services.categorySearch({
    key: application.key,
    query: 'electric vehicle station',
    center,
    radius,
    limit: searchLimit
  })
    .go()
    .then(createMarkers)
    .catch(error => alert(`Could not find charging stations. ${error.message}`));
}

// Get the first location from search results
function getLocation(results) {
  if (results.results.length > 0) return results.results[0];
  alert('Could not find location.');
  return null;
}

// Clear all markers from the map
function clearMarkers() {
  markers.forEach(marker => marker.remove());
  markers = [];
}

// Create markers for each charging station
function createMarkers(results) {
  if (!results || results.results.length === 0) {
    alert('No charging stations found.');
    return;
  }

  const bounds = new tt.LngLatBounds();

  results.results.forEach(location => {
    addMarker(location);
    bounds.extend([location.position.lng, location.position.lat]);
  });

  map.fitBounds(bounds, { padding: mapPadding });
}

// Add a marker for a charging station
function addMarker(location) {
  const popup = new tt.Popup({ offset: 10, maxWidth: 'none' })
    .setHTML(generateStationInfo(location))
    .on('open', () => {
      updatePopup(popup, location);
      showStationDetails(location);
    });

  const marker = new tt.Marker({ color: markerColor })
    .setLngLat(location.position)
    .setPopup(popup)
    .addTo(map);

  marker.getElement().addEventListener('click', () => {
    currentStation = location;
    showStationDetails(location);
    document.getElementById(ids.sidebar).classList.add('active');
  });

  markers.push(marker);
}

// Update popup with the latest availability data
function updatePopup(popup, location) {
  const id = location.dataSources?.chargingAvailability?.id;

  if (!id) {
    popup.setHTML(generateStationInfo(location));
    return;
  }

  tt.services.chargingAvailability({ key: application.key, chargingAvailability: id })
    .go()
    .then(response => {
      popup.setHTML(generateStationInfo(location, response));
      if (currentStation?.id === location.id) {
        showStationDetails(location, response);
      }
    })
    .catch(() => popup.setHTML(generateStationInfo(location)));
}

// Generate HTML for station info popup
function generateStationInfo(location, availabilityData = null) {
  const address = location.address.freeformAddress;
  const lat = location.position.lat;
  const lng = location.position.lng;

  let html = `
    <h3>Charging Station</h3>
    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}">
      ${address}
    </a>
    <span>Address: ${address}</span>
    <span>Open 24/7</span>
  `;

  if (!availabilityData || availabilityData.connectors.length === 0) {
    html += '<span>Ports available: J1772</span>';
  } else {
    availabilityData.connectors.forEach(connector => {
      html += `<span>${connector.type}: ${formatConnectorAvailability(connector)}</span>`;
    });
  }

  return html;
}

// Format connector availability information
function formatConnectorAvailability(connector) {
  return connectorProperties
    .filter(property => connector.availability.current[property.name] > 0)
    .map(property => `${connector.availability.current[property.name]} ${property.label}`)
    .join(', ') || 'No information';
}

// Show station details in the sidebar
function showStationDetails(station, availabilityData = null) {
  currentStation = station;
  const address = station.address.freeformAddress;
  const lat = station.position.lat;
  const lng = station.position.lng;
  const distance = (station.distance / 1000).toFixed(1);
  const stationId = station.id || '';
  const stationName = station.poi?.name || 'EV Charging Station';
  
  document.getElementById(ids.stationsList).innerHTML = `
    <div class="station-details">
      <h3>${stationName}</h3>
      <p>${address}</p>
      <div class="status ${getStatusClass(station)}">${getStatusText(station)}</div>
      <div>Ports Available: ${getPortsInfo(station, availabilityData)}</div>
      <div>Distance: ${distance} km away</div>
      <div class="station-actions">
        <button class="action-btn" onclick="getDirections(${lat}, ${lng})">
          <i class="fas fa-directions"></i> Get Directions
        </button>
        <button class="action-btn" onclick="bookSlot('${stationId}', '${lat}', '${lng}', '${encodeURIComponent(stationName)}', '${encodeURIComponent(address)}')">
          <i class="fas fa-calendar-check"></i> Book Slot
        </button>
      </div>
    </div>
  `;
}

// Get CSS class based on station availability
function getStatusClass(station) {
  const available = station.dataSources?.chargingAvailability?.available || 0;
  return available > 5 ? 'status-available' : available > 0 ? 'status-busy' : 'status-full';
}

// Get status text based on station availability
function getStatusText(station) {
  const available = station.dataSources?.chargingAvailability?.available || 0;
  return available > 5 ? 'Available' : available > 0 ? 'Busy' : 'Full';
}

// Get ports information text
function getPortsInfo(station, availabilityData) {
  const total = station.dataSources?.chargingAvailability?.total || 0;
  const available = station.dataSources?.chargingAvailability?.available || 0;
  return `${available}/${total} Ports Available`;
}

// Navigate to directions page
function getDirections(lat, lng) {
  window.location.href = `ev_routing.html?dest=${lat},${lng}`;
}

// Navigate to booking page
function bookSlot(stationId, lat, lng, stationName, address) {
  // Store complete station information in localStorage
  localStorage.setItem('selectedStationId', stationId);
  localStorage.setItem('selectedStationLat', lat);
  localStorage.setItem('selectedStationLng', lng);
  localStorage.setItem('selectedStationName', decodeURIComponent(stationName));
  localStorage.setItem('selectedStationAddress', decodeURIComponent(address));
  
  console.log('Station data saved:', {
    id: stationId,
    name: decodeURIComponent(stationName),
    address: decodeURIComponent(address),
    position: { lat, lng }
  });
  
  // Navigate to booking page
  window.location.href = 'book_slot.html';
}

// Handle search button click
function handleSearch() {
  document.getElementById(ids.overlay).classList.add('hidden');
  document.getElementById(ids.centralBox).classList.add('hidden');
  findLocation();
}
