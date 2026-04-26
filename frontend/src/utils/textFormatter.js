/**
 * Format competition titles to fix common text formatting issues
 * Examples:
 *   "Arc Prize 2026 Agi 3" → "Arc Prize 2026 AGI 3"
 *   "Openai Gpt Oss 20b Red Teaming" → "OpenAI GPT OSS 20b Red Teaming"
 *   "Kaggle Measuring Agi" → "Kaggle Measuring AGI"
 */
export function formatTitle(title) {
  if (!title) return title;
  
  // Common acronyms and proper capitalizations
  const replacements = {
    // AI/ML terms
    'Agi': 'AGI',
    'Gpt': 'GPT',
    'Llm': 'LLM',
    'Nlp': 'NLP',
    'Ml': 'ML',
    'Ai': 'AI',
    'Oss': 'OSS',
    'Api': 'API',
    'Sdk': 'SDK',
    
    // Companies
    'Openai': 'OpenAI',
    'Deepmind': 'DeepMind',
    'Kaggle': 'Kaggle',
    
    // Other
    'Ui': 'UI',
    'Ux': 'UX',
    'Ios': 'iOS',
    'Aws': 'AWS',
    'Gcp': 'GCP',
    'Ctf': 'CTF',
    'Sql': 'SQL',
    'Html': 'HTML',
    'Css': 'CSS',
    'Json': 'JSON',
    'Xml': 'XML',
    'Http': 'HTTP',
    'Https': 'HTTPS',
    'Url': 'URL',
    'Uri': 'URI',
  };
  
  let formatted = title;
  
  // Replace each term (word boundary aware)
  Object.entries(replacements).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'g');
    formatted = formatted.replace(regex, correct);
  });
  
  return formatted;
}

/**
 * Format platform names to proper case
 * Examples:
 *   "leetcode" → "LeetCode"
 *   "codeforces" → "CodeForces"
 */
export function formatPlatformName(platform) {
  if (!platform) return platform;
  
  const platformMap = {
    'leetcode': 'LeetCode',
    'codeforces': 'CodeForces',
    'codechef': 'CodeChef',
    'hackerrank': 'HackerRank',
    'topcoder': 'TopCoder',
    'atcoder': 'AtCoder',
    'kaggle': 'Kaggle',
    'devpost': 'Devpost',
    'github': 'GitHub',
    'gitlab': 'GitLab',
  };
  
  const lowerPlatform = platform.toLowerCase();
  return platformMap[lowerPlatform] || platform;
}
