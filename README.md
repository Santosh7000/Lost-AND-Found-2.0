Reconnect - Lost & Found Platform
Reconnect is a high-performance, responsive web application designed to help communities reunite lost items with their owners. Built with a focus on speed and accessibility, the platform runs smoothly on low-end devices and provides a modern, "lively" administration interface for community moderators.

🚀 Key Features
User Experience
Instant Matching Algorithm: Automatically compares descriptions and keywords of lost items against the "Found" database to find potential matches.

Camera Integration: Mobile users can capture and upload photos of found items directly through the browser.

Authentication System: A lightweight registration and login system that persists user data locally.

Single Page Architecture (SPA): Navigation is handled via JavaScript, ensuring zero page reloads and instant transitions.

Admin Dashboard (Lively UI)
3-Column Layout: A modern management interface featuring a sidebar, a scrollable item feed, and a detailed inspection panel.

Real-time Filtering: Admins can filter items by status (Lost/Found/All) to manage the database efficiently.

Content Moderation: Tools to delete posts or ban users directly from the details panel.

Data Overview: Live counters tracking total users, lost reports, and found items.

🛠️ Tech Stack
Frontend: HTML5 (Semantic), CSS3 (Flexbox & Grid).

Logic: Vanilla JavaScript (ES6+).

Storage: Browser localStorage (No backend required for testing).

Optimization: Hardware-accelerated CSS animations and IntersectionObserver for scroll effects.

📂 File Structure
Plaintext

reconnect-app/
├── index.html   # Main structure and SPA views
├── style.css    # Responsive design and Admin UI styling
└── script.js    # Logic, Auth, and Matching algorithm
⚙️ Installation & Usage
Clone the repository or download the three source files.

Open index.html in any modern web browser (Chrome, Firefox, Edge, or Safari).

To Access the Admin Dashboard:

Email: satoshi.maharjan700@gmail.com

Password: admin123

📝 Usage Guide
Reporting a Lost Item: Fill out the form in the dashboard. The system will immediately notify you if a matching item exists in the current database.

Reporting a Found Item: Upload a photo and provide a contact number. Your item will appear in the public feed for others to search.

Admin Tasks: Select any item from the feed to view its full details and contact information in the right-hand panel.

📱 Optimization for Low-End Devices
The application is strictly built without heavy frameworks like React or Angular. By using native browser APIs and modular Vanilla JavaScript, it ensures minimal RAM usage and fast loading times even on older mobile hardware.
