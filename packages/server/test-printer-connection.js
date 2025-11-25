/**
 * Printer Connection Diagnostic Tool
 * 
 * This script helps diagnose printer connection issues
 * Usage: node test-printer-connection.js <printer_id>
 */

const Printer = require('./models/Printer');
const PrinterService = require('./services/PrinterService');

const printerId = process.argv[2] || 1;

console.log('\n' + '='.repeat(60));
console.log('🔍 PRINTER CONNECTION DIAGNOSTIC');
console.log('='.repeat(60) + '\n');

console.log(`Testing Printer ID: ${printerId}\n`);

// Step 1: Check if printer exists in database
console.log('Step 1: Checking database...');
try {
  const printer = Printer.getById(printerId);
  
  if (!printer) {
    console.log('❌ ERROR: Printer not found in database!');
    console.log('\nAvailable printers:');
    const allPrinters = Printer.getAll();
    if (allPrinters.length === 0) {
      console.log('  No printers configured.');
    } else {
      allPrinters.forEach(p => {
        console.log(`  ID: ${p.id} - ${p.name} (${p.type}) - ${p.connection_string}`);
      });
    }
    process.exit(1);
  }
  
  console.log('✅ Printer found in database:');
  console.log(`   ID: ${printer.id}`);
  console.log(`   Name: ${printer.name}`);
  console.log(`   Type: ${printer.type}`);
  console.log(`   Connection: ${printer.connection_string}`);
  console.log('');
  
  // Step 2: Check printer type mapping
  console.log('Step 2: Checking printer type...');
  const printerType = PrinterService.getPrinterType(printer.type);
  if (printerType) {
    console.log(`✅ Printer type "${printer.type}" is supported`);
    console.log(`   Mapped to: ${printerType}`);
  } else {
    console.log(`❌ ERROR: Printer type "${printer.type}" not recognized!`);
    console.log('   Supported types: EPSON, STAR, TANCA, DARUMA, BROTHER');
    process.exit(1);
  }
  console.log('');
  
  // Step 3: Check connection string
  console.log('Step 3: Checking connection string...');
  if (!printer.connection_string) {
    console.log('❌ ERROR: No connection string configured!');
    console.log('   Please add a connection string like: tcp://192.168.1.100:9100');
    process.exit(1);
  }
  
  console.log(`✅ Connection string: ${printer.connection_string}`);
  
  // Parse connection string
  if (printer.connection_string.startsWith('tcp://')) {
    const parts = printer.connection_string.replace('tcp://', '').split(':');
    const ip = parts[0];
    const port = parts[1] || '9100';
    console.log(`   IP Address: ${ip}`);
    console.log(`   Port: ${port}`);
  } else if (printer.connection_string.includes('COM')) {
    console.log('   Type: Serial/USB (Windows)');
  } else if (printer.connection_string.includes('/dev/')) {
    console.log('   Type: Serial/USB (Linux)');
  }
  console.log('');
  
  // Step 4: Test printer instance creation
  console.log('Step 4: Creating printer instance...');
  try {
    const printerInstance = PrinterService.createPrinterInstance(printer);
    console.log('✅ Printer instance created successfully');
    console.log(`   Type: ${printerInstance.config.type}`);
    console.log(`   Interface: ${printerInstance.config.interface}`);
    console.log(`   Character Set: ${printerInstance.config.characterSet}`);
    console.log(`   Timeout: ${printerInstance.config.options.timeout}ms`);
  } catch (error) {
    console.log('❌ ERROR: Failed to create printer instance!');
    console.log(`   Error: ${error.message}`);
    process.exit(1);
  }
  console.log('');
  
  // Step 5: Attempt test print
  console.log('Step 5: Attempting test print...');
  console.log('⏳ Connecting to printer...');
  console.log('   (This may take up to 5 seconds)');
  console.log('');
  
  PrinterService.testPrinter(printerId)
    .then(result => {
      console.log('='.repeat(60));
      if (result.success) {
        console.log('✅ SUCCESS!');
        console.log('='.repeat(60));
        console.log('');
        console.log('Test print sent successfully!');
        console.log('Check your printer for the test page.');
        console.log('');
        console.log('The test page should show:');
        console.log('  - PRINTER TEST header');
        console.log('  - Printer name and type');
        console.log('  - Connection string');
        console.log('  - Current date/time');
        console.log('  - "Test Successful!" message');
        console.log('');
      } else {
        console.log('❌ TEST FAILED');
        console.log('='.repeat(60));
        console.log('');
        console.log(`Error: ${result.message}`);
        console.log('');
        console.log('Common causes:');
        console.log('  1. Printer is powered off');
        console.log('  2. Wrong IP address');
        console.log('  3. Printer not on same network');
        console.log('  4. Firewall blocking connection');
        console.log('  5. Wrong port (try 9100, 9101, or 9102)');
        console.log('');
        console.log('Troubleshooting steps:');
        console.log('  1. Check printer is ON');
        console.log('  2. Ping the printer:');
        console.log(`     ping ${printer.connection_string.replace('tcp://', '').split(':')[0]}`);
        console.log('  3. Try accessing printer web interface:');
        console.log(`     http://${printer.connection_string.replace('tcp://', '').split(':')[0]}`);
        console.log('  4. Check printer network settings');
        console.log('  5. Try different port in connection string');
        console.log('');
      }
      console.log('='.repeat(60));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.log('='.repeat(60));
      console.log('❌ UNEXPECTED ERROR');
      console.log('='.repeat(60));
      console.log('');
      console.log(`Error: ${error.message}`);
      console.log('');
      console.log('Stack trace:');
      console.log(error.stack);
      console.log('');
      console.log('='.repeat(60));
      process.exit(1);
    });
  
} catch (error) {
  console.log('❌ FATAL ERROR');
  console.log(`Error: ${error.message}`);
  console.log('');
  console.log('Stack trace:');
  console.log(error.stack);
  process.exit(1);
}
