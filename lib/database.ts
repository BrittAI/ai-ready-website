import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import * as pgDb from './postgres-database';

// Check if we should use PostgreSQL or SQLite
const USE_POSTGRES = !!process.env.DATABASE_URL;

let db: Database | null = null;

async function getSQLiteDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  db = await open({
    filename: path.join(process.cwd(), 'data', 'reports.db'),
    driver: sqlite3.Database
  });

  // Initialize tables
  await initializeTables();
  return db;
}

async function initializeTables() {
  if (!db) return;

  // Reports table - stores analysis results and metadata
  await db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      analysis_data TEXT NOT NULL, -- JSON string of full analysis
      overall_score INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      brand_id TEXT, -- Links to branding configuration
      FOREIGN KEY (brand_id) REFERENCES branding (id)
    )
  `);

  // Branding table - stores white-label configurations
  await db.exec(`
    CREATE TABLE IF NOT EXISTS branding (
      id TEXT PRIMARY KEY,
      company_name TEXT,
      logo_url TEXT,
      primary_color TEXT DEFAULT '#ff4d00', -- Heat color default
      secondary_color TEXT DEFAULT '#ff6b1a',
      accent_color TEXT DEFAULT '#ff8533',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Leads table - captures contact info before report access
  await db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      company TEXT,
      captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports (id)
    )
  `);

  // Analytics table - tracks report engagement
  await db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT NOT NULL,
      visitor_id TEXT, -- Anonymous visitor tracking
      lead_id INTEGER, -- If lead captured
      event_type TEXT NOT NULL, -- 'view', 'section_view', 'pdf_download', etc.
      event_data TEXT, -- JSON for additional data
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      FOREIGN KEY (report_id) REFERENCES reports (id),
      FOREIGN KEY (lead_id) REFERENCES leads (id)
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reports_url ON reports(url);
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_report_id ON leads(report_id);
    CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
    CREATE INDEX IF NOT EXISTS idx_analytics_report_id ON analytics(report_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
  `);

  console.log('Database tables initialized successfully');
}

// Helper function to generate random report IDs
export function generateReportId(): string {
  if (USE_POSTGRES) {
    return pgDb.generateReportId();
  }
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Report management functions
export async function saveReport(reportData: {
  id: string;
  url: string;
  analysisData: any;
  overallScore: number;
  brandId?: string;
}) {
  if (USE_POSTGRES) {
    return pgDb.saveReport(reportData);
  }
  const db = await getSQLiteDatabase();
  
  await db.run(`
    INSERT OR REPLACE INTO reports (id, url, analysis_data, overall_score, brand_id, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    reportData.id,
    reportData.url,
    JSON.stringify(reportData.analysisData),
    reportData.overallScore,
    reportData.brandId || null
  ]);
}

export async function getReport(id: string) {
  if (USE_POSTGRES) {
    return pgDb.getReport(id);
  }
  const db = await getSQLiteDatabase();
  
  const report = await db.get(`
    SELECT r.*, b.company_name, b.logo_url, b.primary_color, b.secondary_color, b.accent_color
    FROM reports r
    LEFT JOIN branding b ON r.brand_id = b.id
    WHERE r.id = ?
  `, [id]);

  if (report) {
    return {
      ...report,
      analysis_data: JSON.parse(report.analysis_data),
    };
  }
  return null;
}

export async function getAllReports(limit = 50, offset = 0) {
  if (USE_POSTGRES) {
    return pgDb.getAllReports(limit, offset);
  }
  const db = await getSQLiteDatabase();
  
  const reports = await db.all(`
    SELECT r.id, r.url, r.overall_score, r.created_at, 
           b.company_name, b.logo_url, b.primary_color
    FROM reports r
    LEFT JOIN branding b ON r.brand_id = b.id
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `, [limit, offset]);

  return reports;
}

export async function getReportsCount() {
  if (USE_POSTGRES) {
    return pgDb.getReportsCount();
  }
  const db = await getSQLiteDatabase();
  
  const result = await db.get(`
    SELECT COUNT(*) as count FROM reports
  `);
  
  return result?.count || 0;
}

export async function deleteReport(id: string) {
  if (USE_POSTGRES) {
    return pgDb.deleteReport(id);
  }
  const db = await getSQLiteDatabase();
  
  // Delete associated analytics and leads first (foreign key constraints)
  await db.run(`DELETE FROM analytics WHERE report_id = ?`, [id]);
  await db.run(`DELETE FROM leads WHERE report_id = ?`, [id]);
  
  // Then delete the report
  const result = await db.run(`DELETE FROM reports WHERE id = ?`, [id]);
  
  return result.changes > 0;
}

// Lead capture functions
export async function saveLeadCapture(leadData: {
  reportId: string;
  email: string;
  name?: string;
  company?: string;
}) {
  if (USE_POSTGRES) {
    return pgDb.saveLeadCapture(leadData);
  }
  const db = await getSQLiteDatabase();
  
  const result = await db.run(`
    INSERT INTO leads (report_id, email, name, company)
    VALUES (?, ?, ?, ?)
  `, [leadData.reportId, leadData.email, leadData.name || null, leadData.company || null]);

  return result.lastID;
}

export async function getLeadByEmailAndReport(email: string, reportId: string) {
  if (USE_POSTGRES) {
    return pgDb.getLeadByEmailAndReport(email, reportId);
  }
  const db = await getSQLiteDatabase();
  
  return await db.get(`
    SELECT * FROM leads
    WHERE email = ? AND report_id = ?
  `, [email, reportId]);
}

// Analytics functions
export async function trackAnalyticsEvent(eventData: {
  reportId: string;
  visitorId?: string;
  leadId?: number;
  eventType: string;
  eventData?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  if (USE_POSTGRES) {
    return pgDb.trackAnalyticsEvent(eventData);
  }
  const db = await getSQLiteDatabase();
  
  await db.run(`
    INSERT INTO analytics (report_id, visitor_id, lead_id, event_type, event_data, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    eventData.reportId,
    eventData.visitorId || null,
    eventData.leadId || null,
    eventData.eventType,
    eventData.eventData ? JSON.stringify(eventData.eventData) : null,
    eventData.ipAddress || null,
    eventData.userAgent || null
  ]);
}

// Branding functions
export async function saveBranding(brandData: {
  id: string;
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}) {
  if (USE_POSTGRES) {
    return pgDb.saveBranding(brandData);
  }
  const db = await getSQLiteDatabase();
  
  await db.run(`
    INSERT OR REPLACE INTO branding (id, company_name, logo_url, primary_color, secondary_color, accent_color, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [
    brandData.id,
    brandData.companyName || null,
    brandData.logoUrl || null,
    brandData.primaryColor || '#ff4d00',
    brandData.secondaryColor || '#ff6b1a',
    brandData.accentColor || '#ff8533'
  ]);
}

export async function getBranding(id: string) {
  if (USE_POSTGRES) {
    return pgDb.getBranding(id);
  }
  const db = await getSQLiteDatabase();
  
  return await db.get(`
    SELECT * FROM branding WHERE id = ?
  `, [id]);
}