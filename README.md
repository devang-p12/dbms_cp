# FinVault Banking System

A full-stack banking management web application built with **React**, **Vite**, **Node.js**, **Express**, and **MySQL**.

## Project Structure
- `frontend/` - React frontend powered by Vite
- `backend/` - Node.js Express API
- `database/` - MySQL schema file for creating the database tables

---

## 🚀 Setup & Execution Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MySQL Server running locally
- Git (optional)

### 1. Database Setup
1. Open your MySQL client (e.g., MySQL Workbench or CLI).
2. Load and run the provided schema:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   *(This creates the `cp` database and all required tables)*

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Configure your Environment Variables:
   Open the `.env` file in the `backend/` folder and ensure your database credentials correctly match your local MySQL setup.
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=Devang@0305    # <-- Update this to your local MySQL password
   DB_NAME=cp
   JWT_SECRET=supersecret123
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *(Will start the API on `http://localhost:5000`)*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the required React dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(Will start the client on `http://localhost:5173`)*

---

### Default Roles & Access
Once both servers are running, access the web app at **[http://localhost:5173](http://localhost:5173)**. 

To login, you will typically use an administrative account inserted directly via MySQL, or you can register users through the API or DB directly to access the CUSTOMER, EMPLOYEE, or ADMIN modules.
