import { NextRequest, NextResponse } from 'next/server';
import { saveReport, generateReportId, trackAnalyticsEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, analysisData, overallScore, brandId } = body;

    if (!url || !analysisData || typeof overallScore !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate unique report ID
    const reportId = generateReportId();

    // Save report to database
    await saveReport({
      id: reportId,
      url,
      analysisData,
      overallScore,
      brandId
    });

    // Track report creation event
    await trackAnalyticsEvent({
      reportId,
      eventType: 'report_created',
      eventData: { url, overallScore },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Generate the base URL dynamically from the request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (host ? `${protocol}://${host}` : 'http://localhost:3000');

    return NextResponse.json({ 
      success: true, 
      reportId,
      shareUrl: `${baseUrl}/report/${reportId}`
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve report data or list all reports
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    // If reportId is provided, get single report
    if (reportId) {
      const { getReport } = await import('@/lib/database');
      const report = await getReport(reportId);

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, report });
    }

    // Otherwise, get all reports with pagination
    const { getAllReports, getReportsCount } = await import('@/lib/database');
    const [reports, totalCount] = await Promise.all([
      getAllReports(limit, offset),
      getReportsCount()
    ]);

    return NextResponse.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a report
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id');

  if (!reportId) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
  }

  try {
    const { deleteReport } = await import('@/lib/database');
    const deleted = await deleteReport(reportId);

    if (!deleted) {
      return NextResponse.json({ error: 'Report not found or could not be deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}