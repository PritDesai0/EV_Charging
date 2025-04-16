const application = {
  key: 'btVdXlLhF1rgfMqkkAZv8aWClICR4ruk',
  name: 'EV Routing',
  version: '1.0'
};

const appearance = {
  marker: {
    color: {
      start: 'green',
      finish: 'red',
      leg: 'blue'
    }
  },
  line: {
    color: '#224488',
    width: 6,
    padding: 40,
    join: 'round',
    cap: 'round'
  }
};

const ids = {
  html: {
    map: 'map',
    start: 'start',
    finish: 'finish',
    summary: 'route-details',
    overlay: 'overlay',
    centralBox: 'central-box',
    sidebar: 'sidebar'
  },
  route: {
    source: 'routeSource',
    layer: 'routeLayer'
  }
};

const labels = {
  kilometers: "km",
  lengthInMeters: 'Travel Distance (km)',
  travelTimeInSeconds: 'Travel Time',
  trafficDelayInSeconds: 'Traffic Delay',
  batteryConsumptionInkWh: 'Battery Consumption (kWh)',
  remainingChargeAtArrivalInkWh: 'Remaining Charge (kWh)',
  totalChargingTimeInSeconds: 'Total Charging Time',
  targetChargeInkWh: 'Target Charge (kWh)',
  chargingTimeInSeconds: 'Charging Time',
  routeSummary: 'Route Summary',
  legSummary: 'Route Leg #%s'
}

const units = {
  metersPerKilometer: 1000,
  secondsPerMinute: 60,
  secondsPerHour: 3600
};

// EV consumption model
const consumptionModel = {
  vehicleWeight: 2000,
  accelerationEfficiency: 0.33,
  decelerationEfficiency: 0.33,
  uphillEfficiency: 0.33,
  downhillEfficiency: 0.33,
  constantSpeedConsumptionInkWhPerHundredkm: [
    { speed: 50, consumption: 13 },
    { speed: 100, consumption: 21 }
  ],
  currentChargeInkWh: 55,
  maxChargeInkWh: 60,
  auxiliaryPowerInkW: 1.7
};

const minChargeAtDestinationInkWh = 8;

const chargingModes = [
  {
    chargingPower: 150,
    chargingMode: 'Fast',
    chargingCurve: [
      { stateOfChargeInkWh: 0, power: 150 },
      { stateOfChargeInkWh: 40, power: 150 },
      { stateOfChargeInkWh: 50, power: 60 },
      { stateOfChargeInkWh: 60, power: 0 }
    ]
  }
];

const markers = [];
var finishLocation;
var routeData;
var startLocation;
var map;

init();

function addLegMarker(leg, index, lastIndex) {
  if (index == lastIndex)
    return;

  const points = leg.points;    
  const lastPointIndex = points.length - 1;
  if (lastPointIndex < 0)
    return;

  addMarker(points[lastPointIndex], appearance.marker.color.leg);
}

function addMarker(position, color) {
  markers.push(new tt.Marker({ color: color })
    .setLngLat(position)
    .addTo(map));
}

function addRoute(geoJson) {
  displayMessage('Adding route to map...');

  try {
    // Check if the source already exists and remove it first
    if (map.getSource(ids.route.source)) {
      // If the layer exists, remove it first
      if (map.getLayer(ids.route.layer)) {
        map.removeLayer(ids.route.layer);
      }
      map.removeSource(ids.route.source);
      console.log('Removed existing route source and layer');
    }

    // Now add the new source and layer
    map.addSource(ids.route.source, { type: 'geojson', data: geoJson });

  map.addLayer({
    id: ids.route.layer,
    type: 'line',
    source: ids.route.source,
    layout: { 'line-join': appearance.line.join, 'line-cap': appearance.line.cap },
    paint: { 'line-color': appearance.line.color, 'line-width': appearance.line.width }
  });

    console.log('Successfully added route to map');
  } catch (error) {
    console.error('Error adding route to map:', error);
    displayMessage('Error adding route to map: ' + error.message);
  }
}

function addRouteLegs(route, callbackFunction, argument) {
  if (!route.hasOwnProperty('legs'))
    return;

  const legs = route.legs;
  if (legs.length < 2)
    return;

  const lastIndex = legs.length - 1;

  legs.forEach(function(leg, index) {
    callbackFunction(leg, index, lastIndex, argument);
  });
}

function addRouteMarkers(route) {
  displayMessage('Adding route markers to map...');

  addRouteLegs(route, addLegMarker);
  addMarker(startLocation.position, appearance.marker.color.start);
  addMarker(finishLocation.position, appearance.marker.color.finish);
}

function addRouteSummary(route) {
  const summary = clearRouteSummary();
  
  // Create a container for the summary
  const summaryContainer = document.createElement('div');
  summaryContainer.className = 'route-summary-container';
  
  // Add route overview
  const overviewContainer = document.createElement('div');
  overviewContainer.className = 'route-overview';
  
  // Add total distance
  const distanceDiv = document.createElement('div');
  distanceDiv.className = 'overview-item';
  
  // Format the distance with error handling
  let distanceText;
  if (route.summary.lengthInMeters !== undefined) {
    distanceText = formatMetersToKilometers(route.summary.lengthInMeters);
  } else {
    distanceText = "Distance unavailable";
  }
  
  distanceDiv.innerHTML = `
    <i class="fas fa-road"></i>
    <div class="overview-details">
      <span class="overview-value">${distanceText}</span>
      <span class="overview-label">Distance</span>
    </div>
  `;
  overviewContainer.appendChild(distanceDiv);
  
  // Add total time
  const timeDiv = document.createElement('div');
  timeDiv.className = 'overview-item';
  
  // Format the time with error handling
  let timeText;
  if (route.summary.travelTimeInSeconds !== undefined) {
    timeText = formatSecondsToTime(route.summary.travelTimeInSeconds);
  } else {
    timeText = "Time unavailable";
  }
  
  timeDiv.innerHTML = `
    <i class="fas fa-clock"></i>
    <div class="overview-details">
      <span class="overview-value">${timeText}</span>
      <span class="overview-label">Travel Time</span>
    </div>
  `;
  overviewContainer.appendChild(timeDiv);
  
  // Add battery consumption if available
  if (route.summary.batteryConsumptionInkWh !== undefined) {
    const batteryDiv = document.createElement('div');
    batteryDiv.className = 'overview-item';
    
    // Format the battery consumption with error handling
    let batteryText;
    if (route.summary.batteryConsumptionInkWh !== undefined) {
      batteryText = formatFixedDecimal(route.summary.batteryConsumptionInkWh) + " kWh";
    } else {
      batteryText = "Not available";
    }
    
    batteryDiv.innerHTML = `
      <i class="fas fa-battery-half"></i>
      <div class="overview-details">
        <span class="overview-value">${batteryText}</span>
        <span class="overview-label">Battery Usage</span>
      </div>
    `;
    overviewContainer.appendChild(batteryDiv);
  }
  
  summaryContainer.appendChild(overviewContainer);
  
  // Add detailed summary
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'route-details-container';
  
  // Add heading
  const heading = document.createElement('h3');
  heading.textContent = 'Route Details';
  detailsContainer.appendChild(heading);
  
  // Add detailed information
  appendSummaryToElement(detailsContainer, route.summary, labels.routeSummary);
  
  // Add route legs if available
  if (route.legs && route.legs.length > 1) {
    addRouteLegs(route, appendLegSummaryToElement, detailsContainer);
  }
  
  summaryContainer.appendChild(detailsContainer);
  
  // Add charging stops if any
  if (route.legs && route.legs.length > 1) {
    let hasChargingStops = false;
    
    // Check if any leg has charging information
    for (let i = 0; i < route.legs.length - 1; i++) {
      const leg = route.legs[i];
      if (leg.summary.chargingInformationAtEndOfLeg) {
        hasChargingStops = true;
        break;
      }
    }
    
    if (hasChargingStops) {
      const chargingContainer = document.createElement('div');
      chargingContainer.className = 'charging-stops-container';
      
      const chargingHeading = document.createElement('h3');
      chargingHeading.textContent = 'Charging Stops';
      chargingContainer.appendChild(chargingHeading);
      
      for (let i = 0; i < route.legs.length - 1; i++) {
        const leg = route.legs[i];
        if (leg.summary.chargingInformationAtEndOfLeg) {
          const chargingInfo = leg.summary.chargingInformationAtEndOfLeg;
          const chargingStop = document.createElement('div');
          chargingStop.className = 'charging-stop';
          chargingStop.innerHTML = `
            <div class="charging-stop-header">
              <i class="fas fa-charging-station"></i>
              <span>Charging Stop ${i + 1}</span>
            </div>
            <div class="charging-stop-details">
              <div class="info-item">
                <i class="fas fa-battery-quarter"></i>
                <span>Initial Charge: ${formatFixedDecimal(chargingInfo.initialChargeInkWh)} kWh</span>
              </div>
              <div class="info-item">
                <i class="fas fa-battery-full"></i>
                <span>Target Charge: ${formatFixedDecimal(chargingInfo.targetChargeInkWh)} kWh</span>
              </div>
              <div class="info-item">
                <i class="fas fa-clock"></i>
                <span>Charging Time: ${formatSecondsToTime(chargingInfo.chargingTimeInSeconds)}</span>
              </div>
            </div>
          `;
          chargingContainer.appendChild(chargingStop);
          
          // Add a Book Slot button to each charging station
          const chargingStationAddress = leg.summaryWithDestination?.destination?.address?.freeformAddress || 'Charging Station';
          const bookStationBtn = document.createElement('button');
          bookStationBtn.className = 'btn btn-sm book-btn';
          bookStationBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Slot at This Station';
          bookStationBtn.onclick = function() {
            navigateToBookSlot(chargingStationAddress, leg.summaryWithDestination?.destination?.name, leg.summaryWithDestination?.destination?.position?.lat, leg.summaryWithDestination?.destination?.position?.lng);
          };
          chargingStop.appendChild(bookStationBtn);
        }
      }
      
      summaryContainer.appendChild(chargingContainer);
    }
  }
  
  // Add action buttons
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'route-actions';
  
  const startNavigationBtn = document.createElement('button');
  startNavigationBtn.className = 'action-btn direction-btn';
  startNavigationBtn.innerHTML = '<i class="fas fa-directions"></i> Start Navigation';
  startNavigationBtn.onclick = function() {
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${startLocation.position.lat},${startLocation.position.lng}&destination=${finishLocation.position.lat},${finishLocation.position.lng}&travelmode=driving`, '_blank');
  };
  actionsContainer.appendChild(startNavigationBtn);
  
  const bookSlotBtn = document.createElement('button');
  bookSlotBtn.className = 'action-btn book-btn';
  bookSlotBtn.innerHTML = '<i class="fas fa-calendar-check"></i> Book Slot';
  bookSlotBtn.onclick = function() {
    navigateToBookSlot(finishLocation.address.freeformAddress, finishLocation.name, finishLocation.position.lat, finishLocation.position.lng);
  };
  actionsContainer.appendChild(bookSlotBtn);
  
  const shareRouteBtn = document.createElement('button');
  shareRouteBtn.className = 'action-btn share-btn';
  shareRouteBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Route';
  shareRouteBtn.onclick = function() {
    const shareUrl = `${window.location.origin}${window.location.pathname}?start=${encodeURIComponent(getValue(ids.html.start))}&finish=${encodeURIComponent(getValue(ids.html.finish))}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'EV Route',
        text: 'Check out this EV route!',
        url: shareUrl
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Route link copied to clipboard!');
      });
    }
  };
  actionsContainer.appendChild(shareRouteBtn);
  
  summaryContainer.appendChild(actionsContainer);
  
  // Add the summary to the page
  summary.appendChild(summaryContainer);
  
  // Show the sidebar
  document.getElementById(ids.html.sidebar).classList.add('active');
  
  // Hide the central box and overlay
  document.getElementById(ids.html.centralBox).classList.add('hidden');
  document.getElementById(ids.html.overlay).classList.add('hidden');
}

function appendSummaryToElement(element, properties, heading) {
  // Check if properties is undefined or null
  if (!properties) {
    console.error('Route summary properties are undefined');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Route details unavailable';
    element.appendChild(errorDiv);
    return;
  }

  const container = document.createElement('div');
  container.className = 'summary-section';
  
  if (heading) {
    const headingEl = document.createElement('h4');
    headingEl.textContent = heading;
    container.appendChild(headingEl);
  }
  
  // Add properties with better error handling
  try {
    // Travel distance
    if (properties.hasOwnProperty('lengthInMeters')) {
      appendPropertyToElement(container, properties, labels.lengthInMeters, 'lengthInMeters', formatMetersToKilometers);
    } else {
      // Add a placeholder if the property is missing
      const propertyDiv = document.createElement('div');
      propertyDiv.className = 'info-item';
      propertyDiv.innerHTML = `
        <span class="info-label">${labels.lengthInMeters}:</span>
        <span class="info-value">Not available</span>
      `;
      container.appendChild(propertyDiv);
    }
    
    // Travel time
    if (properties.hasOwnProperty('travelTimeInSeconds')) {
      appendPropertyToElement(container, properties, labels.travelTimeInSeconds, 'travelTimeInSeconds', formatSecondsToTime);
    } else {
      const propertyDiv = document.createElement('div');
      propertyDiv.className = 'info-item';
      propertyDiv.innerHTML = `
        <span class="info-label">${labels.travelTimeInSeconds}:</span>
        <span class="info-value">Not available</span>
      `;
      container.appendChild(propertyDiv);
    }
    
    // Traffic delay
    if (properties.hasOwnProperty('trafficDelayInSeconds')) {
      appendPropertyToElement(container, properties, labels.trafficDelayInSeconds, 'trafficDelayInSeconds', formatSecondsToTime);
    }
    
    // Battery consumption
    if (properties.hasOwnProperty('batteryConsumptionInkWh')) {
      appendPropertyToElement(container, properties, labels.batteryConsumptionInkWh, 'batteryConsumptionInkWh', formatFixedDecimal);
    } else {
      const propertyDiv = document.createElement('div');
      propertyDiv.className = 'info-item';
      propertyDiv.innerHTML = `
        <span class="info-label">${labels.batteryConsumptionInkWh}:</span>
        <span class="info-value">Not available</span>
      `;
      container.appendChild(propertyDiv);
    }
    
    // Remaining charge
    if (properties.hasOwnProperty('remainingChargeAtArrivalInkWh')) {
      appendPropertyToElement(container, properties, labels.remainingChargeAtArrivalInkWh, 'remainingChargeAtArrivalInkWh', formatFixedDecimal);
    }
    
    // Total charging time
    if (properties.hasOwnProperty('totalChargingTimeInSeconds')) {
      appendPropertyToElement(container, properties, labels.totalChargingTimeInSeconds, 'totalChargingTimeInSeconds', formatSecondsToTime);
    }

    // Charging information
    if (properties.hasOwnProperty('chargingInformationAtEndOfLeg')) {
      const chargingInfo = properties.chargingInformationAtEndOfLeg;
      
      // Target charge
      if (chargingInfo.hasOwnProperty('targetChargeInkWh')) {
        appendPropertyToElement(container, chargingInfo, labels.targetChargeInkWh, 'targetChargeInkWh', formatFixedDecimal);
      }
      
      // Charging time
      if (chargingInfo.hasOwnProperty('chargingTimeInSeconds')) {
        appendPropertyToElement(container, chargingInfo, labels.chargingTimeInSeconds, 'chargingTimeInSeconds', formatSecondsToTime);
      }
    }
  } catch (error) {
    console.error('Error adding route summary properties:', error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Error displaying route details: ' + error.message;
    container.appendChild(errorDiv);
  }
  
  element.appendChild(container);
}

function appendPropertyToElement(element, options, label, name, format) {
  try {
    if (options.hasOwnProperty(name)) {
      let value;
      
      // Handle special case for displaying distance
      if (name === 'lengthInMeters' && format === formatMetersToKilometers) {
        value = formatMetersToKilometers(options[name]);
      } else {
        value = format ? format(options[name]) : options[name];
      }
      
      const propertyDiv = document.createElement('div');
      propertyDiv.className = 'info-item';
      propertyDiv.innerHTML = `
        <span class="info-label">${label}:</span>
        <span class="info-value">${value}</span>
      `;
      
      element.appendChild(propertyDiv);
    }
  } catch (error) {
    console.error(`Error adding property ${name}:`, error);
  }
}

function appendLegSummaryToElement(leg, index, lastIndex, element) {
  appendSummaryToElement(element, leg.summary, labels.legSummary.replace('%s', index + 1));
}

function appendHeading(element, label, headingStyle) {
  const heading = document.createElement(headingStyle || 'h3');
  heading.textContent = label;
  element.appendChild(heading);
}

function appendLabelValue(element, label, value) {
  const span = document.createElement('span');
  span.textContent = label + ': ' + value;

  appendLineBreak(element);
  element.appendChild(span);
}

function appendLineBreak(element, child) {
  const lastChild = element.lastChild;
  const lastTagName = lastChild == null ? null : lastChild.tagName;

  if (lastTagName != null && lastTagName.charAt(0) != 'H')
    element.appendChild(document.createElement('br'));
}

function findStart() {
  clearRoute();
  
  // Show loading message
  displayMessage('Finding starting location...');
  
  // Add debugging
  console.log('Starting route calculation process...');
  findLocation(ids.html.start, findFinish);
}

function findFinish(startResults) {
  startLocation = getLocation(startResults, ids.html.start);
  if (startLocation != null) {
    // Add debugging
    console.log('Start location found:', startLocation);
    findLocation(ids.html.finish, calculateRoute);
  } else {
    console.error('Failed to find start location');
  }
}

function calculateRoute(finishResults) {
  finishLocation = getLocation(finishResults, ids.html.finish);
  if (finishLocation == null) {
    console.error('Failed to find finish location');
    return;
  }

  // Add debugging
  console.log('Finish location found:', finishLocation);
  console.log('Calculating route from', startLocation.position, 'to', finishLocation.position);

  displayMessage('Calculating route...');

  // Try to use the EV routing first
  tryCalculateEVRoute();
}

// Function to use current location
function useCurrentLocation(fieldId) {
  if (navigator.geolocation) {
    // Show loading indicator
    const locationBtn = document.querySelector(`#${fieldId} + .location-btn`);
    const originalContent = locationBtn.innerHTML;
    locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    locationBtn.disabled = true;
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      function(position) {
        console.log("Geolocation successful:", position.coords);
        // Get address from coordinates
        reverseGeocode(position.coords.latitude, position.coords.longitude, fieldId);
        
        // Reset button
        locationBtn.innerHTML = originalContent;
        locationBtn.disabled = false;
      },
      function(error) {
        console.error("Geolocation error:", error);
        alert("Error getting your location: " + error.message + ". Please enter your location manually.");
        
        // Reset button
        locationBtn.innerHTML = originalContent;
        locationBtn.disabled = false;
      },
      geoOptions
    );
  } else {
    alert("Geolocation is not supported by this browser. Please enter your location manually.");
  }
}

// Function to reverse geocode coordinates to address
function reverseGeocode(lat, lng, fieldId) {
  tt.services.reverseGeocode({
    key: application.key,
    position: [lng, lat]
  })
  .go()
  .then(function(response) {
    if (response.addresses && response.addresses.length > 0) {
      const address = response.addresses[0].address;
      const formattedAddress = address.freeformAddress || `${address.streetName || ''} ${address.municipality || ''}`;
      document.getElementById(fieldId).value = formattedAddress;
    } else {
      document.getElementById(fieldId).value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  })
  .catch(function(error) {
    document.getElementById(fieldId).value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  });
}

// Function to select from stations
function selectFromStations() {
  window.location.href = 'ev_search.html';
}

// Function to check URL parameters
function checkUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if destination parameter exists
  if (urlParams.has('dest')) {
    const destParam = urlParams.get('dest');
    const [lat, lng] = destParam.split(',');
    
    if (lat && lng) {
      // Set destination field
      reverseGeocode(parseFloat(lat), parseFloat(lng), ids.html.finish);
      
      // Use current location for start if available
      useCurrentLocation(ids.html.start);
      
      // Calculate route after a delay to allow geocoding to complete
      setTimeout(() => {
        handleRouteSearch();
      }, 2000);
    }
  }
  
  // Check if start and finish parameters exist
  if (urlParams.has('start') && urlParams.has('finish')) {
    document.getElementById(ids.html.start).value = urlParams.get('start');
    document.getElementById(ids.html.finish).value = urlParams.get('finish');
    
    // Calculate route
    setTimeout(() => {
      handleRouteSearch();
    }, 1000);
  }
}

// Function to try EV routing first
function tryCalculateEVRoute() {
  console.log('Attempting EV route calculation...');
  
  // Clear any existing route first
  if (routeData != null) {
    clearRoute();
  }
  
  // Check if we're on a mobile device to adjust parameters
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  console.log("Device detection - Mobile:", isMobile);
  
  // Simplified EV parameters for mobile devices
  const evParams = {
    key: application.key,
    locations: [startLocation.position, finishLocation.position],
    computeBestOrder: false,
    routeType: 'eco',
    traffic: true,
    avoid: 'unpavedRoads',
    vehicleEngineType: 'electric',
    constantSpeedConsumptionInkWhPerHundredkm: [
      { speed: 50, consumption: 13 },
      { speed: 100, consumption: 21 }
    ],
    currentChargeInkWh: 55,
    maxChargeInkWh: 60,
    auxiliaryPowerInkW: 1.7
  };
  
  // Add advanced parameters only for desktop
  if (!isMobile) {
    Object.assign(evParams, {
      vehicleWeight: 2000,
      vehicleAxleWeight: 1000,
      vehicleLength: 5,
      vehicleWidth: 2.1,
      vehicleHeight: 1.8,
      vehicleMaxSpeed: 120,
      accelerationEfficiency: 0.33,
      decelerationEfficiency: 0.33,
      uphillEfficiency: 0.33,
      downhillEfficiency: 0.33,
      minChargeAtDestinationInkWh: 8,
      minChargeAtChargingStopsInkWh: 8,
      chargingModes: [
        {
          chargingPower: 150,
          chargingMode: 'Fast',
          chargingCurve: [
            { stateOfChargeInkWh: 0, power: 150 },
            { stateOfChargeInkWh: 40, power: 150 },
            { stateOfChargeInkWh: 50, power: 60 },
            { stateOfChargeInkWh: 60, power: 0 }
          ]
        }
      ]
    });
  }
  
  tt.services.calculateRoute(evParams)
  .go()
  .then(function(routeData) {
    console.log('EV route calculation successful:', routeData);
    
    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById('route-loading-indicator');
    if (loadingIndicator && document.body.contains(loadingIndicator)) {
      document.body.removeChild(loadingIndicator);
    }
    
    displayRoute(routeData);
  })
  .catch(function(error) {
    console.error('EV route calculation failed, falling back to standard routing:', error);
    
    // Fall back to standard routing
    tryCalculateStandardRoute();
  });
}

// Function to fall back to standard routing if EV routing fails
function tryCalculateStandardRoute() {
  console.log('Attempting standard route calculation...');
  displayMessage('EV routing failed. Trying standard routing...');
  
  tt.services.calculateRoute({
    key: application.key,
    locations: [startLocation.position, finishLocation.position],
    computeBestOrder: false,
    routeType: 'fastest',
    traffic: true,
    avoid: 'unpavedRoads'
    })
    .go()
  .then(function(routeData) {
    console.log('Standard route calculation successful:', routeData);
    
    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById('route-loading-indicator');
    if (loadingIndicator && document.body.contains(loadingIndicator)) {
      document.body.removeChild(loadingIndicator);
    }
    
    // Add estimated EV consumption data for display purposes
    if (routeData && routeData.routes && routeData.routes.length > 0) {
      const route = routeData.routes[0];
      const distanceInKm = route.summary.lengthInMeters / 1000;
      
      // Estimate battery consumption (15 kWh per 100 km as a rough estimate)
      const estimatedConsumption = (distanceInKm / 100) * 15;
      
      // Add to summary
      route.summary.batteryConsumptionInkWh = estimatedConsumption;
      route.summary.remainingChargeAtArrivalInkWh = Math.max(0, 55 - estimatedConsumption);
    }
    
    displayRoute(routeData);
  })
    .catch(function(error) {
    // Remove loading indicator if it exists
    const loadingIndicator = document.getElementById('route-loading-indicator');
    if (loadingIndicator && document.body.contains(loadingIndicator)) {
      document.body.removeChild(loadingIndicator);
    }
    
      if (error.hasOwnProperty('message'))
        error = error.message;

    console.error('All routing attempts failed:', error);
      displayMessage('Error calculating route. ' + error);
    });
}

function clearRoute() {
  clearRouteSummary();

  // Clear markers
  while(markers.length > 0) {
    markers.pop().remove();
  }

  // Clear route data
  if (routeData != null) {
    try {
      // Check if the layer exists before trying to remove it
      if (map.getLayer(ids.route.layer)) {
    map.removeLayer(ids.route.layer);
      }
      
      // Check if the source exists before trying to remove it
      if (map.getSource(ids.route.source)) {
    map.removeSource(ids.route.source);
      }
      
      console.log('Successfully cleared previous route');
    } catch (error) {
      console.error('Error clearing route:', error);
    }
  }
  
  routeData = null;
}

function clearRouteSummary() {
  const summary = document.getElementById(ids.html.summary);
  while(summary.firstChild)
    summary.removeChild(summary.firstChild);

  return summary;
}

function displayMessage(message) {
  // Create a loading indicator
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.innerHTML = `
    <div class="spinner"></div>
    <div>${message}</div>
  `;
  
  // Clear and add to summary
  const summary = clearRouteSummary();
  summary.appendChild(loading);
}

function displayRoute(results) {
  if (results == null) {
    displayMessage('No suitable route was found.');
    return;
  }

  routeData = results;
  console.log('Displaying route data:', routeData);

  // Check if we have routes
  if (!routeData.routes || routeData.routes.length === 0) {
    displayMessage('No routes found in the response.');
    return;
  }

  try {
  const route = routeData.routes[0];

    // Ensure route has a summary object
    if (!route.summary) {
      console.error('Route summary is missing');
      route.summary = {}; // Create an empty summary to avoid errors
    }
    
    // Ensure required properties exist
    route.summary.lengthInMeters = route.summary.lengthInMeters || 0;
    route.summary.travelTimeInSeconds = route.summary.travelTimeInSeconds || 0;
    route.summary.batteryConsumptionInkWh = route.summary.batteryConsumptionInkWh || 0;
    route.summary.remainingChargeAtArrivalInkWh = route.summary.remainingChargeAtArrivalInkWh || 0;
    
    const geoJson = routeData.toGeoJson();

    // Make sure the map is fully loaded before adding the route
    if (!map.loaded()) {
      console.log('Map not fully loaded, waiting...');
      map.on('load', function() {
        // Add route to map
  addRoute(geoJson);
        
        // Add markers
  addRouteMarkers(route);
        
        // Add route summary
        addRouteSummary(route);
        
        // Fit map to route
  fitMapToRoute(geoJson);
      });
    } else {
      // Add route to map
      addRoute(geoJson);
      
      // Add markers
      addRouteMarkers(route);
      
      // Add route summary
  addRouteSummary(route);
      
      // Fit map to route
      fitMapToRoute(geoJson);
    }
  } catch (error) {
    console.error('Error displaying route:', error);
    displayMessage('Error displaying route: ' + error.message);
  }
}

function findLocation(elementId, callbackFunction) {
   const queryText = getValue(elementId);

  tt.services.fuzzySearch({ key: application.key, query: queryText })
      .go()
      .then(callbackFunction)
      .catch(function(error) {
       alert('Could not find location (' + queryText + '). ' + error.message);
      });
}

function fitMapToRoute(geoJson) {
  const bounds = getBounds(geoJson);
  map.fitBounds(bounds, { padding: appearance.line.padding });
}

function formatMetersToKilometers(meters) {
  // Check if meters is undefined or null
  if (meters === undefined || meters === null) {
    return "0 km";
  }
  // Always return with 'km' unit
  return (meters / units.metersPerKilometer).toFixed(1) + ' km';
}

function formatSecondsToTime(seconds) {
  // For display in the overview section, use a more human-readable format
  if (seconds < units.secondsPerMinute) {
    return seconds + ' sec';
  }

  if (seconds < units.secondsPerHour) {
    return Math.floor(seconds / units.secondsPerMinute) + ' min';
  }

  const hours = Math.floor(seconds / units.secondsPerHour);
  const minutes = Math.floor((seconds % units.secondsPerHour) / units.secondsPerMinute);
  const remainingSeconds = Math.floor(seconds % units.secondsPerMinute);

  // For route summary in the sidebar, use a more detailed format
  return hours + ' h ' + minutes + ' min';
}

function formatFixedDecimal(value) {
  if (value === undefined || value === null) {
    return "0.0";
  }
  return value.toFixed(1);
}

function getBounds(geoJson) {
  const bounds = new tt.LngLatBounds();
  const features = geoJson.features;

  features.forEach(function(feature) {
    const geometry = feature.geometry;
    const coordinates = geometry.coordinates;

    if (geometry.type === 'Point') {
      bounds.extend(tt.LngLat.convert(coordinates));
    } else if (geometry.type === 'LineString') {
      coordinates.forEach(function(point) {
        bounds.extend(tt.LngLat.convert(point));
      });
    }
  });

  return bounds;
}

function getLocation(results, elementId) {
   if (results.results.length > 0)
     return results.results[0];

  alert('Could not find location: ' + getValue(elementId));
  return null;
}

function getValue(elementId) {
  return document.getElementById(elementId).value;
}

function init() {
  tt.setProductInfo(application.name, application.version);
  map = tt.map({ 
    key: application.key, 
    container: ids.html.map,
    center: [77.2090, 28.6139], // Default center (Delhi)
    zoom: 10
  });
  
  // Add map controls
  map.addControl(new tt.FullscreenControl());
  map.addControl(new tt.NavigationControl());
  
  // Check if TomTom services are available
  if (!tt.services || !tt.services.calculateRoute) {
    console.error('TomTom services not properly loaded. Make sure the TomTom SDK is correctly included.');
    displayMessage('Error: TomTom services not properly loaded. Please check your internet connection and reload the page.');
  } else {
    console.log('TomTom services loaded successfully');
  }
  
  // Check for URL parameters
  checkUrlParameters();
}

// Function to handle route search button click
function handleRouteSearch() {
  // Check if TomTom services are available
  if (!tt.services || !tt.services.calculateRoute) {
    console.error('TomTom services not properly loaded. Cannot calculate route.');
    displayMessage('Error: TomTom services not properly loaded. Please check your internet connection and reload the page.');
    return;
  }

  // Clear any existing route first to avoid duplicate ID errors
  clearRoute();

  // Add loading indicator
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.id = 'route-loading-indicator';
  loading.innerHTML = `
    <div class="spinner"></div>
    <div>Calculating route...</div>
  `;
  document.body.appendChild(loading);

  // Hide central box and overlay
  document.getElementById(ids.html.centralBox).classList.add('hidden');
  document.getElementById(ids.html.overlay).classList.add('hidden');

  // Calculate route
  findStart();

  // Remove loading indicator after a delay or on error
  setTimeout(() => {
    if (document.body.contains(loading)) {
      document.body.removeChild(loading);
    }
  }, 10000); // 10 second timeout as a fallback
}

// Navigate to booking page with station details
function navigateToBookSlot(stationAddress, stationName, lat, lng) {
  // Store complete station information in localStorage
  const stationId = 'manual-' + new Date().getTime(); // Generate a unique ID for manually selected stations
  
  localStorage.setItem('selectedStationId', stationId);
  localStorage.setItem('selectedStationName', stationName || 'EV Charging Station');
  localStorage.setItem('selectedStationAddress', stationAddress);
  
  if (lat && lng) {
    localStorage.setItem('selectedStationLat', lat);
    localStorage.setItem('selectedStationLng', lng);
  } else if (finishLocation && finishLocation.position) {
    // Use destination coordinates if available
    localStorage.setItem('selectedStationLat', finishLocation.position.lat);
    localStorage.setItem('selectedStationLng', finishLocation.position.lng);
  }
  
  console.log('Station data saved from routing:', {
    id: stationId,
    name: stationName || 'EV Charging Station',
    address: stationAddress,
    position: { 
      lat: lat || (finishLocation?.position?.lat || ''), 
      lng: lng || (finishLocation?.position?.lng || '') 
    }
  });
  
  // Navigate to booking page
  window.location.href = 'book_slot.html';
}