"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy,
  Check,
  FileText,
  Code2,
  Globe,
  Users,
  Zap,
  Search,
  Database,
  Shield,
  BookOpen,
  Layers
} from 'lucide-react';

interface ReportMetricsProps {
  analysisData: any;
  onSectionView: (sectionId: string) => void;
  onCodeCopy: () => void;
  onRecommendationClick: (metricId: string) => void;
}

// Icon mapping for different metric types
const getMetricIcon = (metricId: string) => {
  const iconMap: { [key: string]: any } = {
    'heading-structure': FileText,
    'readability': BookOpen,
    'meta-tags': Code2,
    'faq-structure': Users,
    'topical-authority': Zap,
    'content-structure': Layers,
    'semantic-html': Code2,
    'accessibility': Shield,
    'robots-txt': Database,
    'sitemap': Globe,
    'llms-txt': Search
  };
  
  return iconMap[metricId] || FileText;
};

export default function ReportMetrics({ analysisData, onSectionView, onCodeCopy, onRecommendationClick }: ReportMetricsProps) {
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleExpanded = (metricId: string) => {
    const newExpanded = new Set(expandedMetrics);
    if (newExpanded.has(metricId)) {
      newExpanded.delete(metricId);
    } else {
      newExpanded.add(metricId);
    }
    setExpandedMetrics(newExpanded);
    onRecommendationClick(metricId);
  };

  const handleCopyCode = (code: string, metricId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(metricId);
    onCodeCopy();
    
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-20 h-20 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-20 h-20 text-yellow-600" />;
      case 'fail':
        return <XCircle className="w-20 h-20 text-red-600" />;
      default:
        return <AlertTriangle className="w-20 h-20 text-black-alpha-32" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Group metrics by category
  const categories = {
    'Content Quality': ['heading-structure', 'readability', 'meta-tags', 'faq-structure'],
    'Authority & Expertise': ['topical-authority', 'content-structure'],
    'Technical Foundation': ['semantic-html', 'accessibility'],
    'Domain Signals': ['robots-txt', 'sitemap', 'llms-txt']
  };

  if (!analysisData || !analysisData.checks) {
    return (
      <div className="text-center py-40">
        <div className="text-body-large text-black-alpha-48">No analysis data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-32">
      {Object.entries(categories).map(([categoryName, metricIds], categoryIndex) => {
        const categoryMetrics = analysisData.checks.filter((check: any) => 
          metricIds.includes(check.id)
        );

        if (categoryMetrics.length === 0) return null;

        return (
          <motion.section
            key={categoryName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            onViewportEnter={() => onSectionView(categoryName.toLowerCase().replace(' ', '-'))}
            className="bg-white rounded-12 p-24 border border-black-alpha-8"
          >
            {/* Category Header */}
            <h3 className="text-title-h5 text-accent-black mb-20 pb-16 border-b border-black-alpha-8">
              {categoryName}
            </h3>

            {/* Metrics */}
            <div className="space-y-16">
              {categoryMetrics.map((metric: any, metricIndex: number) => {
                const isExpanded = expandedMetrics.has(metric.id);
                const Icon = getMetricIcon(metric.id);

                return (
                  <motion.div
                    key={metric.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: categoryIndex * 0.1 + metricIndex * 0.05 }}
                    className="border border-black-alpha-8 rounded-8 overflow-hidden"
                  >
                    {/* Metric Header */}
                    <div 
                      className="p-16 cursor-pointer hover:bg-black-alpha-2 transition-colors"
                      onClick={() => toggleExpanded(metric.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-12">
                          <Icon className="w-18 h-18 text-heat-100" />
                          <div className="flex-1">
                            <div className="flex items-center gap-12">
                              <h4 className="text-label-large text-accent-black font-medium">
                                {metric.label}
                              </h4>
                              {getStatusIcon(metric.status)}
                            </div>
                            <div className="text-label-small text-black-alpha-64 mt-2">
                              {metric.details}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-16">
                          {/* Score */}
                          <div className="text-right">
                            <div className={`text-label-large font-bold ${getScoreColor(metric.score || 0)}`}>
                              {metric.score || 0}%
                            </div>
                            <div className="w-60 h-2 bg-black-alpha-8 rounded-full mt-4">
                              <div 
                                className={`h-full rounded-full ${getScoreBarColor(metric.score || 0)}`}
                                style={{ width: `${Math.max(metric.score || 0, 2)}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Expand Arrow */}
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-16 h-16 text-black-alpha-32" />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-black-alpha-8 bg-black-alpha-2"
                        >
                          <div className="p-20 space-y-16">
                            {/* Recommendation */}
                            {metric.recommendation && (
                              <div>
                                <h5 className="text-label-medium text-accent-black font-medium mb-8">
                                  Recommendation
                                </h5>
                                <p className="text-body-small text-black-alpha-64">
                                  {metric.recommendation}
                                </p>
                              </div>
                            )}

                            {/* Action Items */}
                            {metric.actionItems && metric.actionItems.length > 0 && (
                              <div>
                                <h5 className="text-label-medium text-accent-black font-medium mb-8">
                                  Action Items
                                </h5>
                                <ul className="space-y-6">
                                  {metric.actionItems.map((item: string, index: number) => (
                                    <li key={index} className="flex items-start gap-8 text-body-small text-black-alpha-64">
                                      <div className="w-6 h-6 rounded-full bg-heat-100 mt-6 flex-shrink-0" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Code Example */}
                            {metric.codeExample && (
                              <div>
                                <div className="flex items-center justify-between mb-8">
                                  <h5 className="text-label-medium text-accent-black font-medium">
                                    Code Example
                                  </h5>
                                  <button
                                    onClick={() => handleCopyCode(metric.codeExample, metric.id)}
                                    className="flex items-center gap-6 px-8 py-4 bg-black-alpha-8 hover:bg-black-alpha-12 rounded-6 transition-colors"
                                  >
                                    {copiedCode === metric.id ? (
                                      <>
                                        <Check className="w-12 h-12 text-green-600" />
                                        <span className="text-mono-x-small text-green-600">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-12 h-12 text-black-alpha-48" />
                                        <span className="text-mono-x-small text-black-alpha-48">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="bg-accent-black text-white text-mono-small p-16 rounded-8 overflow-x-auto">
                                  <code>{metric.codeExample}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        );
      })}
    </div>
  );
}