# EV Charging Station Finder & Slot Booking

A web application for finding EV charging stations, planning routes, and booking charging slots.

## Project Structure

The project is organized into the following folders and files:

```
📦 ev_stations
 ┣ 📂 css/               # Stylesheets
 ┃ ┗ 📜 styles.css      # Main stylesheet
 ┣ 📂 js/                # JavaScript files
 ┃ ┣ 📜 calculateLongDistanceEVRoute.js
 ┃ ┣ 📜 chargingAvailability.js
 ┃ ┣ 📜 ev_model.js
 ┃ ┣ 📜 ev_routing.js
 ┃ ┗ 📜 ev_search.js
 ┣ 📂 images/            # Images organized by category
 ┃ ┣ 📂 backgrounds/     # Background images
 ┃ ┣ 📂 icons/           # Icons
 ┃ ┗ 📂 ui/              # UI elements
 ┣ 📂 pages/             # Page components
 ┃ ┗ 📜 payment.html     # Payment components (was book_slot.html)
 ┣ 📜 book_slot.html     # Slot booking page
 ┣ 📜 ev_routing.html    # Routing page
 ┣ 📜 ev_search.html     # Station search page
 ┣ 📜 index.html         # Homepage
 ┣ 📜 login.html         # Login page
 ┣ 📜 Register.html      # Registration page
 ┗ 📜 README.md          # This file
```

## Recent Reorganization

The project was recently reorganized to improve code structure and maintainability:

1. **Folder Structure**:
   - Created a `/css` folder for all stylesheet files
   - Created a `/js` folder for all JavaScript files
   - Organized image files into `/images` with subdirectories by category

2. **File Paths**:
   - Updated all HTML files to reference the new file paths
   - Ensured consistent CSS references using `href="css/styles.css"`
   - Updated JavaScript references to point to the `/js` directory

3. **Documentation**:
   - Added this README.md file to document the project structure and features
   - Included descriptions of all major files and their purposes

## Features

- **Station Search**: Find nearby EV charging stations
- **Route Planning**: Get directions to charging stations with optimal routes
- **Slot Booking**: Book charging slots at stations
- **User Authentication**: Register and login to manage bookings

## Dependencies

- **TomTom Maps SDK**: For maps, directions, and location services
- **Bootstrap**: For responsive styling (loaded via CDN)
- **Font Awesome**: For icons (loaded via CDN)
- **Flatpickr**: For date/time selection

## Setup and Usage

1. Clone the repository
2. No build process is required as this is a static HTML site
3. Open `index.html` in a browser to start

## File Description

### HTML Files
- `index.html`: Landing page with information about the service
- `login.html`: User login page
- `Register.html`: User registration page
- `ev_search.html`: Search for nearby EV charging stations
- `ev_routing.html`: Get directions to charging stations
- `book_slot.html`: Book a charging slot at a station

### JavaScript Files
- `ev_search.js`: Handles searching for charging stations using TomTom API
- `ev_routing.js`: Handles routing to charging stations
- `ev_model.js`: Contains data models for EV vehicles
- `chargingAvailability.js`: Handles checking availability at charging stations
- `calculateLongDistanceEVRoute.js`: Calculates routes for long-distance EV travel

## Project Status

✅ **Completed Tasks:**
- Reorganized folder structure for better organization
- Moved all CSS files to `/css` directory
- Moved all JavaScript files to `/js` directory
- Organized images into categories in `/images` directory
- Updated all file paths in HTML files
- Created comprehensive documentation

🔄 **Potential Future Improvements:**
- Consolidate duplicate CSS code from inline styles to shared stylesheet
- Modularize JavaScript functions for better code reuse
- Implement responsive design improvements for mobile devices
- Add unit tests for critical functions
- Implement proper form validation with error feedback
- Enhance accessibility compliance

## Recent Changes

### CSS and JavaScript Extraction

The project has been reorganized to follow best practices by separating concerns:

1. **Extracted Internal CSS**:
   - Moved all internal CSS from HTML files to external CSS files in the `/css/pages/` directory
   - Created page-specific CSS files to maintain organization and reusability

2. **Extracted JavaScript**:
   - Moved all internal JavaScript from HTML files to external JS files in the `/js/pages/` directory
   - Created page-specific JavaScript files to improve maintainability

3. **Improved File Organization**:
   - Organized images into subcategories (icons, backgrounds, ui)
   - Created a clear folder structure for better code management
   - Renamed pages/book_slot.html to pages/payment.html for clarity

### Benefits of This Reorganization

- **Improved Performance**: External CSS and JS files can be cached by browsers
- **Better Maintainability**: Easier to update styles and functionality without modifying HTML
- **Code Reuse**: Shared styles and functions can be used across multiple pages
- **Separation of Concerns**: HTML for structure, CSS for presentation, JS for behavior
- **Reduced Duplication**: Common styles and functionality consolidated

## Technologies Used

- HTML5, CSS3, JavaScript
- TomTom Maps API for location services
- Font Awesome for icons
- Google Fonts (Poppins)
- Flatpickr for date/time selection

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser to view the homepage
3. Navigate through the application to find and book charging stations
