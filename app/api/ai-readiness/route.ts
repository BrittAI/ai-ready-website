import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

interface CheckResult {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warning';
  score: number;
  details: string;
  recommendation: string;
  actionItems?: string[];
}

// Calculate Flesch-Kincaid readability score
function calculateReadability(text: string): number {
  // Simple approximation of Flesch Reading Ease
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((acc, word) => {
    // Simple syllable counting: count vowel groups
    return acc + (word.match(/[aeiouAEIOU]+/g) || []).length || 1;
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

// Extract text content from HTML
function extractTextContent(html: string): string {
  // Remove script and style tags (using [\s\S] instead of . with s flag)
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  cleanHtml = cleanHtml.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  cleanHtml = cleanHtml.replace(/&nbsp;/g, ' ');
  cleanHtml = cleanHtml.replace(/&amp;/g, '&');
  cleanHtml = cleanHtml.replace(/&lt;/g, '<');
  cleanHtml = cleanHtml.replace(/&gt;/g, '>');
  cleanHtml = cleanHtml.replace(/&quot;/g, '"');
  cleanHtml = cleanHtml.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  return cleanHtml.replace(/\s+/g, ' ').trim();
}

// Generate specific, actionable recommendations
function getSpecificRecommendations(checkId: string, issues: any, data?: any): { recommendation: string; actionItems: string[] } {
  switch (checkId) {
    case 'heading-structure':
      if (issues.h1Count === 0) {
        return {
          recommendation: 'Add exactly one H1 tag to clearly define your main topic for AI systems',
          actionItems: [
            'Add a single <h1> tag with your primary page topic',
            'Use H2 tags for main sections, H3 for subsections',
            'Ensure logical hierarchy: H1 → H2 → H3 (don\'t skip levels)',
            'Keep headings descriptive and keyword-rich'
          ]
        };
      } else if (issues.h1Count > 1) {
        return {
          recommendation: 'Reduce to exactly one H1 tag to avoid confusing AI about your main topic',
          actionItems: [
            `Convert ${issues.h1Count - 1} extra H1 tags to H2 or H3`,
            'Keep the most important topic as your single H1',
            'Use H2 tags for equal-weight sections',
            'Maintain logical heading hierarchy'
          ]
        };
      } else {
        return {
          recommendation: 'Fix heading hierarchy gaps to help AI understand your content structure',
          actionItems: [
            'Don\'t skip heading levels (e.g., H1 → H3)',
            'Use sequential heading levels (H1 → H2 → H3)',
            'Group related content under appropriate heading levels',
            'Make headings descriptive of the content that follows'
          ]
        };
      }
      
    case 'readability':
      const score = data?.score || 0;
      if (score < 30) {
        return {
          recommendation: 'Significantly simplify your writing to make it more accessible to AI and users',
          actionItems: [
            'Break long sentences into shorter ones (aim for 15-20 words)',
            'Replace complex words with simpler alternatives',
            'Use active voice instead of passive voice',
            'Add bullet points and numbered lists',
            'Include more white space and paragraph breaks'
          ],
        };
      } else {
        return {
          recommendation: 'Improve readability with clearer structure and simpler language',
          actionItems: [
            'Shorten sentences where possible',
            'Use more common words when available',
            'Add subheadings to break up long sections',
            'Include bullet points for lists',
            'Use shorter paragraphs (3-4 sentences max)'
          ]
        };
      }
      
    case 'meta-tags':
      const missing: string[] = [];
      if (!data?.hasTitle) missing.push('title');
      if (!data?.hasDescription) missing.push('description');
      if (!data?.hasAuthor) missing.push('author');
      
      return {
        recommendation: 'Add essential metadata to help AI understand your page context and purpose',
        actionItems: [
          missing.includes('title') ? 'Add a descriptive <title> tag (50-60 characters)' : '',
          missing.includes('description') ? 'Add a meta description (120-160 characters)' : '',
          missing.includes('author') ? 'Add author information for content attribution' : '',
          'Include Open Graph tags for better social sharing',
          'Add structured data (JSON-LD) for rich snippets'
        ].filter(Boolean),
      };
      
    case 'semantic-html':
      return {
        recommendation: 'Use semantic HTML5 elements to help AI understand your content structure and meaning',
        actionItems: [
          'Replace <div class="header"> with <header>',
          'Use <main> for primary content area',
          'Wrap navigation in <nav> elements',
          'Use <article> for standalone content pieces',
          'Add <section> for distinct content areas',
          'Include <aside> for sidebar content'
        ],
      };
      
    case 'accessibility':
      return {
        recommendation: 'Improve accessibility to help both users and AI systems understand your content',
        actionItems: [
          data?.imgCount > 0 ? 'Add descriptive alt text to all images' : '',
          'Add ARIA labels to interactive elements',
          'Include proper heading hierarchy',
          'Ensure sufficient color contrast',
          'Add lang attribute to html tag',
          'Use semantic HTML elements'
        ].filter(Boolean)
      };
      
    case 'robots-txt':
      return {
        recommendation: 'Create a robots.txt file to guide AI crawlers and search engines',
        actionItems: [
          'Create /robots.txt in your website root',
          'Allow access for AI crawlers (GPTBot, CCBot, etc.)',
          'Include sitemap location',
          'Block sensitive directories if needed'
        ]
      };
      
    case 'sitemap':
      return {
        recommendation: 'Generate an XML sitemap to help AI systems discover and index your content',
        actionItems: [
          'Create an XML sitemap with all important pages',
          'Include lastmod dates for content freshness',
          'Add priority values for important pages',
          'Submit sitemap to search engines',
          'Reference sitemap in robots.txt'
        ]
      };
      
    case 'llms-txt':
      return {
        recommendation: 'Add an llms.txt file to explicitly define how AI should interact with your content',
        actionItems: [
          'Create /llms.txt in your website root',
          'Specify which content AI can use',
          'Include usage permissions and restrictions',
          'Add contact information for questions',
          'Reference your terms of service'
        ]
      };
      
    case 'faq-structure':
      const faqScore = data?.score || 0;
      if (faqScore < 30) {
        return {
          recommendation: 'Add a comprehensive FAQ section to provide clear question-answer pairs for AI training',
          actionItems: [
            'Create a dedicated FAQ page or section',
            'Structure questions with clear, descriptive headings',
            'Use HTML details/summary elements for expandable FAQs',
            'Add FAQ schema markup for better search visibility',
            'Include 10+ commonly asked questions about your topic'
          ],
        };
      } else {
        return {
          recommendation: 'Enhance your existing FAQ structure with schema markup and more comprehensive questions',
          actionItems: [
            'Add FAQ schema markup to existing questions',
            'Expand FAQ with more detailed answers',
            'Group related questions into categories',
            'Add search functionality for large FAQ sections'
          ]
        };
      }
      
    case 'content-structure':
      const structureScore = data?.score || 0;
      if (structureScore < 50) {
        return {
          recommendation: 'Improve content organization to help AI understand your knowledge structure',
          actionItems: [
            'Add a table of contents for long articles',
            'Create logical section hierarchies with proper headings',
            'Implement breadcrumb navigation',
            'Add "Related Articles" sections with internal links',
            'Use clear section dividers and navigation aids'
          ],
        };
      } else {
        return {
          recommendation: 'Your content structure is good - consider adding advanced organization features',
          actionItems: [
            'Add jump-to-section navigation for very long content',
            'Implement content categorization and tagging',
            'Consider adding a site-wide content index'
          ]
        };
      }
      
    case 'topical-authority':
      const authorityScore = data?.score || 0;
      if (authorityScore < 60) {
        return {
          recommendation: 'Establish stronger topical authority and expertise signals',
          actionItems: [
            'Add detailed author bios with credentials',
            'Include publication and last-updated dates',
            'Add citations and references to external sources',
            'Create comprehensive, in-depth content',
            'Show expertise through detailed explanations and examples'
          ],
        };
      } else {
        return {
          recommendation: 'Strong authority signals detected - maintain and expand your expertise',
          actionItems: [
            'Keep content updated with latest industry changes',
            'Continue building author credibility',
            'Add more comprehensive references and citations'
          ]
        };
      }
      
    default:
      return {
        recommendation: 'Improve this aspect for better AI compatibility',
        actionItems: ['Review and optimize this metric']
      };
  }
}

async function analyzeHTML(html: string, metadata: any, url: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  console.log('[AI-READY] HTML Check 1/8: Extracting text content...');
  const textContent = extractTextContent(html);
  
  console.log('[AI-READY] HTML Check 2/8: Analyzing heading structure...');
  // 1. Heading Structure (High Signal)
  const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
  const headings = html.match(/<h([1-6])[^>]*>/gi) || [];
  const headingLevels = headings.map(h => parseInt(h.match(/<h([1-6])/i)?.[1] || '0'));
  
  let headingScore = 100;
  let headingIssues: string[] = [];
  
  // Check for single H1
  if (h1Count === 0) {
    headingScore -= 40;
    headingIssues.push('No H1 found');
  } else if (h1Count > 1) {
    headingScore -= 30;
    headingIssues.push(`Multiple H1s (${h1Count}) create topic ambiguity`);
  }
  
  // Check heading hierarchy
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i-1] > 1) {
      headingScore -= 15;
      headingIssues.push(`Skipped heading level (H${headingLevels[i-1]} → H${headingLevels[i]})`);
    }
  }
  
  headingScore = Math.max(0, headingScore);
  
  const headingRec = getSpecificRecommendations('heading-structure', { h1Count, headingIssues }, { score: headingScore });
  
  results.push({
    id: 'heading-structure',
    label: 'Heading Hierarchy',
    status: headingScore >= 80 ? 'pass' : headingScore >= 50 ? 'warning' : 'fail',
    score: headingScore,
    details: headingIssues.length > 0 ? headingIssues.join(', ') : `Perfect hierarchy with ${h1Count} H1 and logical structure`,
    recommendation: headingRec.recommendation,
    actionItems: headingRec.actionItems,
  });
  
  console.log('[AI-READY] HTML Check 3/8: Calculating readability score...');
  // 3. Readability Score (High Signal)
  const readabilityScore = calculateReadability(textContent);
  let readabilityStatus: 'pass' | 'warning' | 'fail' = 'pass';
  let readabilityDetails = '';
  let normalizedScore = 0;
  
  if (readabilityScore >= 70) {
    normalizedScore = 100;
    readabilityStatus = 'pass';
    readabilityDetails = `Very readable (Flesch: ${Math.round(readabilityScore)})`;
  } else if (readabilityScore >= 50) {
    normalizedScore = 80;
    readabilityStatus = 'pass';
    readabilityDetails = `Good readability (Flesch: ${Math.round(readabilityScore)})`;
  } else if (readabilityScore >= 30) {
    normalizedScore = 50;
    readabilityStatus = 'warning';
    readabilityDetails = `Difficult to read (Flesch: ${Math.round(readabilityScore)})`;
  } else {
    normalizedScore = 20;
    readabilityStatus = 'fail';
    readabilityDetails = `Very difficult (Flesch: ${Math.round(readabilityScore)})`;
  }
  
  const readabilityRec = getSpecificRecommendations('readability', { readabilityScore }, { score: readabilityScore });
  
  results.push({
    id: 'readability',
    label: 'Content Readability',
    status: readabilityStatus,
    score: normalizedScore,
    details: readabilityDetails,
    recommendation: readabilityRec.recommendation,
    actionItems: readabilityRec.actionItems,
  });
  
  console.log('[AI-READY] HTML Check 4/8: Checking metadata quality...');
  // 4. Enhanced Metadata Quality (Medium Signal)
  const hasOgTitle = metadata?.ogTitle || metadata?.title || html.includes('og:title') || html.includes('<title');
  const hasOgDescription = metadata?.ogDescription || metadata?.description || html.includes('og:description') || html.includes('name="description"');
  
  // Check description quality
  const descMatch = html.match(/content="([^"]*)"/i);
  const descLength = descMatch?.[1]?.length || 0;
  const hasGoodDescLength = descLength >= 70 && descLength <= 160;
  
  const hasCanonical = html.includes('rel="canonical"');
  const hasAuthor = html.includes('name="author"') || html.includes('property="article:author"');
  const hasPublishDate = html.includes('property="article:published_time"') || html.includes('property="article:modified_time"');
  
  // Enhanced scoring - be more generous
  let metaScore = 30; // Base score for having a page
  let metaDetails: string[] = [];
  
  if (hasOgTitle) {
    metaScore += 30;
    metaDetails.push('Title ✓');
  } else if (html.includes('<title')) {
    metaScore += 20;
    metaDetails.push('Basic title');
  }
  
  if (hasOgDescription) {
    metaScore += 25;
    if (hasGoodDescLength) {
      metaScore += 10;
      metaDetails.push('Description ✓');
    } else {
      metaDetails.push('Description');
    }
  }
  
  if (hasAuthor) {
    metaScore += 10;
    metaDetails.push('Author ✓');
  }
  if (hasPublishDate) {
    metaScore += 10;
    metaDetails.push('Date ✓');
  }
  
  // Cap at 100
  metaScore = Math.min(100, metaScore);
  
  const metaRec = getSpecificRecommendations('meta-tags', { metaScore }, { 
    hasTitle: hasOgTitle, 
    hasDescription: hasOgDescription, 
    hasAuthor: hasAuthor 
  });
  
  results.push({
    id: 'meta-tags',
    label: 'Metadata Quality',
    status: metaScore >= 70 ? 'pass' : metaScore >= 40 ? 'warning' : 'fail',
    score: metaScore,
    details: metaDetails.length > 0 ? metaDetails.join(', ') : 'Missing critical metadata',
    recommendation: metaRec.recommendation,
    actionItems: metaRec.actionItems,
  });
  
  console.log('[AI-READY] HTML Check 5/8: Checking semantic HTML and accessibility...');
  // 6. Semantic HTML (Medium Signal)
  const semanticTags = ['<article', '<nav', '<main', '<section', '<header', '<footer', '<aside'];
  const semanticCount = semanticTags.filter(tag => html.includes(tag)).length;
  
  // Modern SPAs might use divs with proper ARIA roles
  const hasAriaRoles = html.includes('role="') || html.includes('aria-');
  const isModernFramework = html.includes('__next') || html.includes('_app') || html.includes('react') || html.includes('vue') || html.includes('svelte');
  
  const semanticScore = Math.min(100, 
    (semanticCount / 5) * 60 + 
    (hasAriaRoles ? 20 : 0) + 
    (isModernFramework ? 20 : 0));
  
  const semanticRec = getSpecificRecommendations('semantic-html', { semanticCount }, { score: semanticScore });
  
  results.push({
    id: 'semantic-html',
    label: 'Semantic HTML',
    status: semanticScore >= 80 ? 'pass' : semanticScore >= 40 ? 'warning' : 'fail',
    score: semanticScore,
    details: `Found ${semanticCount} semantic HTML5 elements`,
    recommendation: semanticRec.recommendation,
    actionItems: semanticRec.actionItems,
  });
  
  // 7. Check accessibility (Lower Signal but still important)
  const hasAltText = (html.match(/alt="/g) || []).length;
  const imgCount = (html.match(/<img/g) || []).length;
  const altTextRatio = imgCount > 0 ? (hasAltText / imgCount) * 100 : 100;
  const hasAriaLabels = html.includes('aria-label');
  const hasAriaDescribedBy = html.includes('aria-describedby');
  const hasRole = html.includes('role="');
  const hasLangAttribute = html.includes('lang="');
  
  // Sites with no images shouldn't be penalized
  const imageScore = imgCount === 0 ? 40 : (altTextRatio * 0.4);
  
  const accessibilityScore = Math.min(100, 
    imageScore + 
    (hasAriaLabels ? 20 : 0) + 
    (hasAriaDescribedBy ? 10 : 0) + 
    (hasRole ? 15 : 0) + 
    (hasLangAttribute ? 15 : 0));
  
  const accessibilityRec = getSpecificRecommendations('accessibility', { accessibilityScore }, { 
    imgCount, 
    altTextRatio, 
    hasAriaLabels 
  });
  
  results.push({
    id: 'accessibility',
    label: 'Accessibility',
    status: accessibilityScore >= 80 ? 'pass' : accessibilityScore >= 50 ? 'warning' : 'fail',
    score: Math.round(accessibilityScore),
    details: `${Math.round(altTextRatio)}% images have alt text, ARIA labels: ${hasAriaLabels ? 'Yes' : 'No'}`,
    recommendation: accessibilityRec.recommendation,
    actionItems: accessibilityRec.actionItems,
  });
  
  // NEW CATEGORIES: Add the expanded analysis
  console.log('[AI-READY] HTML Check 6/8: Analyzing FAQ structure...');
  const faqAnalysis = analyzeFAQStructure(html, textContent);
  results.push(faqAnalysis);
  
  console.log('[AI-READY] HTML Check 7/8: Analyzing content structure...');
  const structureAnalysis = analyzeContentStructure(html, textContent);
  results.push(structureAnalysis);
  
  console.log('[AI-READY] HTML Check 8/8: Analyzing topical authority...');
  const authorityAnalysis = analyzeTopicalAuthority(html, metadata, textContent);
  results.push(authorityAnalysis);
  
  return results;
}

// NEW: Analyze FAQ structure and Q&A patterns
function analyzeFAQStructure(html: string, textContent: string): CheckResult {
  
  let score = 0;
  let details: string[] = [];
  
  // Check for FAQ schema markup
  const hasFAQSchema = html.includes('schema.org/FAQPage') || html.includes('schema.org/Question');
  if (hasFAQSchema) {
    score += 30;
    details.push('FAQ schema markup found');
  }
  
  // Check for HTML5 details/summary elements
  const detailsCount = (html.match(/<details[^>]*>/gi) || []).length;
  if (detailsCount > 0) {
    score += Math.min(25, detailsCount * 5);
    details.push(`${detailsCount} expandable FAQ items found`);
  }
  
  // Check for FAQ-style content patterns
  const faqPatterns = [
    /what\s+is\s+[^.?]+\?/gi,
    /how\s+to\s+[^.?]+\?/gi,
    /why\s+does\s+[^.?]+\?/gi,
    /when\s+should\s+[^.?]+\?/gi,
    /where\s+can\s+[^.?]+\?/gi,
    /frequently\s+asked\s+questions?/gi,
    /common\s+questions?/gi,
    /q&a|q\s*&\s*a/gi
  ];
  
  let questionCount = 0;
  faqPatterns.forEach(pattern => {
    const matches = textContent.match(pattern) || [];
    questionCount += matches.length;
  });
  
  if (questionCount > 0) {
    score += Math.min(35, questionCount * 3);
    details.push(`${questionCount} question-answer patterns detected`);
  }
  
  // Check for FAQ section headers
  const faqHeaders = html.match(/<h[1-6][^>]*>.*?(faq|question|help|support).*?<\/h[1-6]>/gi) || [];
  if (faqHeaders.length > 0) {
    score += 10;
    details.push('FAQ section headers found');
  }
  
  score = Math.min(100, score);
  
  const faqRec = getSpecificRecommendations('faq-structure', {}, { score });
  
  return {
    id: 'faq-structure',
    label: 'FAQ & Q&A Structure',
    status: score >= 70 ? 'pass' : score >= 40 ? 'warning' : 'fail',
    score,
    details: details.length > 0 ? details.join(', ') : 'No FAQ structure detected',
    recommendation: faqRec.recommendation,
    actionItems: faqRec.actionItems,
  };
}

// NEW: Analyze content structure and organization
function analyzeContentStructure(html: string, textContent: string): CheckResult {
  
  let score = 0;
  let details: string[] = [];
  
  // Check for table of contents
  const tocPatterns = [
    /table\s+of\s+contents/gi,
    /<nav[^>]*class[^>]*toc/gi,
    /<ol[^>]*class[^>]*contents/gi,
    /<ul[^>]*class[^>]*contents/gi
  ];
  
  const hasTOC = tocPatterns.some(pattern => html.match(pattern));
  if (hasTOC) {
    score += 25;
    details.push('Table of contents found');
  }
  
  // Check for breadcrumb navigation
  const breadcrumbPatterns = [
    /breadcrumb/gi,
    /<nav[^>]*aria-label[^>]*breadcrumb/gi,
    /schema\.org\/BreadcrumbList/gi
  ];
  
  const hasBreadcrumbs = breadcrumbPatterns.some(pattern => html.match(pattern));
  if (hasBreadcrumbs) {
    score += 20;
    details.push('Breadcrumb navigation found');
  }
  
  // Check for internal linking
  const internalLinks = (html.match(/<a[^>]+href=["'][^"']*#[^"']*["'][^>]*>/gi) || []).length;
  if (internalLinks > 0) {
    score += Math.min(20, internalLinks * 2);
    details.push(`${internalLinks} internal anchor links found`);
  }
  
  // Check for related content sections
  const relatedPatterns = [
    /related\s+(articles?|posts?|content|links?)/gi,
    /see\s+also/gi,
    /further\s+reading/gi,
    /more\s+resources?/gi
  ];
  
  const hasRelated = relatedPatterns.some(pattern => textContent.match(pattern));
  if (hasRelated) {
    score += 15;
    details.push('Related content sections found');
  }
  
  // Check for content sectioning with proper headings
  const headings = html.match(/<h[1-6][^>]*>/gi) || [];
  if (headings.length >= 3) {
    score += Math.min(20, headings.length * 2);
    details.push(`${headings.length} section headings for structure`);
  }
  
  score = Math.min(100, score);
  
  const structureRec = getSpecificRecommendations('content-structure', {}, { score });
  
  return {
    id: 'content-structure',
    label: 'Content Organization',
    status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
    score,
    details: details.length > 0 ? details.join(', ') : 'Limited content organization detected',
    recommendation: structureRec.recommendation,
    actionItems: structureRec.actionItems,
  };
}

// NEW: Analyze topical authority and expertise signals
function analyzeTopicalAuthority(html: string, metadata: any, textContent: string): CheckResult {
  
  let score = 0;
  let details: string[] = [];
  
  // Check for author information
  const authorPatterns = [
    /author|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/gi,
    /<meta[^>]+name=["']author["'][^>]*>/gi,
    /rel=["']author["']/gi,
    /itemprop=["']author["']/gi
  ];
  
  const hasAuthor = authorPatterns.some(pattern => html.match(pattern)) || 
                   metadata?.author || 
                   html.includes('schema.org/Person');
  
  if (hasAuthor) {
    score += 25;
    details.push('Author information found');
  }
  
  // Check for publication dates
  const datePatterns = [
    /<time[^>]*datetime/gi,
    /published|updated|modified/gi,
    /<meta[^>]+property=["']article:(published_time|modified_time)["'][^>]*>/gi
  ];
  
  const hasDate = datePatterns.some(pattern => html.match(pattern));
  if (hasDate) {
    score += 20;
    details.push('Publication dates found');
  }
  
  // Check for citations and references
  const citationPatterns = [
    /references?|sources?|citations?/gi,
    /<a[^>]+rel=["']external["'][^>]*>/gi,
    /according\s+to/gi,
    /research\s+(shows?|indicates?)/gi
  ];
  
  let citationCount = 0;
  citationPatterns.forEach(pattern => {
    const matches = textContent.match(pattern) || [];
    citationCount += matches.length;
  });
  
  if (citationCount > 0) {
    score += Math.min(25, citationCount * 3);
    details.push(`${citationCount} citations/references found`);
  }
  
  // Check for content depth (word count as proxy)
  const wordCount = textContent.split(/\s+/).length;
  if (wordCount > 1500) {
    score += 15;
    details.push(`In-depth content (${wordCount} words)`);
  } else if (wordCount > 800) {
    score += 10;
    details.push(`Good content length (${wordCount} words)`);
  }
  
  // Check for expertise indicators
  const expertisePatterns = [
    /certified|expert|specialist|professional/gi,
    /years?\s+of\s+experience/gi,
    /PhD|doctorate|master's|bachelor's/gi,
    /industry\s+(leader|expert|veteran)/gi
  ];
  
  const hasExpertise = expertisePatterns.some(pattern => textContent.match(pattern));
  if (hasExpertise) {
    score += 15;
    details.push('Expertise indicators found');
  }
  
  score = Math.min(100, score);
  
  const authorityRec = getSpecificRecommendations('topical-authority', {}, { score });
  
  return {
    id: 'topical-authority',
    label: 'Topical Authority',
    status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
    score,
    details: details.length > 0 ? details.join(', ') : 'Limited authority signals detected',
    recommendation: authorityRec.recommendation,
    actionItems: authorityRec.actionItems,
  };
}

async function checkAdditionalFiles(domain: string): Promise<{ robots: CheckResult, sitemap: CheckResult, llms: CheckResult }> {
  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const cleanUrl = new URL(baseUrl).origin;
  
  // Helper function to fetch with timeout
  const fetchWithTimeout = async (url: string, timeout = 3000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };
  
  // Define default results
  const defaultRobotsRec = getSpecificRecommendations('robots-txt', {}, {});
  let robotsCheck: CheckResult = {
    id: 'robots-txt',
    label: 'Robots.txt',
    status: 'fail',
    score: 0,
    details: 'No robots.txt file found',
    recommendation: defaultRobotsRec.recommendation,
    actionItems: defaultRobotsRec.actionItems,
  };
  
  const defaultSitemapRec = getSpecificRecommendations('sitemap', {}, {});
  let sitemapCheck: CheckResult = {
    id: 'sitemap',
    label: 'Sitemap',
    status: 'fail',
    score: 0,
    details: 'No sitemap.xml found',
    recommendation: defaultSitemapRec.recommendation,
    actionItems: defaultSitemapRec.actionItems,
  };
  
  const defaultLlmsRec = getSpecificRecommendations('llms-txt', {}, {});
  let llmsCheck: CheckResult = {
    id: 'llms-txt',
    label: 'LLMs.txt',
    status: 'fail',
    score: 0,
    details: 'No llms.txt file found',
    recommendation: defaultLlmsRec.recommendation,
    actionItems: defaultLlmsRec.actionItems,
  };
  
  // Store robots.txt content for sitemap extraction
  let robotsText = '';
  let sitemapUrls: string[] = [];
  
  // Create all fetch promises in parallel
  const promises = [
    // Check robots.txt
    fetchWithTimeout(`${cleanUrl}/robots.txt`)
      .then(async (response) => {
        if (response.ok) {
          robotsText = await response.text();
          const hasUserAgent = robotsText.toLowerCase().includes('user-agent');
          
          // Extract sitemap URLs from robots.txt
          const sitemapMatches = robotsText.match(/Sitemap:\s*(.+)/gi);
          if (sitemapMatches) {
            sitemapUrls = sitemapMatches.map(match => 
              match.replace(/Sitemap:\s*/i, '').trim()
            );
          }
          
          const hasSitemap = sitemapUrls.length > 0;
          const score = (hasUserAgent ? 60 : 0) + (hasSitemap ? 40 : 0);
          
          const robotsRec = score >= 80 ? 
            { recommendation: 'Robots.txt properly configured for AI crawlers', actionItems: ['Monitor crawler behavior and update as needed'] } :
            getSpecificRecommendations('robots-txt', {}, {});
          
          robotsCheck = {
            id: 'robots-txt',
            label: 'Robots.txt',
            status: score >= 80 ? 'pass' : score >= 40 ? 'warning' : 'fail',
            score,
            details: `Robots.txt found${hasSitemap ? ` with ${sitemapUrls.length} sitemap reference(s)` : ''}`,
            recommendation: robotsRec.recommendation,
            actionItems: robotsRec.actionItems,
            // Note: robotsRec may contain additional properties
          };
        }
      })
      .catch(() => {}), // Ignore errors, use default
    
    // Check llms.txt variations in parallel
    ...['llms.txt', 'LLMs.txt', 'llms-full.txt'].map(filename =>
      fetchWithTimeout(`${cleanUrl}/${filename}`)
        .then(async (response) => {
          if (response.ok) {
            const llmsText = await response.text();
            // Verify it's actually an LLMs.txt file, not a 404 page or HTML
            const isValidLlms = (
              llmsText.length > 10 && // Has some content
              !llmsText.includes('<!DOCTYPE') && 
              !llmsText.includes('<html') &&
              !llmsText.includes('<HTML') &&
              !llmsText.toLowerCase().includes('404 not found') &&
              !llmsText.toLowerCase().includes('page not found') &&
              !llmsText.toLowerCase().includes('cannot be found')
            );
            
            if (isValidLlms) {
              llmsCheck = {
                id: 'llms-txt',
                label: 'LLMs.txt',
                status: 'pass',
                score: 100,
                details: `${filename} file found with AI usage guidelines`,
                recommendation: 'Great! You have defined AI usage permissions',
                actionItems: ['Review and update AI usage guidelines periodically', 'Monitor for compliance with AI training policies']
              };
            }
          }
        })
        .catch(() => {}) // Ignore errors
    )
  ];
  
  // Wait for all promises to complete (with timeout)
  await Promise.all(promises);
  
  // After checking robots.txt, now check for sitemaps
  // First check URLs from robots.txt, then fallback to common locations
  const possibleSitemapUrls = [...sitemapUrls];
  
  // Add common sitemap locations if not already in list
  const commonLocations = [
    `${cleanUrl}/sitemap.xml`,
    `${cleanUrl}/sitemap_index.xml`,
    `${cleanUrl}/sitemap-index.xml`,
    `${cleanUrl}/sitemaps/sitemap.xml`,
    `${cleanUrl}/sitemap/sitemap.xml`
  ];
  
  for (const url of commonLocations) {
    if (!possibleSitemapUrls.includes(url)) {
      possibleSitemapUrls.push(url);
    }
  }
  
  // Check all possible sitemap URLs
  for (const sitemapUrl of possibleSitemapUrls) {
    try {
      const response = await fetchWithTimeout(sitemapUrl);
      if (response.ok) {
        const content = await response.text();
        // Verify it's actually an XML sitemap
        const isValidSitemap = (
          content.includes('<?xml') || 
          content.includes('<urlset') || 
          content.includes('<sitemapindex') ||
          content.includes('<url>') ||
          content.includes('<sitemap>')
        ) && !content.includes('<!DOCTYPE html');
        
        if (isValidSitemap) {
          const fromRobots = sitemapUrls.includes(sitemapUrl);
          sitemapCheck = {
            id: 'sitemap',
            label: 'Sitemap',
            status: 'pass',
            score: 100,
            details: `Valid XML sitemap found${fromRobots ? ' (referenced in robots.txt)' : ` at ${sitemapUrl.replace(cleanUrl, '')}`}`,
            recommendation: 'Sitemap is properly configured for discoverability',
            actionItems: ['Keep sitemap updated with new content', 'Monitor crawl statistics in search console', 'Include priority and lastmod dates'],
          };
          break; // Found a valid sitemap, stop checking
        }
      }
    } catch (error) {
      // Continue checking other URLs
    }
  }
  
  return { robots: robotsCheck, sitemap: sitemapCheck, llms: llmsCheck };
}

// Domain reputation bonus for well-known, AI-friendly sites
function getDomainReputationBonus(domain: string): number {
  const topTierDomains = [
    'vercel.com', 'stripe.com', 'github.com', 'openai.com', 
    'anthropic.com', 'google.com', 'microsoft.com', 'apple.com',
    'aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com',
    'react.dev', 'nextjs.org', 'tailwindcss.com'
  ];
  
  const secondTierDomains = [
    'netlify.com', 'heroku.com', 'digitalocean.com', 'cloudflare.com',
    'twilio.com', 'slack.com', 'notion.so', 'linear.app', 'figma.com'
  ];
  
  // Remove www. and check
  const cleanDomain = domain.replace('www.', '');
  
  // Check for documentation sites first (highest priority)
  if (cleanDomain.includes('docs.') || cleanDomain.includes('developer.') || cleanDomain.includes('api.')) {
    return 20; // 20% bonus for documentation sites
  }
  
  if (topTierDomains.some(d => cleanDomain === d || cleanDomain.endsWith(`.${d}`))) {
    return 18; // 18% bonus for top-tier sites
  }
  
  if (secondTierDomains.some(d => cleanDomain === d || cleanDomain.endsWith(`.${d}`))) {
    return 12; // 12% bonus for second-tier sites
  }
  
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    let { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }
    
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }
    
    console.log('[AI-READY] Step 1/4: Starting Firecrawl scrape...');
    const scrapeStartTime = Date.now();
    
    // Scrape the website using Firecrawl v2
    let scrapeResult;
    try {
      scrapeResult = await firecrawl.scrape(url, {
        formats: ['html'],
      });
      console.log(`[AI-READY] Step 1/4: Firecrawl scrape completed in ${Date.now() - scrapeStartTime}ms`);
    } catch (scrapeError) {
      console.error('Firecrawl scrape error:', scrapeError);
      return NextResponse.json({ error: 'Failed to scrape website. Please check the URL.' }, { status: 500 });
    }
    
    // Check different possible response structures
    const html = scrapeResult?.html || scrapeResult?.data?.html || scrapeResult?.content || '';
    const metadata = scrapeResult?.metadata || scrapeResult?.data?.metadata || {};
    
    if (!html) {
      console.error('No HTML content found in response');
      return NextResponse.json({ error: 'Failed to extract content from website' }, { status: 500 });
    }
    
    console.log('[AI-READY] Step 2/4: Analyzing HTML content...');
    const htmlStartTime = Date.now();
    
    // Analyze the HTML
    const htmlChecks = await analyzeHTML(html, metadata, url);
    console.log(`[AI-READY] Step 2/4: HTML analysis completed in ${Date.now() - htmlStartTime}ms`);
    
    console.log('[AI-READY] Step 3/4: Checking robots.txt, sitemap.xml, llms.txt...');
    const filesStartTime = Date.now();
    
    // Check additional files
    const fileChecks = await checkAdditionalFiles(url);
    console.log(`[AI-READY] Step 3/4: File checks completed in ${Date.now() - filesStartTime}ms`);
    
    console.log('[AI-READY] Step 4/4: Calculating final scores...');
    const scoreStartTime = Date.now();
    
    // Combine all checks
    const allChecks = [
      fileChecks.llms,
      fileChecks.robots,
      fileChecks.sitemap,
      ...htmlChecks
    ];
    
    // Calculate overall score with weighted categories
    // Enhanced weights for expanded AI readiness analysis
    const weights = {
      // Content Quality (High importance for AI training)
      'readability': 1.5,           // Clear, readable content
      'heading-structure': 1.4,     // Logical information hierarchy
      'meta-tags': 1.2,             // Basic context and description
      'faq-structure': 1.3,         // NEW: Q&A pairs are valuable for AI
      
      // Authority & Expertise (Medium-high importance)
      'topical-authority': 1.2,     // NEW: Expert content signals
      'content-structure': 1.1,     // NEW: Well-organized knowledge
      
      // Technical Foundation (Medium importance)
      'semantic-html': 1.0,         // Structured markup
      'accessibility': 0.9,         // Universal access
      
      // Domain-Level Signals (Lower importance)
      'robots-txt': 0.8,            // Reduced weight
      'sitemap': 0.7,               // Reduced weight  
      'llms-txt': 0.3               // Specialized but rare
    };
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    for (const check of allChecks) {
      const weight = weights[check.id] || 1.0;
      weightedSum += check.score * weight;
      totalWeight += weight;
    }
    
    // Apply domain reputation bonus for known good sites
    const domain = new URL(url).hostname.toLowerCase();
    const reputationBonus = getDomainReputationBonus(domain);
    
    let baseScore = Math.round(weightedSum / totalWeight);
    
    // Boost score for sites with good content signals (expanded categories)
    const contentSignals = allChecks.filter(c => 
      ['readability', 'heading-structure', 'meta-tags', 'faq-structure', 'topical-authority'].includes(c.id) && c.score >= 60
    ).length;
    
    // Add bonus for good content (up to 20 points)
    if (contentSignals >= 3) {
      baseScore += 15;
    } else if (contentSignals >= 2) {
      baseScore += 10;
    }
    
    // Ensure minimum viable score
    if (baseScore < 35 && allChecks.some(c => c.score >= 80)) {
      baseScore = 35; // Minimum 35% if any metric is excellent
    }
    
    const overallScore = Math.min(100, baseScore + reputationBonus);
    
    console.log(`[AI-READY] Step 4/4: Score calculation completed in ${Date.now() - scoreStartTime}ms`);
    console.log(`[AI-READY] Final scoring for ${domain}: base=${baseScore}, bonus=${reputationBonus}, final=${overallScore}`);
    console.log(`[AI-READY] Total analysis time: ${Date.now() - scrapeStartTime}ms`);
    
    return NextResponse.json({
      success: true,
      url,
      overallScore,
      checks: allChecks,
      htmlContent: html.substring(0, 10000), // Limit HTML for client transfer
      metadata: {
        title: metadata.title,
        description: metadata.description,
        analyzedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('AI Readiness analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze website' },
      { status: 500 }
    );
  }
}