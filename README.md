# Budget Sensei

A simple budget tracking web application with persistent JSON file storage.

## Features

- **Dashboard**: View income, expenses, and net income with pie charts
- **Ledger**: Manage transactions with full CRUD operations
- **Data Management**: Manage categories and payment methods
- **Persistent Storage**: All data stored in `data.json` file

## Setup

1. Install Node.js (if not already installed)

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

- `server.js` - Express backend server with REST API
- `app.js` - Frontend JavaScript with API integration
- `index.html` - Main HTML file
- `styles.css` - Styling
- `data.json` - Persistent data storage (created automatically)
- `package.json` - Node.js dependencies

## API Endpoints

- `GET /api/data` - Get all data (transactions, categories, methods)
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Add new category
- `PUT /api/categories/:index` - Update category
- `DELETE /api/categories/:name` - Delete category
- `GET /api/methods` - Get all payment methods
- `POST /api/methods` - Add new payment method
- `PUT /api/methods/:index` - Update payment method
- `DELETE /api/methods/:name` - Delete payment method

## Data Storage

All data is stored in a SQLite database file (`budget.db`) in the project root. The database is automatically created with the proper schema and default values on first run.

### Database Schema

- **transactions**:** id, date, description, category, method, type, amount
- **categories**:** id, name (unique)
- **methods**:** id, name (unique)

SQLite is perfect for this application as it's:
- File-based (single file, easy to backup)
- Lightweight and fast
- No separate database server required
- Handles large datasets efficiently

## Development

The server runs on port 3000 by default. You can change this in `server.js`.
