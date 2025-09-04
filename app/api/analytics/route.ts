import { NextRequest, NextResponse } from 'next/server';
import { trackAnalyticsEvent } from '@/lib/database';

// POST endpoint to track analytics events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, visitorId, eventType, eventData } = body;

    if (!reportId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Track the event using our database abstraction
    await trackAnalyticsEvent({
      reportId,
      visitorId,
      eventType,
      eventData,
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined
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

// GET endpoint to retrieve analytics (simplified for Railway deployment)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('reportId');
  const timeframe = searchParams.get('timeframe') || '7d';

  if (!reportId) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
  }

  try {
    // Return mock analytics data for Railway deployment
    // TODO: Implement full analytics with proper database queries

    const daysBack = timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7;

    return NextResponse.json({
      success: true,
      analytics: {
        timeframe,
        period: `${daysBack} days`,
        summary: {
          totalViews: Math.floor(Math.random() * 100) + 10,
          totalLeads: Math.floor(Math.random() * 20) + 2,
          conversionRate: '12.5'
        },
        events: [
          { event_type: 'report_view', count: 45 },
          { event_type: 'section_view', count: 32 },
          { event_type: 'pdf_download', count: 18 },
          { event_type: 'lead_captured', count: 8 }
        ],
        reportId
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