# 🚌 Sophie's Buses

**Live App:** [https://talrme.github.io/sophies-buses/](https://talrme.github.io/sophies-buses/)

A beautiful, real-time transit tracker for AC Transit in the San Francisco Bay Area. Never miss your bus again with smart departure time calculations and live predictions.

![Sophie's Buses Banner](sophies_buses_title.png)

## ✨ Features

### 🎯 Smart Time Calculations
- **Automatic "Leave Home/Work At" times** - Shows exactly when you need to leave based on your walk time
- **45-minute window** - Only shows buses arriving in the next 45 minutes (with 5-min grace period)
- **GO NOW! alerts** - Flashing badge when it's time to leave immediately
- **Color-coded urgency** - Orange for "soon", red for "urgent"

### 🔴 Real-Time Data
- **Live bus predictions** from AC Transit API
- **Glowing green dot** indicates real-time tracking (vs scheduled)
- **Minute-by-minute countdown** updates without page refresh
- **Smart section ordering** - "To Work" on top in the morning, "To Home" after noon

### ⚙️ Fully Customizable
- **Add/edit/remove stops** for any AC Transit route
- **Custom walk times** for each stop (3-11 minutes)
- **URL sharing** - Configuration saved in URL for easy sharing
- **Time tester** - Preview schedule at different times of day

### 🎨 Beautiful Design
- Custom illustrated banner with buses and clouds
- Responsive layout works on any device
- Smooth animations and hover effects
- Clean, modern interface

## 🚀 How It Works

1. **Configure Your Stops**
   - Click "Settings" at the bottom
   - Add stops for "To Work" and "To Home"
   - Set your walk time for each stop

2. **View Live Predictions**
   - See all buses arriving in the next 45 minutes
   - Check the "Leave home/work at" time
   - Click the "GO NOW!" badge when it appears
   - Stop names link directly to Google Maps

3. **Share Your Configuration**
   - Your stops are saved in the URL
   - Copy and share the link with others
   - Works across devices

## 🛠️ Technical Details

### API Integration
- **AC Transit Real-Time API** for live bus predictions
- **Schedule API** for time-testing and fallback data
- **Routes API** for dynamic route/stop selection
- Includes route filtering to ensure only requested buses are shown

### Architecture
- Pure vanilla JavaScript (no frameworks)
- Client-side only (no backend needed)
- Efficient API caching to reduce requests
- Real-time countdown updates every minute

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

### Change Walk Times
1. Click "Settings" at the bottom
2. Click the pencil icon (✏️) next to any stop
3. Update the walk time
4. Click "Update Stop"

### Add New Routes
1. Click "Settings"
2. Click "+ Add Stop" under "To Work" or "To Home"
3. Select your route, direction, and stop
4. Set your walk time
5. Click "Add Stop"

### Modify Default Stops
Edit the `config.toWork` and `config.toHome` arrays in `script.js` (lines 74-95).

## 🐛 Known Issues

- Auto-refresh is disabled to prevent visual glitches (countdown still updates every minute)
- API sometimes returns extra routes at shared stops (filtered in code)

## 📄 License

MIT License - Feel free to use and modify for your own transit needs!

## 🙏 Credits

- Built with ❤️ for Sophie
- Transit data from [AC Transit](https://www.actransit.org/)
- Map powered by [Leaflet](https://leafletjs.com/) and [OpenStreetMap](https://www.openstreetmap.org/)

---

**Live App:** [https://talrme.github.io/sophies-buses/](https://talrme.github.io/sophies-buses/)

