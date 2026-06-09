const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function init() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await conn.query(schema);

  const db = process.env.DB_NAME || 'cafe_pos_system';
  await conn.query(`USE ${db}`);

  const [users] = await conn.query('SELECT COUNT(*) as c FROM users');
  if (users[0].c === 0) {
    const hash = await bcrypt.hash('password123', 10);
    await conn.query(
      `INSERT INTO users (name, email, password, role) VALUES
       ('Admin Manager', 'manager@cafe.com', ?, 'manager'),
       ('John Cashier', 'cashier@cafe.com', ?, 'cashier')`,
      [hash, hash]
    );
  }

  const [items] = await conn.query('SELECT COUNT(*) as c FROM menu_items');
  if (items[0].c === 0) {
    await conn.query(`
      INSERT INTO menu_items (name, price, category, description, available) VALUES
      ('Latte', 5.00, 'Coffee', 'Espresso with steamed milk', TRUE),
      ('Cappuccino', 5.00, 'Coffee', 'Espresso with foamed milk', TRUE),
      ('Americano', 4.00, 'Coffee', 'Espresso with hot water', TRUE),
      ('Green Tea', 3.50, 'Tea', 'Fresh brewed green tea', TRUE),
      ('Chai Latte', 4.50, 'Tea', 'Spiced tea with milk', TRUE),
      ('Burger', 12.00, 'Main Course', 'Beef burger with fries', TRUE),
      ('Pasta', 11.00, 'Main Course', 'Creamy pasta', TRUE),
      ('Sandwich', 8.00, 'Main Course', 'Club sandwich', TRUE),
      ('Cheesecake', 6.00, 'Desserts', 'New York style cheesecake', TRUE),
      ('Croissant', 3.50, 'Desserts', 'Buttery croissant', TRUE),
      ('Fries', 4.00, 'Main Course', 'Crispy golden fries', TRUE),
      ('Coke', 2.50, 'Beverages', 'Chilled cola', TRUE),
      ('Orange Juice', 3.00, 'Beverages', 'Fresh orange juice', TRUE),
      ('Water', 1.50, 'Beverages', 'Bottled water', TRUE)
    `);
  }

  const [tables] = await conn.query('SELECT COUNT(*) as c FROM tables');
  if (tables[0].c === 0) {
    await conn.query(`
      INSERT INTO tables (table_number, status) VALUES
      ('T1', 'available'), ('T2', 'available'), ('T3', 'available'),
      ('T4', 'available'), ('T5', 'available'), ('T6', 'available'),
      ('T7', 'available'), ('T8', 'available'), ('T9', 'available'), ('T10', 'available')
    `);
  }

  console.log('Database initialized successfully!');
  console.log('Demo accounts:');
  console.log('  Manager: manager@cafe.com / password123');
  console.log('  Cashier: cashier@cafe.com / password123');
  await conn.end();
}

init().catch((err) => {
  console.error('Init failed:', err.message);
  process.exit(1);
});
