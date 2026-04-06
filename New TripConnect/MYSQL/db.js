import mysql from 'mysql2';

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'TRIPCONNECT4',
  database: 'tripconnect_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
  } else {
    console.log('✅ MySQL connected successfully');
  }
});

export default db;   // ✅ ES MODULE EXPORT