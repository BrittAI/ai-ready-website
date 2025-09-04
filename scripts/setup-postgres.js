#!/usr/bin/env node

/**
 * Setup script for PostgreSQL database
 * Run this after provisioning a PostgreSQL database on Railway
 * 
 * Usage: node scripts/setup-postgres.js
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL found. Using SQLite for local development.');
    return;
  }

  console.log('Setting up PostgreSQL database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Import and run initialization
    const { initializePostgresTables } = require('../lib/postgres-database');
    await initializePostgresTables();
    
    console.log('✅ PostgreSQL database setup completed successfully');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();