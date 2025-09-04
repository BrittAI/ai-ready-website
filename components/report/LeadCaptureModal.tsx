"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, User, Building2, Sparkles } from 'lucide-react';

interface LeadCaptureModalProps {
  reportId: string;
  onLeadCaptured: (leadId: number) => void;
  onSkip: () => void;
  brandColors?: React.CSSProperties;
}

export default function LeadCaptureModal({ reportId, onLeadCaptured, onSkip, brandColors }: LeadCaptureModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          email: formData.email,
          name: formData.name || undefined,
          company: formData.company || undefined
        })
      });

      const data = await response.json();
      
      if (data.success) {
        onLeadCaptured(data.leadId);
      } else {
        setError(data.error || 'Failed to save your information');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-20"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-12 p-32 max-w-md w-full relative"
        style={brandColors}
      >
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-16 right-16 p-8 hover:bg-black-alpha-4 rounded-8 transition-colors"
        >
          <X className="w-16 h-16 text-black-alpha-32" />
        </button>

        {/* Header */}
        <div className="text-center mb-24">
          <div className="inline-flex items-center justify-center w-60 h-60 rounded-full bg-gradient-to-br from-heat-4 to-heat-20 mb-16">
            <Sparkles className="w-24 h-24 text-heat-100" />
          </div>
          
          <h2 className="text-title-h4 text-accent-black mb-8">
            Get Your Full AI Readiness Report
          </h2>
          
          <p className="text-body-medium text-black-alpha-64">
            Enter your email to access detailed recommendations and actionable insights for improving your website's AI compatibility.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-16">
          {/* Email Field */}
          <div>
            <label className="block text-label-medium text-accent-black mb-6">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-12 top-1/2 -translate-y-1/2 w-16 h-16 text-black-alpha-32" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-40 pr-16 py-12 border border-black-alpha-8 rounded-8 text-body-input focus:outline-none focus:ring-2 focus:ring-heat-100 focus:border-heat-100 transition-all"
              />
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-label-medium text-accent-black mb-6">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-12 top-1/2 -translate-y-1/2 w-16 h-16 text-black-alpha-32" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="w-full pl-40 pr-16 py-12 border border-black-alpha-8 rounded-8 text-body-input focus:outline-none focus:ring-2 focus:ring-heat-100 focus:border-heat-100 transition-all"
              />
            </div>
          </div>

          {/* Company Field */}
          <div>
            <label className="block text-label-medium text-accent-black mb-6">
              Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-12 top-1/2 -translate-y-1/2 w-16 h-16 text-black-alpha-32" />
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Your Company"
                className="w-full pl-40 pr-16 py-12 border border-black-alpha-8 rounded-8 text-body-input focus:outline-none focus:ring-2 focus:ring-heat-100 focus:border-heat-100 transition-all"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-label-small text-heat-200 bg-heat-4 px-12 py-8 rounded-6"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!formData.email || isSubmitting}
            className="w-full py-12 px-20 bg-heat-100 hover:bg-heat-150 disabled:bg-black-alpha-8 disabled:text-black-alpha-32 text-white text-label-large font-medium rounded-8 transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-8">
                <div className="w-16 h-16 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              'Get My Report'
            )}
          </button>

          {/* Skip Option */}
          <div className="text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-label-small text-black-alpha-48 hover:text-black-alpha-64 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>

        {/* Privacy Note */}
        <p className="text-mono-x-small text-black-alpha-32 text-center mt-16">
          We respect your privacy. Your information will only be used to provide you with relevant insights.
        </p>
      </motion.div>
    </motion.div>
  );
}