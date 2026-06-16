# 📊 BigQuery Release Notes Hub

[![Python](https://img.shields.io/badge/python-3.14+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/flask-3.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

A premium, interactive web dashboard built with **Python Flask** and **vanilla HTML/JS/CSS** that fetches, parses, and styles the Google Cloud BigQuery release notes Atom feed. The application allows users to view, search, filter, and compose tweets for sharing specific updates.

---

## ✨ Features

- **🔄 Automatic XML Feed Fetching**: Retrieves real-time release logs directly from the official Google Cloud BigQuery release notes XML feed.
- **⚡ Granular Content Segmentation**: Converts consolidated daily feed entry lists into individual cards (e.g., separating *Features*, *Issues*, and *Breaking Changes* on the same day) for easier reading and selection.
- **🔍 Live Search & Filter**: Instant client-side search indexing and category filters (Features, Issues, Changes, Announcements, Breaking).
- **🎨 Modern Slate Dark Theme**: Premium glassmorphic styling utilizing CSS variables, responsive grids, custom scrollbars, and smooth micro-interactions.
- **🐦 Interactive Tweet Composer Modal**:
  - Select any update (or group multiple updates) to compile a tweet.
  - Character counter with a 280-character limit warning.
  - Live layout preview resembling the X (Twitter) interface.
  - Integrates Twitter Web Intent for secure browser-based posting.
  - Quick "Copy Text" button for clipboard sharing.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14, Flask, `requests`, XML Parsing (`xml.etree.ElementTree`)
- **Frontend**: Vanilla HTML5, CSS3 (Custom Variables, Backdrop Filters, Flex/Grid layouts), JavaScript (DOMParser API, dynamic event listening)
- **Icons**: Custom SVG icons integrated directly into the HTML markup.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Python installed. The launcher `py` or command `python` should be available in your shell.

### 1. Clone the repository
```bash
git clone https://github.com/April-nnma/event-talks-app.git
cd event-talks-app
```

### 2. Install dependencies
Install the required packages using `pip`:
```bash
py -m pip install -r requirements.txt
```

### 3. Start the Flask application
Run the backend web server:
```bash
py app.py
```

The server will initialize on:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📂 Project Structure

```text
├── static/
│   ├── css/
│   │   └── style.css      # Premium layout styles, responsive design, and keyframes
│   └── js/
│       └── main.js        # Logic for feed parsing, searching, selection, and tweets
├── templates/
│   └── index.html         # Application layout and modal dialog overlays
├── app.py                 # Flask server, route configurations, and BigQuery XML client
├── requirements.txt       # Project python dependencies
└── README.md              # Project documentation
```

---

## 🐦 How Tweeting Works

The application provides a zero-setup sharing mechanism using **Twitter Web Intent**:
1. When selecting one or more release notes, a floating tray appears asking to **Draft Tweet**.
2. A modal overlays with an automatically formatted message pre-populated with:
   - Category tags and date headers.
   - Summarized/truncated text matching the character constraints.
   - The direct link to the corresponding Google Cloud documentation anchor.
3. Clicking **Tweet on X** redirects to `https://twitter.com/intent/tweet?text={encoded_text}` which opens the user's browser-configured compose window safely without demanding any third-party developer API keys.
