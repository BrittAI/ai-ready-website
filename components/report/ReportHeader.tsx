"use client";

import { motion } from 'framer-motion';
import { Download, ExternalLink, Calendar, Globe } from 'lucide-react';

interface ReportHeaderProps {
  report: {
    url: string;
    overall_score: number;
    created_at: string;
    company_name?: string;
    logo_url?: string;
  };
  onDownloadPDF: () => void;
  onSectionView: (sectionId: string) => void;
}

export default function ReportHeader({ report, onDownloadPDF, onSectionView }: ReportHeaderProps) {
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B', color: 'text-heat-100' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const { grade, color } = getScoreGrade(report.overall_score);

  return (
    <motion.header
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-48"
      onViewportEnter={() => onSectionView('header')}
    >
      {/* Company Branding */}
      {report.company_name && (
        <div className="flex items-center justify-center gap-12 mb-20">
          {report.logo_url && (
            <img 
              src={report.logo_url} 
              alt={report.company_name}
              className="h-32 object-contain"
            />
          )}
          <div className="text-label-large text-accent-black">
            {report.company_name}
          </div>
        </div>
      )}

      {/* Title */}
      <motion.h1 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-title-h2 text-accent-black mb-16"
      >
        AI Readiness Report
      </motion.h1>

      {/* Website URL */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-center gap-8 mb-24"
      >
        <Globe className="w-20 h-20 text-heat-100" />
        <div className="text-left">
          <div className="text-label-small text-black-alpha-48">Analyzed Website</div>
          <a 
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-body-large text-heat-100 hover:text-heat-150 transition-colors flex items-center gap-6"
          >
            {report.url}
            <ExternalLink className="w-16 h-16" />
          </a>
        </div>
      </motion.div>

      {/* Score Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
        className="inline-flex items-center gap-16 bg-accent-white rounded-12 p-20 border border-black-alpha-8 mb-20"
      >
        <div className="text-center">
          <div className={`text-title-h1 font-bold ${color}`}>
            {grade}
          </div>
          <div className="text-label-small text-black-alpha-48">Grade</div>
        </div>
        
        <div className="w-px h-40 bg-black-alpha-8"></div>
        
        <div className="text-center">
          <div className="text-title-h1 font-bold text-heat-100">
            {report.overall_score}
          </div>
          <div className="text-label-small text-black-alpha-48">Score</div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-12 mb-20"
      >
        <button
          onClick={onDownloadPDF}
          data-download-pdf
          className="inline-flex items-center gap-8 px-20 py-12 bg-heat-100 hover:bg-heat-150 text-white rounded-8 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-16 h-16" />
          Download PDF Report
        </button>
        
        <a
          href={report.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-8 px-20 py-12 bg-accent-white hover:bg-black-alpha-4 border border-black-alpha-8 text-accent-black rounded-8 transition-all"
        >
          <ExternalLink className="w-16 h-16" />
          Visit Website
        </a>
      </motion.div>

      {/* Report Metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-24 text-label-small text-black-alpha-48"
      >
        <div className="flex items-center gap-6">
          <Calendar className="w-12 h-12" />
          Report generated on {new Date(report.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </motion.div>
    </motion.header>
  );
}