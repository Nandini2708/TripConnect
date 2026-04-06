import mysql from "mysql2/promise";

// MySQL connection
const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "TRIPCONNECT4",
    database: "tripconnect_db",
});

console.log("MySQL Connected Successfully");