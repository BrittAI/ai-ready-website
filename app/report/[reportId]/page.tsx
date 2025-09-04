"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye,
  Clock,
  TrendingUp
} from 'lucide-react';
import LeadCaptureModal from '@/components/report/LeadCaptureModal';
import ReportMetrics from '@/components/report/ReportMetrics';
import ReportHeader from '@/components/report/ReportHeader';

interface ReportData {
  id: string;
  url: string;
  analysis_data: any;
  overall_score: number;
  created_at: string;
  company_name?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
}

export default function ShareableReportPage() {
  const { reportId } = useParams();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeadCapture, setShowLeadCapture] = useState(true);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [visitorId] = useState(() => {
    // Generate anonymous visitor ID for analytics
    return 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  });

  useEffect(() => {
    if (!reportId) return;

    fetchReport();
    
    // Track report view
    trackEvent('report_view');
    
    // Track time spent on page
    const startTime = Date.now();
    const trackTimeSpent = () => {
      const timeSpent = Date.now() - startTime;
      trackEvent('time_spent', { duration_ms: timeSpent });
    };
    
    window.addEventListener('beforeunload', trackTimeSpent);
    return () => window.removeEventListener('beforeunload', trackTimeSpent);
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports?id=${reportId}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.report);
        
        // Check if lead capture is needed (stored in localStorage for now)
        const capturedLeads = JSON.parse(localStorage.getItem('capturedLeads') || '[]');
        if (capturedLeads.includes(reportId)) {
          setShowLeadCapture(false);
          setLeadCaptured(true);
        }
      } else {
        setError(data.error || 'Report not found');
      }
    } catch (err) {
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, eventData?: any) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          visitorId,
          eventType,
          eventData
        })
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const handleLeadCaptured = (leadId: number) => {
    setLeadCaptured(true);
    setShowLeadCapture(false);
    
    // Store in localStorage to avoid showing modal again
    const capturedLeads = JSON.parse(localStorage.getItem('capturedLeads') || '[]');
    capturedLeads.push(reportId);
    localStorage.setItem('capturedLeads', JSON.stringify(capturedLeads));
    
    trackEvent('lead_captured', { leadId });
  };

  const handleDownloadPDF = async () => {
    trackEvent('pdf_download');
    
    try {
      // Show loading state
      const downloadButton = document.querySelector('[data-download-pdf]') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = true;
        downloadButton.textContent = 'Generating PDF...';
      }

      // Fetch PDF from API
      const response = await fetch(`/api/pdf?id=${reportId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-readiness-report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Reset button state
      const downloadButton = document.querySelector('[data-download-pdf]') as HTMLButtonElement;
      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.textContent = 'Download PDF Report';
      }
    }
  };

  const handleSectionView = (sectionId: string) => {
    trackEvent('section_view', { sectionId });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-heat-100 border-t-transparent rounded-full animate-spin mx-auto mb-16"></div>
          <p className="text-body-large text-accent-black">Loading your AI readiness report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-center max-w-md">
          <XCircle className="w-24 h-24 text-heat-100 mx-auto mb-16" />
          <h1 className="text-title-h3 text-accent-black mb-8">Report Not Found</h1>
          <p className="text-body-large text-black-alpha-64 mb-24">
            {error || 'This report may have been removed or the link is incorrect.'}
          </p>
          <a 
            href="/"
            className="inline-flex items-center gap-8 px-20 py-12 bg-heat-100 hover:bg-heat-150 text-white rounded-8 transition-all"
          >
            Analyze Your Website
          </a>
        </div>
      </div>
    );
  }

  // Apply custom branding if available
  const brandColors = report.primary_color ? {
    '--brand-primary': report.primary_color,
    '--brand-secondary': report.secondary_color || report.primary_color,
    '--brand-accent': report.accent_color || report.primary_color,
  } as React.CSSProperties : {};

  return (
    <div className="min-h-screen bg-background-base" style={brandColors}>
      {/* Lead Capture Modal */}
      <AnimatePresence>
        {showLeadCapture && !leadCaptured && (
          <LeadCaptureModal
            reportId={reportId as string}
            onLeadCaptured={handleLeadCaptured}
            onSkip={() => {
              setShowLeadCapture(false);
              trackEvent('lead_capture_skipped');
            }}
            brandColors={brandColors}
          />
        )}
      </AnimatePresence>

      {/* Report Content */}
      <div className="container mx-auto px-20 py-40 max-w-5xl">
        {/* Header */}
        <ReportHeader 
          report={report}
          onDownloadPDF={handleDownloadPDF}
          onSectionView={handleSectionView}
        />

        {/* Main Content */}
        <div className="space-y-40">
          {/* Overall Score Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            onViewportEnter={() => handleSectionView('overall-score')}
          >
            <div className="inline-flex items-center justify-center w-120 h-120 rounded-full bg-gradient-to-br from-heat-4 to-heat-20 mb-20">
              <div className="text-title-h1 font-bold text-heat-100">
                {report.overall_score}%
              </div>
            </div>
            
            <h2 className="text-title-h3 text-accent-black mb-12">
              AI Readiness Score
            </h2>
            
            <p className="text-body-large text-black-alpha-64 max-w-2xl mx-auto">
              {report.overall_score >= 80 
                ? 'Excellent! Your website is highly optimized for AI systems and training.'
                : report.overall_score >= 60
                ? 'Good foundation with room for improvement in key areas.'
                : 'Significant opportunities to enhance AI compatibility and discoverability.'
              }
            </p>
          </motion.section>

          {/* Metrics Section */}
          <ReportMetrics 
            analysisData={report.analysis_data}
            onSectionView={handleSectionView}
            onCodeCopy={() => trackEvent('code_copy')}
            onRecommendationClick={(metricId: string) => trackEvent('recommendation_click', { metricId })}
          />

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center pt-40 border-t border-black-alpha-8"
          >
            {report.company_name ? (
              <div className="flex items-center justify-center gap-12 mb-16">
                {report.logo_url && (
                  <img src={report.logo_url} alt={report.company_name} className="h-24" />
                )}
                <span className="text-label-large text-accent-black">
                  Report by {report.company_name}
                </span>
              </div>
            ) : (
              <p className="text-label-medium text-black-alpha-48 mb-16">
                Powered by AI Readiness Analyzer
              </p>
            )}
            
            <div className="flex items-center justify-center gap-24 text-label-small text-black-alpha-32">
              <div className="flex items-center gap-6">
                <Clock className="w-12 h-12" />
                Generated {new Date(report.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-6">
                <Eye className="w-12 h-12" />
                Report ID: {report.id}
              </div>
            </div>
          </motion.footer>
        </div>
      </div>
    </div>
  );
}