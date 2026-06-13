# GitHub Bundler Backend

A fast, lightweight, and robust API backend built with **FastAPI** to fetch repository structures and files from GitHub, bundle selected files into an AI-ready text representation, and compare old bundles to find what changed.

---

## 📂 Project Structure

Below is the directory structure of the repository:

```text
github-bundler/
├── backend/                       # Backend service directory
│   ├── app/                       # Main application package
│   │   ├── services/              # Core business logic / service layers
│   │   │   ├── __init__.py
│   │   │   ├── bundle_service.py  # Logic for generating text bundles
│   │   │   ├── diff_service.py    # Logic for comparing old and new bundles
│   │   │   ├── github_service.py  # Communicates with GitHub API (octokit-like)
│   │   │   └── tree_builder.py    # Builds file tree visual representations
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI app initialization and CORS middleware
│   │   ├── routes.py              # API endpoint routes and handlers
│   │   └── schemas.py             # Pydantic request/response validation schemas
│   ├── requirements.txt           # Python dependency specifications
│   └── venv/                      # Python virtual environment (if created)
├── data.txt                       # Configuration / payload sample file
└── README.md                      # Project documentation (this file)
```

---

## ⚙️ Getting Started

### 1. Prerequisites
Make sure you have **Python 3.8+** installed on your system.

### 2. Navigate to the Backend Directory
Open your terminal or command prompt, and navigate into the `backend/` folder:
```bash
cd backend
```

### 3. Setup Virtual Environment (`venv`)
Create a virtual environment to keep the project dependencies isolated:

#### **On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

#### **On Windows (Command Prompt - CMD):**
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

#### **On Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

---

## 📥 Installing Dependencies

Once the virtual environment is activated, install all required packages listed in `requirements.txt`:
```bash
pip install -r requirements.txt
```

---

## 🚀 Running the Server (`uvicorn`)

Start the FastAPI development server with automatic reloading enabled:

cd github-bundler/backend
# Windows: 
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000


- **`app.main:app`**: Points to the `app` variable inside `app/main.py`.
- **`--reload`**: Automatically restarts the server when any code changes are detected.

By default, the server will start at:
* **API Server:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Interactive Documentation (Swagger UI):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Alternative Documentation (ReDoc):** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🔌 API Endpoints Summary

Here is a summary of the available API routes registered under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Root endpoint displaying application metadata. |
| **GET** | `/api/health` | Health-check endpoint for checking server status. |
| **POST** | `/api/repo/load` | Validates GitHub URL and retrieves repository tree structure. |
| **POST** | `/api/bundle/generate` | Generates a combined markdown/text bundle of the specified files. |
| **POST** | `/api/bundle/compare` | Compares a previously uploaded bundle file with current repo files. |
