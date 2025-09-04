import { NextRequest, NextResponse } from 'next/server';
import { saveLeadCapture, getLeadByEmailAndReport, trackAnalyticsEvent } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, email, name, company } = body;

    if (!reportId || !email) {
      return NextResponse.json({ error: 'Report ID and email are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if lead already exists for this report
    const existingLead = await getLeadByEmailAndReport(email, reportId);
    
    let leadId;
    if (existingLead) {
      leadId = existingLead.id;
    } else {
      // Save new lead
      leadId = await saveLeadCapture({
        reportId,
        email,
        name,
        company
      });

      // Track lead capture event
      await trackAnalyticsEvent({
        reportId,
        leadId: leadId as number,
        eventType: 'lead_captured',
        eventData: { email, name, company },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    }

    return NextResponse.json({ 
      success: true, 
      leadId,
      message: existingLead ? 'Welcome back!' : 'Thank you for your interest!'
    });

  } catch (error) {
    console.error('Error capturing lead:', error);
    return NextResponse.json(
      { error: 'Failed to capture lead information' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if lead exists (for returning visitors)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const reportId = searchParams.get('reportId');

  if (!email || !reportId) {
    return NextResponse.json({ error: 'Email and report ID required' }, { status: 400 });
  }

  try {
    const lead = await getLeadByEmailAndReport(email, reportId);
    
    return NextResponse.json({ 
      exists: !!lead,
      lead: lead ? { id: lead.id, name: lead.name, company: lead.company } : null
    });

  } catch (error) {
    console.error('Error checking lead:', error);
    return NextResponse.json(
      { error: 'Failed to check lead status' },
      { status: 500 }
    );
  }
}