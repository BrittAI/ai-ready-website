import { NextRequest, NextResponse } from 'next/server';
import { getReport } from '@/lib/database';
import jsPDF from 'jspdf';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id');

  if (!reportId) {
    return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
  }

  try {
    // Get report data
    const report = await getReport(reportId);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Create PDF
    const pdf = new jsPDF();
    
    // Set up document properties
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let currentY = margin;
    
    // Helper function to add text with word wrap
    const addText = (text: string, fontSize = 12, fontWeight: 'normal' | 'bold' = 'normal') => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontWeight);
      
      const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
      
      // Check if we need a new page
      if (currentY + lines.length * lineHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
      
      pdf.text(lines, margin, currentY);
      currentY += lines.length * lineHeight + 5;
    };

    // Add title
    addText(`AI Readiness Report for ${report.url}`, 20, 'bold');
    currentY += 10;

    // Add overall score
    addText(`Overall AI Readiness Score: ${report.overall_score}%`, 16, 'bold');
    
    // Add score interpretation
    const scoreInterpretation = report.overall_score >= 80 
      ? 'Excellent! Your website is highly optimized for AI systems and training.'
      : report.overall_score >= 60
      ? 'Good foundation with room for improvement in key areas.'
      : 'Significant opportunities to enhance AI compatibility and discoverability.';
    
    addText(scoreInterpretation, 12);
    currentY += 10;

    // Add detailed metrics
    addText('Detailed Analysis:', 16, 'bold');
    
    if (report.analysis_data?.checks) {
      report.analysis_data.checks.forEach((check: any) => {
        if (check.label && check.score !== undefined) {
          // Add metric header
          addText(`${check.label}: ${check.score}%`, 14, 'bold');
          
          // Add status
          if (check.status) {
            const statusText = check.status === 'pass' ? '✓ Pass' : 
                              check.status === 'warning' ? '⚠ Warning' : '✗ Needs Improvement';
            addText(statusText, 12);
          }
          
          // Add details
          if (check.details) {
            addText(check.details, 11);
          }
          
          // Add recommendation
          if (check.recommendation) {
            addText(`Recommendation: ${check.recommendation}`, 11, 'bold');
          }
          
          // Add action items
          if (check.actionItems && check.actionItems.length > 0) {
            addText('Action Items:', 11, 'bold');
            check.actionItems.forEach((item: string) => {
              addText(`• ${item}`, 10);
            });
          }
          
          currentY += 10;
        }
      });
    }

    // Add footer
    currentY = pageHeight - 30;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on ${new Date().toLocaleDateString()} | Report ID: ${report.id}`, margin, currentY);
    pdf.text('Powered by AI Readiness Analyzer', margin, currentY + 10);

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ai-readiness-report-${reportId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}