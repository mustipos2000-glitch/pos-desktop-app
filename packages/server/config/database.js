// Database configuration placeholder
// Add your database connection logic here

module.exports = {
  // Example configuration
  development: {
    host: 'localhost',
    port: 5432,
    database: 'pos_dev'
  },
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
  }
};
