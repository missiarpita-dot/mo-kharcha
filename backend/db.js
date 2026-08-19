const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'db.json');

function initDb() {
  if (!fs.existsSync(dbFile)) {
    const initialData = {
      months: [],
      expenses: [],
      payments: []
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

initDb();

function readDb() {
  try {
    const raw = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { months: [], expenses: [], payments: [] };
  }
}

function writeDb(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readDb,
  writeDb
};
