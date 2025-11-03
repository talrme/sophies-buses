# 🚌 Sophie's Buses

**Live App:** [https://talrme.github.io/sophies-buses/](https://talrme.github.io/sophies-buses/)

A beautiful, real-time transit tracker for AC Transit in the San Francisco Bay Area. Never miss your bus again with smart departure time calculations and live predictions.

![Sophie's Buses Banner](sophies_buses_title.png)

## ✨ Features

### 🎯 Smart Time Calculations
- **Complete journey planning** - See your entire trip from door to door
- **Automatic "Leave Home/Work At" times** - Shows exactly when you need to leave based on your walk time
- **Final arrival time** - Know when you'll actually arrive at your destination
- **Sorted by arrival** - Buses ordered by when you arrive at destination (not departure time)
- **45-minute window** - Only shows buses arriving in the next 45 minutes
- **GO NOW! alerts** - Flashing badge when it's time to leave immediately

### 🔴 Real-Time Data
- **Live bus predictions** from AC Transit API
- **Manual bus travel times** - Option to use fixed travel times instead of API predictions
- **Status badges** - See if buses are on-time, early, or late
- **Minute-by-minute countdown** updates without page refresh
- **Smart section ordering** - "To Work" on top in the morning, "To Home" after noon

### ⚙️ Fully Customizable
- **Journey endpoints** - Configure origin stop, destination stop, and walk times for both
- **Manual travel time override** - Set fixed bus ride durations when you know them best
- **Add/edit/remove stops** - Support for any AC Transit route
- **Custom walk times** - Set different walk times for each stop
- **URL sharing** - Configuration saved in URL for easy bookmarking/sharing
- **Time tester** - Preview schedule at different times of day
- **Personalize banner** - Change the name displayed on the page

### 🎨 Beautiful Design
- Custom illustrated banner with buses and clouds
- Responsive layout works on any device
- Smooth animations and hover effects
- Clean, modern interface

## 🚀 How It Works

1. **Configure Your Stops**
   - Click "Settings" at the bottom
   - Add stops for "To Work" and "To Home"
   - Set your walk time from home/work to the bus stop
   - Optionally add a destination stop and walk time to your final destination
   - **Pro tip:** Add manual bus travel time for accurate predictions without API dependency

2. **View Complete Journey Timeline**
   - See all buses arriving in the next 45 minutes
   - Buses are sorted by when you arrive at your final destination (fastest first)
   - Expandable cards show full journey: Leave → Walk → Board Bus → Arrive Destination
   - Check the "Leave home/work at" time to know when to depart
   - Stop names link directly to Google Maps

3. **Manual Travel Time vs API**
   - **With Manual Time**: Fast, consistent, no API calls needed
   - **Without Manual Time**: Uses AC Transit API to match origin/destination predictions
   - **Fallback**: If API matching fails, shows "No Data"
   - **Recommendation**: Use manual times for your regular commute routes

4. **Share Your Configuration**
   - Your stops and times are saved in the URL
   - Copy and share the link with others
   - Works across devices - bookmark on your phone!

## 🛠️ Technical Details

### API Integration
- **AC Transit Real-Time API** for live bus predictions
- **Schedule API** for time-testing and fallback data
- **Routes API** for dynamic route/stop selection
- **Smart destination matching** - Matches buses by vehicle ID and trip ID
- **Manual travel time override** - Bypasses API when user provides fixed durations
- Route filtering to ensure only requested buses are shown

### Travel Time Priority Logic
1. **Manual Travel Time** (highest priority) - User-provided fixed duration, skips API calls
2. **Live API Match** - Real-time prediction matched by vehicle/trip ID
3. **Schedule API Match** - Scheduled time matched within 2-minute tolerance
4. **No Match** - Shows "No Data" when API matching fails

### Architecture
- Pure vanilla JavaScript (no frameworks)
- Client-side only (no backend needed)
- Efficient API caching to reduce requests
- Real-time countdown updates every minute
- URL-based configuration (no server-side storage needed)

### Default Configuration

**To Work** (from North Oakland to Downtown Oakland):
- Route 18 - Shattuck & 59th (6 min walk)
- Route 6 - Telegraph & 59th (11 min walk)
- Route 88 - Market & 59th (10 min walk)
- Route 12 - MLK Jr Way & 59th (3 min walk)
- Route 22 - Stanford & Market (9 min walk)

**To Home** (from Downtown Oakland to North Oakland):
- Route 6 - 10th & Washington (3 min walk)
- Route 18 - 12th & Franklin (6 min walk)
- Route 88 - 12th & Broadway BART (6 min walk)
- Route 22 - 12th & Broadway BART (6 min walk)
- Route 12 - Broadway & 7th (4 min walk)

## 📦 Installation

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/talrme/sophies-buses.git
   cd sophies-buses
   ```

2. **Start a local server**
   ```bash
   # Python 3
   python3 -m http.server 8080
   
   # Or Python 2
   python -m SimpleHTTPServer 8080
   
   # Or use any other local server
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

### Deploy to GitHub Pages

The app is automatically deployed from the `main` branch to GitHub Pages. Any push to `main` will update the live site.

## 🗺️ Bonus: Map View

Check out `map-test.html` for a proof-of-concept real-time bus map showing all buses on your routes with their GPS locations!

## 📝 Files

- `index.html` - Main application
- `script.js` - All JavaScript logic (API calls, UI rendering, state management)
- `styles.css` - Styling and responsive design
- `sophies_buses_title.png` - Custom banner image
- `map-test.html` - Proof of concept map with real-time bus locations
- `api-test.html` - API testing utility

## 🔑 API Key

The app uses the AC Transit Developer API. The API key is included in the code for demo purposes. For production use, consider:
- Getting your own API key from [AC Transit Developer Portal](https://api.actransit.org/)
- Implementing rate limiting
- Using environment variables for the key

## 🎨 Customization

### Add Complete Journey Endpoints
1. Click "Settings" at the bottom
2. Click "+ Add Stop" under "To Work" or "To Home"
3. Select your route, direction, and origin stop
4. Set your walk time to the bus stop
5. **Optional:** Select a destination stop on the same route
6. **Optional:** Set walk time from destination stop to final destination
7. **Optional:** Enter manual bus travel time (in minutes) for consistent results
8. Click "Add Stop"

### Edit Existing Routes
1. Click "Settings" at the bottom
2. Click the pencil icon (✏️) next to any stop
3. Update walk times, destination stops, or manual travel time
4. Click "Update Stop"

### When to Use Manual Travel Time
- **Use it**: For regular commutes where you know typical travel time
- **Benefits**: Faster, more consistent, doesn't rely on API matching
- **Skip it**: For occasional trips or when you want live traffic-aware predictions

### Modify Default Stops
Edit the `config.toWork` and `config.toHome` arrays in `script.js` (lines 74-95).

## 🐛 Known Issues

- Auto-refresh is disabled to prevent visual glitches (countdown still updates every minute)
- API sometimes returns extra routes at shared stops (filtered in code)
- Destination matching via API can occasionally fail (use manual travel time as workaround)

## 📄 License

MIT License - Feel free to use and modify for your own transit needs!

## 🙏 Credits

- Built with ❤️ for Sophie
- Transit data from [AC Transit](https://www.actransit.org/)
- Map powered by [Leaflet](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/)

---

**Live App:** [https://talrme.github.io/sophies-buses/](https://talrme.github.io/sophies-buses/)


