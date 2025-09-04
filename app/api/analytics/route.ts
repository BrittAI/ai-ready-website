import { NextRequest, NextResponse } from 'next/server';
import { trackAnalyticsEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, visitorId, leadId, eventType, eventData } = body;

    if (!reportId || !eventType) {
      return NextResponse.json({ error: 'Report ID and event type are required' }, { status: 400 });
    }

    // Valid event types
    const validEvents = [
      'report_view',
      'section_view', 
      'recommendation_click',
      'code_copy',
      'pdf_download',
      'time_spent',
      'scroll_depth'
    ];

    if (!validEvents.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Track the event
    await trackAnalyticsEvent({
      reportId,
      visitorId,
      leadId,
      eventType,
      eventData,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking analytics:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

// GET endpoint for analytics dashboard (future feature)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('reportId');
  const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d

  if (!reportId) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
  }

  try {
    const { getDatabase } = await import('@/lib/database');
    const db = await getDatabase();

    // Calculate date range
    const now = new Date();
    const daysBack = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get analytics summary
    const [views, leads, events] = await Promise.all([
      // Total views
      db.get(`
        SELECT COUNT(*) as count 
        FROM analytics 
        WHERE report_id = ? AND event_type = 'report_view' AND timestamp >= ?
      `, [reportId, startDate.toISOString()]),

      // Total leads captured
      db.get(`
        SELECT COUNT(*) as count 
        FROM analytics 
        WHERE report_id = ? AND event_type = 'lead_captured' AND timestamp >= ?
      `, [reportId, startDate.toISOString()]),

      // Event breakdown
      db.all(`
        SELECT event_type, COUNT(*) as count
        FROM analytics 
        WHERE report_id = ? AND timestamp >= ?
        GROUP BY event_type
        ORDER BY count DESC
      `, [reportId, startDate.toISOString()])
    ]);

    return NextResponse.json({
      success: true,
      analytics: {
        timeframe,
        totalViews: views.count,
        totalLeads: leads.count,
        eventBreakdown: events,
        conversionRate: views.count > 0 ? ((leads.count / views.count) * 100).toFixed(2) : '0.00'
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}