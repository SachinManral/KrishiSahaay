

# 🌾 KrishiSahay – Empowering Indian Agriculture with Technology

![KrishiSahay Logo](client/public/logo192.png)

**KrishiSahay** is an integrated digital platform designed to revolutionize agriculture for Indian farmers by providing real-time weather insights, AI-powered farming assistance, a digital marketplace, logistics and storage management, and a vibrant farming community — all in one place.

---

## 🚀 Overview

KrishiSahay empowers farmers with the tools and knowledge they need to increase crop yields, optimize post-harvest processes, and access fair market pricing. Built with modern web technologies, it bridges the gap between traditional farming and smart agriculture.

---

## 🌟 Features

### 🔍 Weather Monitoring

* Real-time weather updates and 5-day forecasts
* Weather-based tips and advisories
* Enhanced decision-making for crop planning

### 🤖 AI Assistant (Gemini-powered)

* Personalized crop recommendations
* 24/7 multilingual farming chatbot (Hindi & English)
* Context-aware answers tailored to season and region

### 🛒 Digital Marketplace

* List and manage crops for sale
* Real-time market pricing data
* Connect farmers directly with buyers — eliminate middlemen

### 🚛 Logistics Management

* Book transport services for produce
* Compare rates from multiple providers
* Track shipments from farm to market

### 🧊 Storage Solutions

* Discover and manage storage facilities (cold storage, warehouses, silos)
* View capacity, rates, and conditions
* Reduce post-harvest losses effectively

### 👨‍🌾 Community Platform

* Engage with other farmers across India
* Share insights, experiences, and success stories

---

## 🛠 Technology Stack

### 🔹 Frontend

* React.js
* React Router
* Axios
* i18next (for internationalization)
* React Toastify (notifications)

### 🔹 Backend

* Node.js + Express.js
* MongoDB + Mongoose
* JWT (authentication)
* Socket.io (real-time communication)
* Google Gemini API (AI assistant)

### 🔹 APIs

* OpenWeatherMap (weather data)
* Google/Facebook OAuth (planned)

---

## 📦 Installation & Setup

### ⚙️ Prerequisites

* Node.js (v14+)
* MongoDB (local or Atlas)
* npm or yarn

### 🔧 Setup Instructions

1. **Clone the repository**

   ```bash
   git clone https://github.com/SachinManral/KrishiSahaay.git
   cd krishisahay
   ```

2. **Install dependencies**

   ```bash
   npm run install-all
   ```

3. **Create `.env` in `/server` folder**

   Example:

   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   WEATHER_API_KEY=your_openweather_api_key
   GEMINI_API_KEY=your_google_ai_api_key
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

   This starts:

   * Frontend: [http://localhost:3000](http://localhost:3000)
   * Backend: [http://localhost:5002](http://localhost:5002)

---

## 📁 Project Structure

```
krishisahay/
├── client/                 # React frontend
│   ├── public/             # Static assets & locales
│   └── src/                # Source code
│       ├── assets/         # Images, icons
│       ├── components/     # Reusable UI components
│       ├── pages/          # Main pages
│       └── utils/          # Helper functions
└── server/                 # Node.js backend
    ├── config/             # DB & server configs
    ├── middleware/         # Auth & error handlers
    ├── models/             # Mongoose schemas
    ├── routes/             # Express routes
    ├── uploads/            # File uploads
    └── utils/              # Utility modules
```

---

## 🧑‍💻 Contributing

We welcome contributions from the community!

```bash
# Fork the repo and clone it
git checkout -b feature/your-feature-name
git commit -m "Add: New feature"
git push origin feature/your-feature-name
```

Open a pull request, and we’ll review it.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

* [OpenWeatherMap](https://openweathermap.org/api) – Weather Data
* [Google Generative AI (Gemini)](https://ai.google.dev/) – AI Assistant
* All the farmers who shared feedback to make this platform better

---

## 📬 Contact

**KrishiSahay Team**
📧 [Mail](mailto:krishisahaay@gmail.com)
🔗 [Project Link](https://github.com/SachinManral/KrishiSahaay)

---

Let me know if you’d like badges, usage GIFs, or markdown tables added!
