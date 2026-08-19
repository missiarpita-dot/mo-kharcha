const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');
const tmpDbFile = path.join('/tmp', 'db.json');

function getDbFilePath() {
  if (process.env.VERCEL) {
    if (!fs.existsSync(tmpDbFile)) {
      try {
        if (fs.existsSync(dbFile)) {
          fs.copyFileSync(dbFile, tmpDbFile);
        } else {
          fs.writeFileSync(tmpDbFile, JSON.stringify({ months: [], expenses: [], payments: [] }, null, 2), 'utf-8');
        }
      } catch (e) {
        return dbFile;
      }
    }
    return tmpDbFile;
  }
  return dbFile;
}

function readDb() {
  try {
    const targetFile = getDbFilePath();
    const raw = fs.readFileSync(targetFile, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { months: [], expenses: [], payments: [] };
  }
}

function writeDb(data) {
  try {
    const targetFile = getDbFilePath();
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), 'utf-8');
    
    // Auto sync to Desktop Excel file
    if (!process.env.VERCEL) {
      setTimeout(() => {
        try {
          const { syncDesktopExcel } = require('./excelSync');
          syncDesktopExcel();
        } catch (err) {
          console.error('Desktop Excel Sync error:', err.message);
        }
      }, 100);
    }
  } catch (err) {
    console.error('Write DB error:', err.message);
  }
}

module.exports = {
  readDb,
  writeDb
};
