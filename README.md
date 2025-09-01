
# Frontend Comunidad

## Overview

**Frontend Comunidad** is a modern Single Page Application (SPA) for a developer community, designed to foster collaboration, learning, and networking. Users can register, create profiles, post content, chat in real time, receive notifications, and manage their settings—all within a visually appealing and responsive interface.

---

## Features

- **User Authentication:** Secure login and registration with role selection.
- **Profile Management:** Create and edit user profiles, upload photos, and add personal descriptions.
- **Posts:** Share knowledge, code snippets, images, and files. Posts support privacy settings (Public, Friends, Only Me).
- **Real-Time Chat:** Instant messaging between users using Socket.io.
- **Notifications:** Receive real-time alerts for new messages, posts, and interactions.
- **Responsive Design:** Optimized for desktop and mobile devices.
- **Modern UI:** Custom styles, icons, and interactive components.

---

## Folder Structure

```
frontend_comunidad-11/
│
├── index.html
├── package.json
├── README.md
├── public/
│   └── assets/img/
├── src/
│   ├── components/
│   ├── images/
│   ├── pages/
│   ├── scripts/
│   ├── services/
│   ├── styles/
│   └── utils/
└── ...
```

- **components/**: Reusable UI elements (navbar, sidebar).
- **images/**: Profile and badge images.
- **pages/**: HTML views for each route (login, register, home, profile, etc.).
- **scripts/**: Main JS logic, controllers, sockets, and utilities.
- **services/**: API communication (auth, profile, posts, notifications).
- **styles/**: Global and page-specific CSS.
- **utils/**: Auxiliary functions.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Installation

1. **Clone the repository:**
	```
	git clone https://github.com/Deko25/frontend_comunidad.git
	cd frontend_comunidad/frontend_comunidad
	```

2. **Install dependencies:**
	```
	npm install
	```

3. **Start the development server:**
	```
	npm run dev
	```
	The app will be available at `http://localhost:5173` (or the port shown in the terminal).

4. **Backend requirements:**
	- The frontend expects a backend running at `http://localhost:3000` with REST API endpoints for authentication, profiles, posts, notifications, and chat (Socket.io).

---

## Usage

- **Login/Register:** Access the app and create your account.
- **Profile Setup:** Complete your profile with a photo and description.
- **Home:** View and create posts, interact with other users.
- **Chats:** Send and receive real-time messages.
- **Notifications:** Stay updated with alerts and friend activity.
- **Settings:** Edit your profile, change password, manage notifications.

---

## Technologies Used

- **HTML, CSS, JavaScript (ES6 Modules)**
- **Vite** (build tool)
- **Axios** (HTTP requests)
- **Socket.io** (real-time chat & notifications)
- **SweetAlert2** (UI alerts)
- **Font Awesome** (icons)

---

## Team Credits

-- Karlos Cajibioy Velasquez
- Zamir Esteban Estrada Corredor
- Jefferson Molina Soto
- Tomas David Restrepo Osorio
- Mateo Castañeda

---

## License

This project is for educational and community purposes.
