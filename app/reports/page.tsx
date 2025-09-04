"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  Calendar,
  Globe,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface Report {
  id: string;
  url: string;
  overall_score: number;
  created_at: string;
  company_name?: string;
  logo_url?: string;
  primary_color?: string;
}

interface ReportsResponse {
  success: boolean;
  reports: Report[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [currentPage]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports?page=${currentPage}&limit=20`);
      const data: ReportsResponse = await response.json();
      
      if (data.success) {
        setReports(data.reports);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (reportId: string) => {
    setDownloadingIds(prev => new Set(prev).add(reportId));
    
    try {
      const response = await fetch(`/api/pdf?id=${reportId}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

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
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-heat-100';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const handleDeleteReport = async (reportId: string) => {
    setDeletingIds(prev => new Set(prev).add(reportId));
    
    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Remove report from local state
      setReports(prev => prev.filter(report => report.id !== reportId));
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1,
        pages: Math.ceil((prev.total - 1) / prev.limit)
      }));

    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete report. Please try again.');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
      setDeleteConfirmId(null);
    }
  };

  const confirmDelete = (reportId: string, reportUrl: string) => {
    if (window.confirm(`Are you sure you want to delete the report for "${reportUrl}"? This action cannot be undone.`)) {
      handleDeleteReport(reportId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base">
        <div className="container mx-auto px-20 py-40">
          <div className="flex items-center justify-center py-40">
            <div className="text-center">
              <RefreshCw className="w-24 h-24 text-heat-100 animate-spin mx-auto mb-16" />
              <p className="text-body-large text-accent-black">Loading reports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-base">
        <div className="container mx-auto px-20 py-40">
          <div className="text-center py-40">
            <h1 className="text-title-h3 text-accent-black mb-16">Error Loading Reports</h1>
            <p className="text-body-large text-black-alpha-64 mb-24">{error}</p>
            <button
              onClick={() => fetchReports()}
              className="inline-flex items-center gap-8 px-20 py-12 bg-heat-100 hover:bg-heat-150 text-white rounded-8 transition-all"
            >
              <RefreshCw className="w-16 h-16" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base">
      {/* Navigation */}
      <nav className="border-b border-black-alpha-8">
        <div className="container mx-auto px-20 py-16">
          <div className="flex items-center justify-between">
            <a href="/" className="text-body-large font-medium text-accent-black hover:text-heat-100 transition-colors">
              ← Back to Analyzer
            </a>
            <h2 className="text-label-large text-accent-black">AI Readiness Reports</h2>
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-20 py-40">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-48"
        >
          <h1 className="text-title-h2 text-accent-black mb-16">
            AI Readiness Reports
          </h1>
          <p className="text-body-large text-black-alpha-64 max-w-2xl mx-auto">
            View and download your website AI readiness analysis reports
          </p>
        </motion.header>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-40"
          >
            <TrendingUp className="w-24 h-24 text-black-alpha-32 mx-auto mb-16" />
            <h3 className="text-title-h4 text-accent-black mb-12">No Reports Yet</h3>
            <p className="text-body-large text-black-alpha-64 mb-24">
              Create your first AI readiness report to see it here.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-8 px-20 py-12 bg-heat-100 hover:bg-heat-150 text-white rounded-8 transition-all"
            >
              Analyze Website
            </a>
          </motion.div>
        ) : (
          <div className="grid gap-20 md:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-accent-white rounded-12 p-24 border border-black-alpha-8 hover:border-heat-100 transition-all"
              >
                {/* Company Branding */}
                {report.company_name && (
                  <div className="flex items-center gap-8 mb-16">
                    {report.logo_url && (
                      <img 
                        src={report.logo_url} 
                        alt={report.company_name}
                        className="w-16 h-16 object-contain"
                      />
                    )}
                    <span className="text-label-small text-black-alpha-64">
                      {report.company_name}
                    </span>
                  </div>
                )}

                {/* Website URL */}
                <div className="flex items-center gap-8 mb-16">
                  <Globe className="w-16 h-16 text-heat-100 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-label-x-small text-black-alpha-48">Website</div>
                    <div className="text-body-medium text-accent-black truncate">
                      {report.url}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center justify-between mb-20">
                  <div>
                    <div className="text-label-x-small text-black-alpha-48">AI Readiness</div>
                    <div className={`text-title-h4 font-bold ${getScoreColor(report.overall_score)}`}>
                      {report.overall_score}% ({getScoreGrade(report.overall_score)})
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-label-small text-black-alpha-48">
                    <Calendar className="w-12 h-12" />
                    {new Date(report.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-8">
                  <a
                    href={`/report/${report.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-6 px-16 py-10 bg-heat-4 hover:bg-heat-20 text-heat-100 rounded-8 transition-all text-label-medium"
                  >
                    View Report
                    <ChevronRight className="w-12 h-12" />
                  </a>
                  
                  <button
                    onClick={() => handleDownloadPDF(report.id)}
                    disabled={downloadingIds.has(report.id)}
                    className="px-12 py-10 bg-accent-white hover:bg-black-alpha-4 border border-black-alpha-8 text-accent-black rounded-8 transition-all disabled:opacity-50"
                    title="Download PDF"
                  >
                    {downloadingIds.has(report.id) ? (
                      <RefreshCw className="w-16 h-16 animate-spin" />
                    ) : (
                      <Download className="w-16 h-16" />
                    )}
                  </button>

                  <a
                    href={report.url.startsWith('http') ? report.url : `https://${report.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-12 py-10 bg-accent-white hover:bg-black-alpha-4 border border-black-alpha-8 text-accent-black rounded-8 transition-all"
                    title="Visit Website"
                  >
                    <ExternalLink className="w-16 h-16" />
                  </a>

                  <button
                    onClick={() => confirmDelete(report.id, report.url)}
                    disabled={deletingIds.has(report.id)}
                    className="px-12 py-10 bg-accent-white hover:bg-red-50 border border-black-alpha-8 hover:border-red-200 text-red-600 rounded-8 transition-all disabled:opacity-50"
                    title="Delete Report"
                  >
                    {deletingIds.has(report.id) ? (
                      <RefreshCw className="w-16 h-16 animate-spin" />
                    ) : (
                      <Trash2 className="w-16 h-16" />
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-8 mt-40"
          >
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.page <= 1}
              className="px-16 py-8 text-body-medium text-accent-black hover:bg-black-alpha-4 rounded-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-4">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const page = i + Math.max(1, pagination.page - 2);
                if (page > pagination.pages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-32 h-32 rounded-8 text-label-medium transition-all ${
                      page === pagination.page
                        ? 'bg-heat-100 text-white'
                        : 'text-accent-black hover:bg-black-alpha-4'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
              disabled={pagination.page >= pagination.pages}
              className="px-16 py-8 text-body-medium text-accent-black hover:bg-black-alpha-4 rounded-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </motion.div>
        )}

        {/* Stats */}
        {pagination.total > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-24"
          >
            <p className="text-label-small text-black-alpha-48">
              Showing {reports.length} of {pagination.total} reports
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}