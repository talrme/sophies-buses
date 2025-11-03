// API Configuration
const API_KEY = '1D2F479986AC4AB6C54967362E0371F8';
const API_BASE = 'https://api.actransit.org/transit';

// State
let config = {
    toWork: [],
    toHome: []
};
let userName = 'Sophie'; // Default name
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
    
    // Parse name
    const nameParam = params.get('name');
    if (nameParam) {
        userName = decodeURIComponent(nameParam);
    }
    updateBannerName();
    
    // Parse toWork stops
    const toWork = params.get('toWork');
    if (toWork) {
        config.toWork = toWork.split(',').map(parseStopConfig);
    } else {
        // Default stops for To Work
        config.toWork = [
            { route: '18', direction: 'Southbound', stopId: '53085', stopName: 'Shattuck Av & 59th St', walkTime: 6, lat: 37.8442, lon: -122.26514, destinationStopId: '53334', destinationStopName: '11th St & Franklin St', walkTimeToDestination: 6, manualBusTravelTime: 20 },
            { route: '6', direction: 'Southbound', stopId: '54499', stopName: 'Telegraph Av & 59th St', walkTime: 11, lat: 37.8447505, lon: -122.2614085, destinationStopId: '51636', destinationStopName: '10th St & Washington St', walkTimeToDestination: 2, manualBusTravelTime: 22 },
            { route: '88', direction: 'Southbound', stopId: '59090', stopName: 'Market St & 59th St', walkTime: 10, lat: 37.8435226, lon: -122.2750257, destinationStopId: '51536', destinationStopName: '10th St & Clay St', walkTimeToDestination: 1, manualBusTravelTime: 20 },
            { route: '12', direction: 'Southbound', stopId: '56156', stopName: 'Martin Luther King Jr Way & 59th St', walkTime: 3, lat: 37.8439824, lon: -122.2707689, destinationStopId: '51536', destinationStopName: 'Broadway & 9th St', walkTimeToDestination: 1, manualBusTravelTime: 36 },
            { route: '22', direction: 'Eastbound', stopId: '53582', stopName: 'Stanford Av & Market St', walkTime: 9, lat: 37.8443154, lon: -122.2755564, destinationStopId: '54777', destinationStopName: '11th St & Broadway', walkTimeToDestination: 4, manualBusTravelTime: 29 }
        ];
    }
    
    // Parse toHome stops
    const toHome = params.get('toHome');
    if (toHome) {
        config.toHome = toHome.split(',').map(parseStopConfig);
    } else {
        // Default stops for To Home
        config.toHome = [
            { route: '6', direction: 'Northbound', stopId: '51636', stopName: '10th St & Washington St', walkTime: 3, lat: 37.802254, lon: -122.2744562, destinationStopId: '55002', destinationStopName: 'Telegraph Av & 59th St.', walkTimeToDestination: 10, manualBusTravelTime: 22 },
            { route: '18', direction: 'Northbound', stopId: '52642', stopName: '12th St & Franklin St', walkTime: 6, lat: 37.8026868, lon: -122.2711135, destinationStopId: '53087', destinationStopName: 'Shattuck Av & 59th St', walkTimeToDestination: 5, manualBusTravelTime: 21 },
            { route: '88', direction: 'Northbound', stopId: '55557', stopName: '12th St & Broadway (12th St BART)', walkTime: 6, lat: 37.803168, lon: -122.272624, destinationStopId: '58528', destinationStopName: 'Market St & Arlington Av', walkTimeToDestination: 10, manualBusTravelTime: 18 },
            { route: '22', direction: 'Westbound', stopId: '55557', stopName: '12th St & Broadway (12th St BART)', walkTime: 6, lat: 37.803168, lon: -122.272624, destinationStopId: '52805', destinationStopName: 'Alcatraz Av & Dover St', walkTimeToDestination: 8, manualBusTravelTime: 32 },
            { route: '12', direction: 'Northbound', stopId: '57333', stopName: 'Broadway & 7th St', walkTime: 4, lat: 37.7996901, lon: -122.273941, destinationStopId: '52425', destinationStopName: 'Martin Luther King Jr Way & 59th St', walkTimeToDestination: 2, manualBusTravelTime: 39 }
        ];
    }
    
    updateStopsList();
}

function parseStopConfig(str) {
    const [route, direction, stopId, walkTime, stopName, lat, lon, destStopId, destStopName, walkTimeToDest, manualBusTravelTime] = str.split('|');
        return {
        route,
        direction,
        stopId,
        walkTime: parseInt(walkTime),
        stopName: stopName || 'Unknown Stop',
        lat: parseFloat(lat) || 0,
        lon: parseFloat(lon) || 0,
        destinationStopId: destStopId || null,
        destinationStopName: destStopName || null,
        walkTimeToDestination: walkTimeToDest ? parseInt(walkTimeToDest) : null,
        manualBusTravelTime: manualBusTravelTime ? parseInt(manualBusTravelTime) : null
    };
}

function encodeStopConfig(stop) {
    return `${stop.route}|${stop.direction}|${stop.stopId}|${stop.walkTime}|${stop.stopName}|${stop.lat}|${stop.lon}|${stop.destinationStopId || ''}|${stop.destinationStopName || ''}|${stop.walkTimeToDestination || ''}|${stop.manualBusTravelTime || ''}`;
}

function updateURL() {
    const params = new URLSearchParams();
    
    // Add name if not default
    if (userName && userName !== 'Sophie') {
        params.set('name', encodeURIComponent(userName));
    }
    
    if (config.toWork.length > 0) {
        params.set('toWork', config.toWork.map(encodeStopConfig).join(','));
    }
    
    if (config.toHome.length > 0) {
        params.set('toHome', config.toHome.map(encodeStopConfig).join(','));
    }
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newURL);
}

function updateBannerName() {
    const bannerNameEl = document.getElementById('banner-name');
    const nameInput = document.getElementById('user-name');
    
    if (bannerNameEl) {
        bannerNameEl.textContent = userName + "'s";
    }
    
    if (nameInput) {
        nameInput.value = userName;
    }
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
            scheduledTime: pred.schdtm ? parseACTransitTime(pred.schdtm) : arrivalTime,
            walkTime: stop.walkTime,
            destinationStopId: stop.destinationStopId,
            destinationStopName: stop.destinationStopName,
            walkTimeToDestination: stop.walkTimeToDestination,
            manualBusTravelTime: stop.manualBusTravelTime,
            vehicleId: pred.vid || null,
            tripId: pred.tatripid || null,
            destinationArrivalTime: null // Will be filled in later
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
            scheduledTime: item.arrivalTime,
            walkTime: stop.walkTime,
            destinationStopId: stop.destinationStopId,
            destinationStopName: stop.destinationStopName,
            walkTimeToDestination: stop.walkTimeToDestination,
            manualBusTravelTime: stop.manualBusTravelTime
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

async function matchDestinationPredictions(buses, destinationStopId, route) {
    // Check if any bus has manual travel time configured
    const hasManualTime = buses.length > 0 && buses[0].manualBusTravelTime;
    
    // If manual travel time is provided, use it and skip all API calls
    if (hasManualTime) {
        console.log(`📝 Using manual travel time: ${buses[0].manualBusTravelTime} min (skipping API calls)`);
        
        buses.forEach(bus => {
            const destArrival = new Date(
                bus.arrivalTime.getTime() + bus.manualBusTravelTime * 60000
            );
            bus.destinationArrivalTime = destArrival;
            bus.finalArrivalTime = new Date(
                destArrival.getTime() + bus.walkTimeToDestination * 60000
            );
            bus.travelTimeMethod = 'MANUAL';
            console.log(`  ✅ Manual: Bus at ${bus.arrivalTime.toLocaleTimeString()} → Dest at ${destArrival.toLocaleTimeString()}`);
        });
        
        return buses;
    }
    
    if (!destinationStopId) return buses;
    
    try {
        console.log(`🔍 Matching for route ${route}, destination stop ${destinationStopId}:`);
        
        // 1. Fetch LIVE predictions for destination stop
        const destPredictions = await getPredictionsForStop(destinationStopId, route);
        const filteredDest = destPredictions.filter(pred => 
            String(pred.rt).toLowerCase() === String(route).toLowerCase()
        );
        
        // 2. Fetch SCHEDULE for destination stop (fallback)
        const destSchedule = await getScheduleForStop(destinationStopId, route);
        const filteredSchedule = destSchedule.filter(item => 
            String(item.route).toLowerCase() === String(route).toLowerCase()
        );
        
        console.log(`  Origin buses: ${buses.length}`);
        console.log(`  Destination predictions: ${filteredDest.length}`);
        console.log(`  Destination schedule: ${filteredSchedule.length}`);
        
        // Match each bus
        let liveMatched = 0, scheduleMatched = 0, noMatch = 0;
        
        buses.forEach((bus, idx) => {
            console.log(`  Bus ${idx}: vid=${bus.vehicleId}, tripId=${bus.tripId}, scheduled=${bus.scheduledTime.toLocaleTimeString()}`);
            
            // TRY 1: Match with live predictions by vehicle/trip ID
            const liveMatch = filteredDest.find(destPred => {
                if (bus.vehicleId && destPred.vid && bus.vehicleId === destPred.vid) return true;
                if (bus.tripId && destPred.tatripid && bus.tripId === destPred.tatripid) return true;
                return false;
            });
            
            if (liveMatch) {
                liveMatched++;
                console.log(`    ✅ LIVE MATCH (vid: ${bus.vehicleId})`);
                const year = liveMatch.prdtm.substring(0, 4);
                const month = liveMatch.prdtm.substring(4, 6);
                const day = liveMatch.prdtm.substring(6, 8);
                const time = liveMatch.prdtm.substring(9);
                bus.destinationArrivalTime = new Date(`${year}-${month}-${day}T${time}`);
                bus.finalArrivalTime = new Date(bus.destinationArrivalTime.getTime() + bus.walkTimeToDestination * 60000);
                console.log(`      Arrival: ${bus.finalArrivalTime.toLocaleTimeString()}`);
                return;
            }
            
            // TRY 2: Match with schedule by comparing arrival times (within 2 min tolerance)
            const scheduleMatch = filteredSchedule.find(sched => {
                const timeDiff = Math.abs(sched.arrivalTime - bus.scheduledTime) / 60000; // minutes
                return timeDiff <= 2; // Within 2 minutes of scheduled time
            });
            
            if (scheduleMatch) {
                scheduleMatched++;
                console.log(`    ⏰ SCHEDULE MATCH (time diff: ${Math.abs(scheduleMatch.arrivalTime - bus.scheduledTime) / 60000} min)`);
                bus.destinationArrivalTime = scheduleMatch.arrivalTime;
                bus.finalArrivalTime = new Date(bus.destinationArrivalTime.getTime() + bus.walkTimeToDestination * 60000);
                console.log(`      Arrival: ${bus.finalArrivalTime.toLocaleTimeString()}`);
                return;
            }
            
            // TRY 3: No match found
            noMatch++;
            console.log(`    ❌ NO MATCH - Available dest vids: ${filteredDest.map(d => d.vid).join(', ')}`);
            console.log(`      Tried ${filteredSchedule.length} scheduled items`);
        });
        
        console.log(`  📊 Results: ${liveMatched} live, ${scheduleMatched} schedule, ${noMatch} no match`);
    } catch (error) {
        console.error('Error fetching destination predictions:', error);
    }
    
    return buses;
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
                        .then(async predictions => {
                            console.log(`Got ${predictions.length} predictions for stop ${stop.stopId}`);
                            let buses = processPredictions(predictions, stop);
                            
                            // If this stop has a destination configured, fetch and match destination predictions
                            if (stop.destinationStopId) {
                                console.log(`  Fetching destination predictions for stop ${stop.destinationStopId}`);
                                buses = await matchDestinationPredictions(buses, stop.destinationStopId, stop.route);
                            }
                            
                            return buses;
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
        
        // Sort by arrival at destination time (or bus arrival time if no destination)
        allBuses.sort((a, b) => {
            const aArrival = a.finalArrivalTime || a.arrivalTime;
            const bArrival = b.finalArrivalTime || b.arrivalTime;
            return aArrival - bArrival;
        });
        
        // Cache the bus data for time updates
        busDataCache[sectionKey] = allBuses;
        
        // Render
        if (allBuses.length === 0) {
            console.log('No buses to display');
            container.innerHTML = '<div class="no-buses">No buses in the next 45 minutes</div>';
        } else {
            console.log('Rendering', allBuses.length, 'buses (sorted by arrival at destination)');
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
    
    // Determine labels based on section
    const leaveLabel = section === 'toWork' ? 'Leave home at' : 'Leave work at';
    const destinationLabel = section === 'toWork' ? 'Arrive work' : 'Arrive home';
    const originLabel = section === 'toWork' ? 'home' : 'work';
    const destinationIcon = section === 'toWork' ? '🏢' : '🏠';
    
    const arrivalTimeStr = bus.arrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const leaveTimeStr = bus.leaveHomeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const scheduledTimeStr = bus.scheduledTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    
    // Calculate schedule variance
    const scheduleVarianceMinutes = Math.round((bus.arrivalTime - bus.scheduledTime) / 60000);
    let statusBadge = '';
    let statusText = '';
    
    if (bus.isRealtime) {
        if (Math.abs(scheduleVarianceMinutes) <= 2) {
            // On time - no badge in condensed view
            statusText = '(on time)';
        } else if (scheduleVarianceMinutes > 2) {
            statusBadge = `<span class="status-badge status-late">${scheduleVarianceMinutes} Min Late</span>`;
            statusText = `(${scheduleVarianceMinutes} min late)`;
        } else if (scheduleVarianceMinutes < -2) {
            statusBadge = `<span class="status-badge status-early">${Math.abs(scheduleVarianceMinutes)} Min Early</span>`;
            statusText = `(${Math.abs(scheduleVarianceMinutes)} min early)`;
        }
    } else {
        statusBadge = '<span class="status-badge status-scheduled">Scheduled</span>';
        statusText = '(scheduled)';
    }
    
    // Shortened stop name for display
    const stopNameShort = bus.stopName.replace(' Avenue', ' Av').replace(' Street', ' St').replace(' & ', ' & ');
    
    // Check if destination is configured
    const hasDestination = bus.destinationStopId && bus.destinationStopName && bus.walkTimeToDestination;
    
    // Google Maps link
    const mapsUrl = `https://www.google.com/maps?q=${bus.stopLat},${bus.stopLon}`;
    
    let cardHTML = `
        <div class="bus-main-info">
            <div>
                <div class="bus-route">${bus.route}</div>
                <a href="${mapsUrl}" target="_blank" class="minimal-stop stop-link">${stopNameShort}</a>
            </div>
            <div class="bus-time" data-time-display="minutes">
                <div class="time-value">${bus.minutesUntilArrival}</div>
                <div class="time-label">min</div>
            </div>
        </div>
        <div class="bus-details">`;
    
    if (hasDestination) {
        // For destination stops, show journey timeline
        // Use actual destination arrival time if available, otherwise estimate
        let destinationArrivalStr;
        let isEstimated = false;
        
        if (bus.finalArrivalTime) {
            // We have real data!
            destinationArrivalStr = bus.finalArrivalTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        } else {
            // No data available - matching failed
            destinationArrivalStr = 'No Data';
            isEstimated = true;
        }
        
        // Calculate total journey time
        let finalArrival;
        if (bus.finalArrivalTime) {
            finalArrival = bus.finalArrivalTime;
        } else {
            // Fallback estimate if destination matching failed
            const estimatedBusRideMinutes = 15;
            finalArrival = new Date(bus.arrivalTime.getTime() + estimatedBusRideMinutes * 60000 + bus.walkTimeToDestination * 60000);
        }
        const totalJourneyMinutes = Math.round((finalArrival - bus.leaveHomeTime) / 60000);
        
        cardHTML += `
            <div class="journey-row">
                <div class="journey-condensed">
                    <span>Board bus at</span>
                    <span class="journey-time">${arrivalTimeStr}</span>
                    ${statusBadge}
                    ${bus.minutesUntilLeave < 0 ? '<span class="urgent-badge" data-go-now>GO NOW!</span>' : ''}
                </div>
            </div>
            <div class="journey-row journey-row-with-chevron">
                <div class="journey-compact">
                    <span class="journey-time-compact" data-leave-time>${leaveTimeStr.replace(' ', '')}</span>
                    <span class="journey-arrow-compact">→</span>
                    <span class="journey-time-compact ${isEstimated ? 'no-data' : ''}" data-destination-time>${destinationArrivalStr.replace(' ', '')}</span>
                    ${isEstimated ? '' : `<span class="journey-duration">(${totalJourneyMinutes} min)</span>`}
                </div>
                <span class="expand-chevron">›</span>
            </div>
            <div class="journey-expanded">
                <div class="timeline-horizontal">
                    <div class="timeline-step">
                        <div class="timeline-icon">🏠</div>
                        <div class="timeline-time timeline-time-subtle">${leaveTimeStr}</div>
                        <div class="timeline-label">Leave ${section === 'toWork' ? 'home' : 'work'}</div>
                    </div>
                    <div class="timeline-arrow">→</div>
                    <div class="timeline-step">
                        <div class="timeline-icon">🚶</div>
                        <div class="timeline-time timeline-time-subtle">${bus.walkTime} min</div>
                        <div class="timeline-label">Walk</div>
                    </div>
                    <div class="timeline-arrow">→</div>
                    <div class="timeline-step">
                        <div class="timeline-icon">🚌</div>
                        <div class="timeline-time timeline-time-bold">${arrivalTimeStr}</div>
                        <div class="timeline-label">Bus departs</div>
                    </div>
                    <div class="timeline-arrow">→</div>
                    <div class="timeline-step">
                        <div class="timeline-icon">🚶</div>
                        <div class="timeline-time timeline-time-subtle">${bus.walkTimeToDestination} min</div>
                        <div class="timeline-label">Walk</div>
                    </div>
                    <div class="timeline-arrow">→</div>
                    <div class="timeline-step">
                        <div class="timeline-icon">${destinationIcon}</div>
                        <div class="timeline-time timeline-time-subtle">${destinationArrivalStr}</div>
                        <div class="timeline-label">Arrive ${section === 'toWork' ? 'work' : 'home'}</div>
                    </div>
                </div>
                <div class="expanded-status scheduled-row">
                    <span class="detail-label">Scheduled:</span>
                    <span class="detail-value">${scheduledTimeStr}</span>
                </div>
            </div>`;
    } else {
        // No destination configured
        cardHTML += `
            <div class="journey-row">
                <div class="journey-condensed">
                    <span>Arrives</span>
                    <span class="journey-time">${arrivalTimeStr}</span>
                    ${statusBadge}
                    ${bus.minutesUntilLeave < 0 ? '<span class="urgent-badge" data-go-now>GO NOW!</span>' : ''}
                </div>
            </div>
            <div class="journey-row journey-row-with-chevron">
                <div class="journey-condensed">
                    <span>${leaveLabel}</span>
                    <span class="journey-time" data-leave-time>${leaveTimeStr}</span>
                </div>
                <span class="expand-chevron">›</span>
            </div>
            <div class="journey-expanded">
                <div class="expanded-status scheduled-row">
                    <span class="detail-label">Scheduled:</span>
                    <span class="detail-value">${scheduledTimeStr}</span>
                </div>
            </div>`;
    }
    
    cardHTML += `
        </div>
    `;

    card.innerHTML = cardHTML;
    
    // Add expand toggle to entire card
    const chevron = card.querySelector('.expand-chevron');
    const expandedSection = card.querySelector('.journey-expanded');
    
    // Make entire card clickable to expand/collapse
    card.addEventListener('click', (e) => {
        // Don't expand if clicking on a link
        if (e.target.tagName === 'A' || e.target.closest('a')) {
            return;
        }
        
        // Toggle expanded state
        if (expandedSection) {
            const isExpanded = expandedSection.classList.toggle('show');
            if (chevron) {
                chevron.classList.toggle('expanded', isExpanded);
            }
        }
    });
    
    // Hide GO NOW badge by default if not urgent
    const goNowBadge = card.querySelector('[data-go-now]');
    if (goNowBadge && bus.minutesUntilLeave >= 0) {
        goNowBadge.style.display = 'none';
    }

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
            
            config[section].splice(index, 1);
            updateURL();
            updateStopsList();
            loadAllBuses();
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

function loadDestinationStops() {
    const directionSelect = document.getElementById('direction-select');
    const destinationStopSelect = document.getElementById('destination-stop-select');
    
    if (!directionSelect.value) {
        destinationStopSelect.innerHTML = '<option value="">None - just show bus arrival</option>';
        destinationStopSelect.disabled = true;
        return;
    }
    
    const directionData = JSON.parse(directionSelect.value);
    
    destinationStopSelect.innerHTML = '<option value="">None - just show bus arrival</option>';
    directionData.Stops.forEach(stop => {
        const option = document.createElement('option');
        option.value = JSON.stringify(stop);
        option.textContent = `${stop.Name} (${stop.StopId})`;
        destinationStopSelect.appendChild(option);
    });
    
    destinationStopSelect.disabled = false;
}

function addStop(e) {
    e.preventDefault();
    
    const section = document.getElementById('section-select').value;
    const editIndex = document.getElementById('edit-index').value;
    const route = document.getElementById('route-input').value;
    const directionData = JSON.parse(document.getElementById('direction-select').value);
    const stopData = JSON.parse(document.getElementById('stop-select').value);
    const walkTime = parseInt(document.getElementById('walk-time-input').value);
    
    const destinationStopSelect = document.getElementById('destination-stop-select');
    const walkTimeDestInput = document.getElementById('walk-time-destination-input');
    const manualBusTravelTimeInput = document.getElementById('manual-bus-travel-time-input');
    
    const stopConfig = {
        route,
        direction: directionData.Direction,
        stopId: stopData.StopId,
        stopName: stopData.Name,
        walkTime,
        lat: stopData.Latitude,
        lon: stopData.Longitude,
        destinationStopId: null,
        destinationStopName: null,
        walkTimeToDestination: null,
        manualBusTravelTime: null
    };
    
    // Add destination info if provided
    if (destinationStopSelect.value && destinationStopSelect.value !== '') {
        const destData = JSON.parse(destinationStopSelect.value);
        stopConfig.destinationStopId = destData.StopId;
        stopConfig.destinationStopName = destData.Name;
        stopConfig.walkTimeToDestination = parseInt(walkTimeDestInput.value);
        
        // Add manual bus travel time if provided
        if (manualBusTravelTimeInput.value && manualBusTravelTimeInput.value !== '') {
            stopConfig.manualBusTravelTime = parseInt(manualBusTravelTimeInput.value);
        }
    }
    
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
        const settingsSection = document.querySelector('.settings-section');
        
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            btn.classList.add('active');
            
            // Smooth scroll to settings section
            setTimeout(() => {
                settingsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'
                });
            }, 100); // Small delay to ensure panel is rendered
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
    document.getElementById('direction-select').addEventListener('change', async () => {
        await loadStops();
        await loadDestinationStops();
    });
    
    // Destination stop select change
    document.getElementById('destination-stop-select').addEventListener('change', (e) => {
        const walkTimeDestInput = document.getElementById('walk-time-destination-input');
        const manualBusTravelTimeInput = document.getElementById('manual-bus-travel-time-input');
        if (e.target.value && e.target.value !== '') {
            walkTimeDestInput.disabled = false;
            manualBusTravelTimeInput.disabled = false;
        } else {
            walkTimeDestInput.disabled = true;
            manualBusTravelTimeInput.disabled = true;
            manualBusTravelTimeInput.value = '';
        }
    });
    
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
    
    // Name update button
    document.getElementById('update-name').addEventListener('click', () => {
        const nameInput = document.getElementById('user-name');
        const newName = nameInput.value.trim();
        if (newName) {
            userName = newName;
            updateBannerName();
            updateURL();
        }
    });
    
    // Allow Enter key to update name
    document.getElementById('user-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('update-name').click();
        }
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
    
    const destinationStopSelect = document.getElementById('destination-stop-select');
    const walkTimeDestInput = document.getElementById('walk-time-destination-input');
    const manualBusTravelTimeInput = document.getElementById('manual-bus-travel-time-input');
    destinationStopSelect.innerHTML = '<option value="">None - just show bus arrival</option>';
    destinationStopSelect.disabled = true;
    walkTimeDestInput.value = '5';
    walkTimeDestInput.disabled = true;
    manualBusTravelTimeInput.value = '';
    manualBusTravelTimeInput.disabled = true;
    
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
            
            // Load destination stops
            const destinationStopSelect = document.getElementById('destination-stop-select');
            destinationStopSelect.innerHTML = '<option value="">None - just show bus arrival</option>';
            selectedDirection.Stops.forEach(s => {
                const option = document.createElement('option');
                option.value = JSON.stringify(s);
                option.textContent = `${s.Name} (${s.StopId})`;
                if (stop.destinationStopId && s.StopId.toString() === stop.destinationStopId.toString()) {
                    option.selected = true;
                }
                destinationStopSelect.appendChild(option);
            });
            destinationStopSelect.disabled = false;
        }
        
            } catch (error) {
        console.error('Error loading routes for edit:', error);
        alert('Failed to load route data. Please try again.');
    }
    
    // Set walk time
    document.getElementById('walk-time-input').value = stop.walkTime;
    
    // Set destination walk time
    const walkTimeDestInput = document.getElementById('walk-time-destination-input');
    const manualBusTravelTimeInput = document.getElementById('manual-bus-travel-time-input');
    if (stop.destinationStopId && stop.destinationStopName && stop.walkTimeToDestination) {
        walkTimeDestInput.value = stop.walkTimeToDestination;
        walkTimeDestInput.disabled = false;
        manualBusTravelTimeInput.disabled = false;
        
        // Set manual bus travel time if it exists
        if (stop.manualBusTravelTime) {
            manualBusTravelTimeInput.value = stop.manualBusTravelTime;
        } else {
            manualBusTravelTimeInput.value = '';
        }
        } else {
        walkTimeDestInput.value = '5';
        walkTimeDestInput.disabled = true;
        manualBusTravelTimeInput.value = '';
        manualBusTravelTimeInput.disabled = true;
        }

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


