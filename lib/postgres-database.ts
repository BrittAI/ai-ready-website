import { Client, Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Create a connection pool for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database tables
export async function initializePostgresTables() {
  const client = await pool.connect();
  
  try {
    // Create branding table first (referenced by reports)
    await client.query(`
      CREATE TABLE IF NOT EXISTS branding (
        id VARCHAR(255) PRIMARY KEY,
        company_name VARCHAR(255),
        logo_url TEXT,
        primary_color VARCHAR(7) DEFAULT '#ff4d00',
        secondary_color VARCHAR(7) DEFAULT '#ff6b1a',
        accent_color VARCHAR(7) DEFAULT '#ff8533',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(255) PRIMARY KEY,
        url TEXT NOT NULL,
        analysis_data JSONB NOT NULL,
        overall_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        brand_id VARCHAR(255),
        FOREIGN KEY (brand_id) REFERENCES branding(id)
      )
    `);

    // Create leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        company VARCHAR(255),
        captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
      )
    `);

    // Create analytics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics (
        id SERIAL PRIMARY KEY,
        report_id VARCHAR(255) NOT NULL,
        visitor_id VARCHAR(255),
        lead_id INTEGER,
        event_type VARCHAR(255) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_url ON reports(url);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
      CREATE INDEX IF NOT EXISTS idx_leads_report_id ON leads(report_id);
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_analytics_report_id ON analytics(report_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
    `);

    console.log('PostgreSQL tables initialized successfully');
  } finally {
    client.release();
  }
}

// Helper function to generate random report IDs
export function generateReportId(): string {
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
  const client = await pool.connect();
  
  try {
    await client.query(`
      INSERT INTO reports (id, url, analysis_data, overall_score, brand_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        url = $2,
        analysis_data = $3,
        overall_score = $4,
        brand_id = $5,
        updated_at = CURRENT_TIMESTAMP
    `, [
      reportData.id,
      reportData.url,
      JSON.stringify(reportData.analysisData),
      reportData.overallScore,
      reportData.brandId || null
    ]);
  } finally {
    client.release();
  }
}

export async function getReport(id: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT r.*, b.company_name, b.logo_url, b.primary_color, b.secondary_color, b.accent_color
      FROM reports r
      LEFT JOIN branding b ON r.brand_id = b.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length > 0) {
      const report = result.rows[0];
      return {
        ...report,
        analysis_data: report.analysis_data,
      };
    }
    return null;
  } finally {
    client.release();
  }
}

export async function getAllReports(limit = 50, offset = 0) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT r.id, r.url, r.overall_score, r.created_at, 
             b.company_name, b.logo_url, b.primary_color
      FROM reports r
      LEFT JOIN branding b ON r.brand_id = b.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return result.rows;
  } finally {
    client.release();
  }
}

export async function getReportsCount() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT COUNT(*) as count FROM reports
    `);
    
    return parseInt(result.rows[0]?.count || '0');
  } finally {
    client.release();
  }
}

export async function deleteReport(id: string) {
  const client = await pool.connect();
  
  try {
    // PostgreSQL will handle cascading deletes for analytics and leads
    const result = await client.query(`
      DELETE FROM reports WHERE id = $1
    `, [id]);
    
    return (result.rowCount ?? 0) > 0;
  } finally {
    client.release();
  }
}

// Lead capture functions
export async function saveLeadCapture(leadData: {
  reportId: string;
  email: string;
  name?: string;
  company?: string;
}) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      INSERT INTO leads (report_id, email, name, company)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [leadData.reportId, leadData.email, leadData.name || null, leadData.company || null]);

    return result.rows[0].id;
  } finally {
    client.release();
  }
}

export async function getLeadByEmailAndReport(email: string, reportId: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT * FROM leads
      WHERE email = $1 AND report_id = $2
    `, [email, reportId]);
    
    return result.rows[0] || null;
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  
  try {
    await client.query(`
      INSERT INTO analytics (report_id, visitor_id, lead_id, event_type, event_data, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      eventData.reportId,
      eventData.visitorId || null,
      eventData.leadId || null,
      eventData.eventType,
      eventData.eventData ? JSON.stringify(eventData.eventData) : null,
      eventData.ipAddress || null,
      eventData.userAgent || null
    ]);
  } finally {
    client.release();
  }
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
  const client = await pool.connect();
  
  try {
    await client.query(`
      INSERT INTO branding (id, company_name, logo_url, primary_color, secondary_color, accent_color, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        company_name = $2,
        logo_url = $3,
        primary_color = $4,
        secondary_color = $5,
        accent_color = $6,
        updated_at = CURRENT_TIMESTAMP
    `, [
      brandData.id,
      brandData.companyName || null,
      brandData.logoUrl || null,
      brandData.primaryColor || '#ff4d00',
      brandData.secondaryColor || '#ff6b1a',
      brandData.accentColor || '#ff8533'
    ]);
  } finally {
    client.release();
  }
}

export async function getBranding(id: string) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT * FROM branding WHERE id = $1
    `, [id]);
    
    return result.rows[0] || null;
  } finally {
    client.release();
  }
}

// Export pool for direct access if needed
export { pool };

// Initialize tables on module load
if (process.env.DATABASE_URL) {
  initializePostgresTables().catch(console.error);
}