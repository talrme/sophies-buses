// API Configuration
const API_KEY = '1D2F479986AC4AB6C54967362E0371F8';
const API_BASE = 'https://api.actransit.org/transit';

// State
let config = {
    toWork: [],
    toHome: []
};
let testTime = null;
let refreshInterval = null;
let routesCache = null; // Cache for all routes
let busDataCache = { toWork: [], toHome: [] }; // Cache bus data for time updates

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    loadConfigFromURL();
    console.log('Config loaded:', config);
    initializeEventListeners();
    updateTimeDisplay();
    startAutoRefresh();
});

// ============= TIME MANAGEMENT =============

function getCurrentTime() {
    if (testTime) {
        const [hours, minutes] = testTime.split(':');
        const now = new Date();
        now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return now;
    }
    return new Date();
}

function isBeforeNoon() {
    return getCurrentTime().getHours() < 12;
}

function updateSectionOrder() {
    const container = document.querySelector('.container');
    const workSection = document.getElementById('to-work-section');
    const homeSection = document.getElementById('to-home-section');
    
    if (isBeforeNoon()) {
        workSection.style.order = '1';
        homeSection.style.order = '2';
    } else {
        homeSection.style.order = '1';
        workSection.style.order = '2';
    }
}

function updateTimeDisplay() {
    const display = document.getElementById('current-time-display');
    const time = getCurrentTime();
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const mode = testTime ? '📅 Schedule Mode' : '🔴 Live Mode';
    display.textContent = `${mode} | ${timeStr} (${isBeforeNoon() ? 'Morning' : 'Afternoon'})`;
}

// ============= URL & CONFIG MANAGEMENT =============

function loadConfigFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Parse toWork stops
    const toWork = params.get('toWork');
    if (toWork) {
        config.toWork = toWork.split(',').map(parseStopConfig);
    } else {
        // Default stops for To Work
        config.toWork = [
            { route: '18', direction: 'Southbound', stopId: '53085', stopName: 'Shattuck Av & 59th St', walkTime: 6, lat: 37.8442, lon: -122.26514 },
            { route: '6', direction: 'Southbound', stopId: '54499', stopName: 'Telegraph Av & 59th St', walkTime: 11, lat: 37.8447505, lon: -122.2614085 },
            { route: '88', direction: 'Southbound', stopId: '59090', stopName: 'Market St & 59th St', walkTime: 10, lat: 37.8435226, lon: -122.2750257 },
            { route: '12', direction: 'Southbound', stopId: '56156', stopName: 'Martin Luther King Jr Way & 59th St', walkTime: 3, lat: 37.8439824, lon: -122.2707689 },
            { route: '22', direction: 'Eastbound', stopId: '53582', stopName: 'Stanford Av & Market St', walkTime: 9, lat: 37.8443154, lon: -122.2755564 }
        ];
    }
    
    // Parse toHome stops
    const toHome = params.get('toHome');
    if (toHome) {
        config.toHome = toHome.split(',').map(parseStopConfig);
    } else {
        // Default stops for To Home
        config.toHome = [
            { route: '6', direction: 'Northbound', stopId: '51636', stopName: '10th St & Washington St', walkTime: 3, lat: 37.802254, lon: -122.2744562 },
            { route: '18', direction: 'Northbound', stopId: '52642', stopName: '12th St & Franklin St', walkTime: 6, lat: 37.8026868, lon: -122.2711135 },
            { route: '88', direction: 'Northbound', stopId: '55557', stopName: '12th St & Broadway (12th St BART)', walkTime: 6, lat: 37.803168, lon: -122.272624 },
            { route: '22', direction: 'Westbound', stopId: '55557', stopName: '12th St & Broadway (12th St BART)', walkTime: 6, lat: 37.803168, lon: -122.272624 },
            { route: '12', direction: 'Northbound', stopId: '57333', stopName: 'Broadway & 7th St', walkTime: 4, lat: 37.7996901, lon: -122.273941 }
        ];
    }
    
    updateStopsList();
}

function parseStopConfig(str) {
    const [route, direction, stopId, walkTime, stopName, lat, lon] = str.split('|');
    return {
        route,
        direction,
        stopId,
        walkTime: parseInt(walkTime),
        stopName: stopName || 'Unknown Stop',
        lat: parseFloat(lat) || 0,
        lon: parseFloat(lon) || 0
    };
}

function encodeStopConfig(stop) {
    return `${stop.route}|${stop.direction}|${stop.stopId}|${stop.walkTime}|${stop.stopName}|${stop.lat}|${stop.lon}`;
}

function updateURL() {
    const params = new URLSearchParams();
    
    if (config.toWork.length > 0) {
        params.set('toWork', config.toWork.map(encodeStopConfig).join(','));
    }
    
    if (config.toHome.length > 0) {
        params.set('toHome', config.toHome.map(encodeStopConfig).join(','));
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
}

// ============= API CALLS =============

async function getAllRoutes() {
    // Return cached routes if available
    if (routesCache) {
        console.log('Using cached routes:', routesCache.length, 'routes');
        return routesCache;
    }
    
    console.log('Fetching all routes from API...');
    const url = `${API_BASE}/routes?token=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch routes`);
    const data = await response.json();
    
    console.log('Fetched', data.length, 'routes from API');
    
    // Cache the routes
    routesCache = data;
    return data;
}

async function getStopsForRoute(route) {
    const url = `${API_BASE}/route/${route}/stops?token=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch stops for route ${route}`);
    return await response.json();
}
    
async function getPredictionsForStop(stopId, route) {
    const url = `${API_BASE}/actrealtime/prediction?token=${API_KEY}&stpid=${stopId}&rt=${route}`;
    console.log(`Fetching predictions: stop ${stopId}, route ${route}`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch predictions`);
    const data = await response.json();
    const predictions = data['bustime-response']?.prd || [];
    
    // Log what routes we got back
    const routesReturned = [...new Set(predictions.map(p => p.rt))];
    if (routesReturned.length > 0) {
        console.log(`  API returned ${predictions.length} predictions for routes: ${routesReturned.join(', ')}`);
    }
    
    return predictions;
}
    
async function getScheduleForStop(stopId, route) {
    const url = `${API_BASE}/route/${route}/schedule/Current?token=${API_KEY}&stopId=${stopId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch schedule`);
    const data = await response.json();
    
    const routes = data.Routes || [];
    const allStopTimes = [];
    
    routes.forEach(routeData => {
        routeData.Trips.forEach(trip => {
            trip.StopTimes.forEach(stopTime => {
                if (stopTime.StopId === stopId) {
                    allStopTimes.push({
                        route: route,
                        destination: routeData.LineDestination,
                        direction: routeData.LineDirection,
                        arrivalTime: new Date(stopTime.StopTime),
                        tripId: trip.TripId,
                        isScheduled: true
                    });
                }
            });
        });
    });
    
    return allStopTimes;
}

// ============= BUS CALCULATIONS =============

function calculateLeaveHomeTime(arrivalTime, walkTimeMinutes) {
    const leaveTime = new Date(arrivalTime);
    leaveTime.setMinutes(leaveTime.getMinutes() - walkTimeMinutes);
    return leaveTime;
}

function filterBusesInWindow(buses, currentTime) {
    const windowEnd = new Date(currentTime);
    windowEnd.setMinutes(windowEnd.getMinutes() + 45);
    
    return buses.filter(bus => {
        const leaveTime = bus.leaveHomeTime;
        // Only show buses where leave time is now or later
        return leaveTime >= currentTime && leaveTime <= windowEnd;
    });
}

function processPredictions(predictions, stop) {
    const now = getCurrentTime();
    
    // Filter to only include predictions for the configured route
    // Use string comparison and handle case sensitivity
    const filteredPredictions = predictions.filter(pred => 
        String(pred.rt).toLowerCase() === String(stop.route).toLowerCase()
    );
    
    // Log if we filtered out any predictions
    if (predictions.length > filteredPredictions.length) {
        const filtered = predictions.filter(pred => 
            String(pred.rt).toLowerCase() !== String(stop.route).toLowerCase()
        );
        console.log(`Filtered out ${filtered.length} predictions for other routes at ${stop.stopName}:`, 
            filtered.map(p => `Route ${p.rt}`).join(', '));
    }
    
    return filteredPredictions.map(pred => {
        // Parse prediction time (format: YYYYMMDD HH:mm:ss)
        const year = pred.prdtm.substring(0, 4);
        const month = pred.prdtm.substring(4, 6);
        const day = pred.prdtm.substring(6, 8);
        const time = pred.prdtm.substring(9);
        const arrivalTime = new Date(`${year}-${month}-${day}T${time}`);
        
        const leaveHomeTime = calculateLeaveHomeTime(arrivalTime, stop.walkTime);
        const minutesUntilArrival = Math.round((arrivalTime - now) / 60000);
        const minutesUntilLeave = Math.round((leaveHomeTime - now) / 60000);
        
            return {
            route: pred.rt,
            stopId: stop.stopId,
            stopName: stop.stopName,
            stopLat: stop.lat,
            stopLon: stop.lon,
            arrivalTime,
            leaveHomeTime,
            minutesUntilArrival,
            minutesUntilLeave,
            isRealtime: pred.dly === false,
            destination: pred.des,
            scheduledTime: pred.schdtm ? parseACTransitTime(pred.schdtm) : arrivalTime
        };
    });
}

function processSchedule(scheduleItems, stop) {
    const now = getCurrentTime();
    
    // Filter to only include schedules for the configured route
    // Use string comparison and handle case sensitivity
    const filteredSchedule = scheduleItems.filter(item => 
        String(item.route).toLowerCase() === String(stop.route).toLowerCase()
    );
    
    return filteredSchedule.map(item => {
        const leaveHomeTime = calculateLeaveHomeTime(item.arrivalTime, stop.walkTime);
        const minutesUntilArrival = Math.round((item.arrivalTime - now) / 60000);
        const minutesUntilLeave = Math.round((leaveHomeTime - now) / 60000);
        
        return {
            route: item.route,
            stopId: stop.stopId,
            stopName: stop.stopName,
            stopLat: stop.lat,
            stopLon: stop.lon,
            arrivalTime: item.arrivalTime,
            leaveHomeTime,
            minutesUntilArrival,
            minutesUntilLeave,
            isRealtime: false,
            destination: item.destination,
            scheduledTime: item.arrivalTime
        };
    });
}

function parseACTransitTime(timeStr) {
    const year = timeStr.substring(0, 4);
    const month = timeStr.substring(4, 6);
    const day = timeStr.substring(6, 8);
    const time = timeStr.substring(9);
    return new Date(`${year}-${month}-${day}T${time}`);
}

// ============= UI RENDERING =============

async function loadBusesForSection(sectionKey) {
    console.log('Loading buses for section:', sectionKey);
    // Convert camelCase to kebab-case (toWork -> to-work)
    const containerId = sectionKey.replace(/([A-Z])/g, '-$1').toLowerCase() + '-buses';
    const container = document.getElementById(containerId);
    console.log('Looking for container ID:', containerId, 'Found:', container);
    const stops = config[sectionKey];
    console.log('Stops for section:', stops);
    
    if (stops.length === 0) {
        container.innerHTML = '<div class="no-buses">No stops configured. Use the configuration panel below to add stops.</div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading buses...</div>';
    
    try {
        console.log('Fetching data for', stops.length, 'stops...', testTime ? '(using schedule for test time)' : '(using real-time)');
        
        // If test time is set, use schedule API, otherwise use real-time predictions
        const allPredictions = await Promise.all(
            stops.map(stop => {
                console.log(`Fetching data for stop ${stop.stopId}, route ${stop.route}`);
                
                if (testTime) {
                    // Use schedule when testing
                    return getScheduleForStop(stop.stopId, stop.route)
                        .then(scheduleItems => {
                            console.log(`Got ${scheduleItems.length} scheduled buses for stop ${stop.stopId}`);
                            return processSchedule(scheduleItems, stop);
                        })
                        .catch(err => {
                            console.error(`Error loading schedule for stop ${stop.stopId}:`, err);
                            return [];
                        });
    } else {
                    // Use real-time predictions normally
                    return getPredictionsForStop(stop.stopId, stop.route)
                        .then(predictions => {
                            console.log(`Got ${predictions.length} predictions for stop ${stop.stopId}`);
                            return processPredictions(predictions, stop);
                        })
                        .catch(err => {
                            console.error(`Error loading predictions for stop ${stop.stopId}:`, err);
                            return [];
                        });
                }
            })
        );
        
        // Flatten and filter
        const now = getCurrentTime();
        let allBuses = allPredictions.flat();
        console.log('Total buses before filtering:', allBuses.length);
        allBuses = filterBusesInWindow(allBuses, now);
        console.log('Buses after 45-min window filter:', allBuses.length);
        
        // Sort by leave home time
        allBuses.sort((a, b) => a.leaveHomeTime - b.leaveHomeTime);
        
        // Cache the bus data for time updates
        busDataCache[sectionKey] = allBuses;
        
        // Render
        if (allBuses.length === 0) {
            console.log('No buses to display');
            container.innerHTML = '<div class="no-buses">No buses in the next 45 minutes</div>';
        } else {
            console.log('Rendering', allBuses.length, 'buses');
            container.innerHTML = '';
            allBuses.forEach((bus, index) => {
                container.appendChild(createBusCard(bus, sectionKey, index));
            });
        }
    } catch (error) {
        console.error('Error loading buses:', error);
        container.innerHTML = `<div class="error">Error loading buses: ${error.message}</div>`;
    }
}

function createBusCard(bus, section, index) {
    const card = document.createElement('div');
    card.className = 'bus-card';
    card.dataset.section = section;
    card.dataset.index = index;
    // Removed leaving-soon class - no visual change to card
    
    // Determine the label based on section
    const leaveLabel = section === 'toWork' ? 'Leave home at:' : 'Leave work at:';
    
    const arrivalTimeStr = bus.arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const leaveTimeStr = bus.leaveHomeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const scheduledTimeStr = bus.scheduledTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    const mapsUrl = `https://www.google.com/maps?q=${bus.stopLat},${bus.stopLon}`;
    
    const urgencyClass = bus.minutesUntilLeave <= 2 ? 'urgent' : bus.minutesUntilLeave <= 5 ? 'soon' : '';
    
    card.innerHTML = `
        <div class="bus-main-info">
            <div class="bus-route">${bus.route}</div>
            <div class="bus-time ${urgencyClass}" data-time-display="minutes">
                <div class="time-value">${bus.minutesUntilArrival}</div>
                <div class="time-label">min</div>
            </div>
        </div>
        <div class="bus-details">
            <div class="detail-row">
                <span class="detail-label">Stop:</span>
                <a href="${mapsUrl}" target="_blank" class="stop-link">${bus.stopName}</a>
            </div>
            <div class="detail-row">
                <span class="detail-label">Arriving:</span>
                <span class="detail-value">${arrivalTimeStr}</span>
                ${bus.isRealtime ? '<span class="live-dot"></span>' : ''}
            </div>
            <div class="detail-row">
                <span class="detail-label">Scheduled:</span>
                <span class="detail-value">${scheduledTimeStr}</span>
        </div>
            <div class="detail-row leave-time">
                <span class="detail-label">${leaveLabel}</span>
                <span class="detail-value ${urgencyClass}" data-leave-time>${leaveTimeStr}</span>
                ${bus.minutesUntilLeave < 0 ? '<span class="urgent-badge" data-go-now>GO NOW!</span>' : '<span class="urgent-badge" data-go-now style="display:none;">GO NOW!</span>'}
            </div>
        </div>
    `;
    
    return card;
}

function updateStopsList() {
    const workList = document.getElementById('stops-list-work');
    const homeList = document.getElementById('stops-list-home');
    
    // Update To Work stops
    if (config.toWork.length === 0) {
        workList.innerHTML = '<div class="stops-empty">No stops configured</div>';
    } else {
        workList.innerHTML = '';
        config.toWork.forEach((stop, index) => {
                const item = document.createElement('div');
                item.className = 'stop-item';
                item.innerHTML = `
                    <div class="stop-info">
                        <strong>Route ${stop.route}</strong> - ${stop.stopName}
                        <div class="stop-meta">${stop.direction} · ${stop.walkTime} min walk</div>
                    </div>
                    <div class="stop-actions">
                        <button class="edit-btn" data-section="toWork" data-index="${index}">✏️</button>
                        <button class="remove-btn" data-section="toWork" data-index="${index}">✕</button>
                    </div>
                `;
                workList.appendChild(item);
        });
    }
    
    // Update To Home stops
    if (config.toHome.length === 0) {
        homeList.innerHTML = '<div class="stops-empty">No stops configured</div>';
    } else {
        homeList.innerHTML = '';
        config.toHome.forEach((stop, index) => {
                const item = document.createElement('div');
                item.className = 'stop-item';
                item.innerHTML = `
                    <div class="stop-info">
                        <strong>Route ${stop.route}</strong> - ${stop.stopName}
                        <div class="stop-meta">${stop.direction} · ${stop.walkTime} min walk</div>
                    </div>
                    <div class="stop-actions">
                        <button class="edit-btn" data-section="toHome" data-index="${index}">✏️</button>
                        <button class="remove-btn" data-section="toHome" data-index="${index}">✕</button>
                    </div>
                `;
                homeList.appendChild(item);
        });
    }
    
    // Add edit button listeners
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            const index = parseInt(e.target.dataset.index);
            openEditStopModal(section, index);
        });
    });
    
    // Add remove button listeners
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            const index = parseInt(e.target.dataset.index);
            
            if (confirm('Remove this stop?')) {
                config[section].splice(index, 1);
                updateURL();
                updateStopsList();
                loadAllBuses();
            }
        });
    });
}

// ============= FORM HANDLING =============

async function loadDirections() {
    const route = document.getElementById('route-input').value;
    const directionSelect = document.getElementById('direction-select');
    const stopSelect = document.getElementById('stop-select');
    
    if (!route) {
        return;
    }
    
    try {
        directionSelect.innerHTML = '<option value="">Loading...</option>';
        directionSelect.disabled = true;
        stopSelect.innerHTML = '<option value="">Select direction first...</option>';
        stopSelect.disabled = true;
        
        const stops = await getStopsForRoute(route);
        
        if (!stops || stops.length === 0) {
            throw new Error('No stops found for this route');
        }
        
        // Populate directions
        directionSelect.innerHTML = '<option value="">Select direction...</option>';
        stops.forEach(direction => {
            const option = document.createElement('option');
            option.value = JSON.stringify(direction);
            option.textContent = `${direction.Direction} to ${direction.Destination}`;
            directionSelect.appendChild(option);
        });
        
        directionSelect.disabled = false;
    } catch (error) {
        alert(`Error loading directions: ${error.message}`);
        directionSelect.innerHTML = '<option value="">Error loading directions</option>';
    }
}

function loadStops() {
    const directionSelect = document.getElementById('direction-select');
    const stopSelect = document.getElementById('stop-select');
    
    const directionData = JSON.parse(directionSelect.value);
    
    stopSelect.innerHTML = '';
    directionData.Stops.forEach(stop => {
        const option = document.createElement('option');
        option.value = JSON.stringify(stop);
        option.textContent = `${stop.Name} (${stop.StopId})`;
        stopSelect.appendChild(option);
    });
    
    stopSelect.disabled = false;
}

function addStop(e) {
    e.preventDefault();
    
    const section = document.getElementById('section-select').value;
    const editIndex = document.getElementById('edit-index').value;
    const route = document.getElementById('route-input').value;
    const directionData = JSON.parse(document.getElementById('direction-select').value);
    const stopData = JSON.parse(document.getElementById('stop-select').value);
    const walkTime = parseInt(document.getElementById('walk-time-input').value);
    
    const stopConfig = {
        route,
        direction: directionData.Direction,
        stopId: stopData.StopId,
        stopName: stopData.Name,
        walkTime,
        lat: stopData.Latitude,
        lon: stopData.Longitude
    };
    
    if (editIndex !== '') {
        // Edit existing stop
        config[section][parseInt(editIndex)] = stopConfig;
    } else {
        // Add new stop
        config[section].push(stopConfig);
    }
    
    updateURL();
    updateStopsList();
    loadAllBuses();
    
    // Close modal
    closeAddStopModal();
}

// ============= EVENT LISTENERS =============

function initializeEventListeners() {
    // Toggle settings panel
    document.getElementById('toggle-settings').addEventListener('click', () => {
        const panel = document.getElementById('settings-panel');
        const btn = document.getElementById('toggle-settings');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            btn.classList.add('active');
            } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    });
    
    // Add stop buttons
    document.querySelectorAll('.add-stop-btn-small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            openAddStopModal(section);
        });
    });
    
    // Close modal
    document.getElementById('close-add-stop').addEventListener('click', closeAddStopModal);
    document.getElementById('add-stop-modal').addEventListener('click', (e) => {
        if (e.target.id === 'add-stop-modal') {
            closeAddStopModal();
        }
    });
    
    // Route select change - auto load directions
    document.getElementById('route-input').addEventListener('change', async (e) => {
        const route = e.target.value;
        if (route) {
            await loadDirections();
            } else {
            // Reset direction and stop selects if no route selected
            document.getElementById('direction-select').innerHTML = '<option value="">Select route first...</option>';
            document.getElementById('direction-select').disabled = true;
            document.getElementById('stop-select').innerHTML = '<option value="">Select direction first...</option>';
            document.getElementById('stop-select').disabled = true;
        }
    });
    
    // Direction select change
    document.getElementById('direction-select').addEventListener('change', loadStops);
    
    // Add stop form
    document.getElementById('add-stop-form').addEventListener('submit', addStop);
    
    // Test time picker
    document.getElementById('test-time').addEventListener('change', (e) => {
        testTime = e.target.value;
        document.querySelector('.time-picker-section').classList.add('test-mode-active');
        updateTimeDisplay();
        updateSectionOrder();
        loadAllBuses();
    });
    
    // Reset time button
    document.getElementById('reset-time').addEventListener('click', () => {
        testTime = null;
        document.getElementById('test-time').value = '';
        document.querySelector('.time-picker-section').classList.remove('test-mode-active');
        updateTimeDisplay();
        updateSectionOrder();
        loadAllBuses();
    });
}

async function openAddStopModal(section) {
    document.getElementById('section-select').value = section;
    document.getElementById('edit-index').value = ''; // Clear edit index
    document.getElementById('add-stop-modal').style.display = 'flex';
    
    // Update modal title and labels
    const modalTitle = document.querySelector('.modal-card-header h3');
    modalTitle.textContent = 'Add Stop';
    
    const submitBtn = document.getElementById('submit-stop-btn');
    submitBtn.textContent = 'Add Stop';
    
    const walkTimeLabel = document.getElementById('walk-time-label');
    walkTimeLabel.textContent = section === 'toWork' ? 
        'Walk time from home (minutes):' : 
        'Walk time from work (minutes):';
    
    const routeSelect = document.getElementById('route-input');
    const directionSelect = document.getElementById('direction-select');
    const stopSelect = document.getElementById('stop-select');
    
    // Show all form fields for adding
    routeSelect.parentElement.style.display = 'flex';
    directionSelect.parentElement.style.display = 'flex';
    stopSelect.parentElement.style.display = 'flex';
    
    // Reset form
    routeSelect.innerHTML = '<option value="">Loading routes...</option>';
    routeSelect.disabled = true;
    directionSelect.innerHTML = '<option value="">Select route first...</option>';
    directionSelect.disabled = true;
    stopSelect.innerHTML = '<option value="">Select direction first...</option>';
    stopSelect.disabled = true;
    document.getElementById('walk-time-input').value = '10';
    
    // Load all routes
    try {
        const routes = await getAllRoutes();
        routeSelect.innerHTML = '<option value="">Select route...</option>';
        
        // Sort routes numerically/alphabetically
        const sortedRoutes = routes.sort((a, b) => {
            const aNum = parseInt(a.RouteId);
            const bNum = parseInt(b.RouteId);
            
            // If both are numbers, sort numerically
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            // Otherwise sort alphabetically
            return a.RouteId.localeCompare(b.RouteId);
        });
        
        sortedRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.RouteId;
            option.textContent = `${route.RouteId} - ${route.Name}`;
            routeSelect.appendChild(option);
        });
        
        routeSelect.disabled = false;
            } catch (error) {
        console.error('Error loading routes:', error);
        routeSelect.innerHTML = '<option value="">Error loading routes. Please try again.</option>';
        alert('Failed to load routes. Please close and try again.');
        }

        // Add escape key handler
    document.addEventListener('keydown', escapeHandler);
}

async function openEditStopModal(section, index) {
    const stop = config[section][index];
    
    document.getElementById('section-select').value = section;
    document.getElementById('edit-index').value = index; // Store the index we're editing
    document.getElementById('add-stop-modal').style.display = 'flex';
    
    // Update modal title and labels
    const modalTitle = document.querySelector('.modal-card-header h3');
    modalTitle.textContent = `Edit Stop - Route ${stop.route}`;
    
    const submitBtn = document.getElementById('submit-stop-btn');
    submitBtn.textContent = 'Update Stop';
    
    const walkTimeLabel = document.getElementById('walk-time-label');
    walkTimeLabel.textContent = section === 'toWork' ? 
        'Walk time from home (minutes):' : 
        'Walk time from work (minutes):';
    
    const routeSelect = document.getElementById('route-input');
    const directionSelect = document.getElementById('direction-select');
    const stopSelect = document.getElementById('stop-select');
    
    // Show all form fields for editing
    routeSelect.parentElement.style.display = 'flex';
    directionSelect.parentElement.style.display = 'flex';
    stopSelect.parentElement.style.display = 'flex';
    
    // Load all routes
    routeSelect.innerHTML = '<option value="">Loading routes...</option>';
    routeSelect.disabled = true;
    directionSelect.innerHTML = '<option value="">Select route first...</option>';
    directionSelect.disabled = true;
    stopSelect.innerHTML = '<option value="">Select direction first...</option>';
    stopSelect.disabled = true;
    
    try {
        const routes = await getAllRoutes();
        routeSelect.innerHTML = '<option value="">Select route...</option>';
        
        const sortedRoutes = routes.sort((a, b) => {
            const aNum = parseInt(a.RouteId);
            const bNum = parseInt(b.RouteId);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return a.RouteId.localeCompare(b.RouteId);
        });
        
        sortedRoutes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.RouteId;
            option.textContent = `${route.RouteId} - ${route.Name}`;
            if (route.RouteId === stop.route) {
                option.selected = true;
            }
            routeSelect.appendChild(option);
        });
        
        routeSelect.disabled = false;
        
        // Load directions for the current route (getStopsForRoute returns directions)
        const directions = await getStopsForRoute(stop.route);
        directionSelect.innerHTML = '<option value="">Select direction...</option>';
        
        let selectedDirection = null;
        directions.forEach(dir => {
            const option = document.createElement('option');
            option.value = JSON.stringify(dir);
            option.textContent = `${dir.Direction} to ${dir.Destination}`;
            if (dir.Direction === stop.direction) {
                option.selected = true;
                selectedDirection = dir;
            }
            directionSelect.appendChild(option);
        });
        directionSelect.disabled = false;
        
        // Load stops for the selected direction
        if (selectedDirection) {
            stopSelect.innerHTML = '<option value="">Select stop...</option>';
            selectedDirection.Stops.forEach(s => {
                const option = document.createElement('option');
                option.value = JSON.stringify(s);
                option.textContent = `${s.Name} (${s.StopId})`;
                if (s.StopId.toString() === stop.stopId.toString()) {
                    option.selected = true;
                }
                stopSelect.appendChild(option);
            });
            stopSelect.disabled = false;
        }
        
    } catch (error) {
        console.error('Error loading routes for edit:', error);
        alert('Failed to load route data. Please try again.');
    }
    
    // Set walk time
    document.getElementById('walk-time-input').value = stop.walkTime;
    
    // Add escape key handler
    document.addEventListener('keydown', escapeHandler);
}

function closeAddStopModal() {
    document.getElementById('add-stop-modal').style.display = 'none';
    document.removeEventListener('keydown', escapeHandler);
}

function escapeHandler(e) {
    if (e.key === 'Escape') {
        closeAddStopModal();
    }
}

// ============= AUTO REFRESH =============

function loadAllBuses() {
    updateSectionOrder();
    loadBusesForSection('toWork');
    loadBusesForSection('toHome');
}

function startAutoRefresh() {
    // Load data once on start
    loadAllBuses();
    
    // Update countdown times every minute without re-fetching data
    refreshInterval = setInterval(() => {
        updateTimeDisplay();
        updateBusCountdowns();
    }, 60000); // Update every minute
}

function updateBusCountdowns() {
    const now = getCurrentTime();
    
    ['toWork', 'toHome'].forEach(section => {
        const buses = busDataCache[section];
        if (!buses || buses.length === 0) return;
        
        buses.forEach((bus, index) => {
            const card = document.querySelector(`.bus-card[data-section="${section}"][data-index="${index}"]`);
            if (!card) return;
            
            // Recalculate minutes
            const minutesUntilArrival = Math.round((bus.arrivalTime - now) / 60000);
            const minutesUntilLeave = Math.round((bus.leaveHomeTime - now) / 60000);
            
            // Update minutes display
            const timeValue = card.querySelector('.time-value');
            if (timeValue && minutesUntilArrival >= 0) {
                timeValue.textContent = minutesUntilArrival;
            }
            
            // Update urgency class on time display
            const busTime = card.querySelector('.bus-time');
            if (busTime) {
                busTime.classList.remove('urgent', 'soon');
                if (minutesUntilLeave <= 2) {
                    busTime.classList.add('urgent');
                } else if (minutesUntilLeave <= 5) {
                    busTime.classList.add('soon');
                }
            }
            
            // Update leave time display
            const leaveTimeEl = card.querySelector('[data-leave-time]');
            if (leaveTimeEl) {
                leaveTimeEl.classList.remove('urgent', 'soon');
                if (minutesUntilLeave <= 2) {
                    leaveTimeEl.classList.add('urgent');
                } else if (minutesUntilLeave <= 5) {
                    leaveTimeEl.classList.add('soon');
                }
            }
            
            // Show/hide GO NOW badge
            const goNowBadge = card.querySelector('[data-go-now]');
            if (goNowBadge) {
                if (minutesUntilLeave < 0) {
                    goNowBadge.style.display = 'inline-block';
                } else {
                    goNowBadge.style.display = 'none';
                }
            }
        });
    });
}

// Handle tab visibility - pause countdown updates when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    } else {
        if (!refreshInterval) {
            // Restart countdown updates
            refreshInterval = setInterval(() => {
                updateTimeDisplay();
                updateBusCountdowns();
            }, 60000);
            // Update immediately when coming back
            updateBusCountdowns();
        }
    }
});
