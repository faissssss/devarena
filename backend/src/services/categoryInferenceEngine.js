/**
 * Category Inference Engine
 * 
 * Automatically classifies competitions into appropriate categories based on
 * keyword-based content analysis of platform name, title, description, and tags.
 * 
 * Categories are assigned based on priority order (most specific to least specific):
 * 1. Web3/Blockchain (highest priority)
 * 2. Game Development
 * 3. Mobile Development
 * 4. Design/UI/UX
 * 5. Cloud/DevOps
 * 6. AI/Data Science
 * 7. Hackathons
 * 8. CTF/Security
 * 9. Competitive Programming
 * 10. Other (fallback, lowest priority)
 */

/**
 * Category keyword mappings for classification
 * Each category has an array of keywords that indicate the competition belongs to that category
 */
export const CATEGORY_KEYWORDS = {
  'Web3/Blockchain': [
    'web3',
    'blockchain',
    'ethereum',
    'solidity',
    'smart contract',
    'defi',
    'nft',
    'crypto',
    'web 3',
    'decentralized',
  ],
  'Game Development': [
    'game dev',
    'unity',
    'unreal',
    'godot',
    'game jam',
    'gamedev',
    'game development',
    'game engine',
    'phaser',
  ],
  'Mobile Development': [
    'mobile',
    'android',
    'ios',
    'flutter',
    'react native',
    'swift',
    'kotlin',
    'mobile app',
    'xamarin',
  ],
  'Design/UI/UX': [
    'design',
    'ui',
    'ux',
    'figma',
    'prototype',
    'user experience',
    'user interface',
    'wireframe',
    'mockup',
  ],
  'Cloud/DevOps': [
    'cloud',
    'devops',
    'aws',
    'azure',
    'kubernetes',
    'docker',
    'infrastructure',
    'terraform',
    'ci/cd',
  ],
  'AI/Data Science': [
    'kaggle',
    'machine learning',
    'data',
    'ai',
    'neural',
    'model',
    'deep learning',
    'data science',
    'ml',
    'artificial intelligence',
  ],
  'Hackathons': ['hackathon', 'devpost', 'mlh', 'hack', 'major league hacking'],
  'CTF/Security': [
    'ctf',
    'security',
    'pwn',
    'crypto',
    'forensics',
    'capture the flag',
    'cybersecurity',
    'hacking',
    'penetration',
  ],
  'Competitive Programming': [
    'codeforces',
    'leetcode',
    'hackerrank',
    'atcoder',
    'topcoder',
    'codechef',
    'competitive programming',
    'coding contest',
  ],
};

const CATEGORY_PRIORITY = [
  'Other',
  'Competitive Programming',
  'CTF/Security',
  'Hackathons',
  'AI/Data Science',
  'Cloud/DevOps',
  'Design/UI/UX',
  'Mobile Development',
  'Game Development',
  'Web3/Blockchain',
];

function matchKeywords(text, keywords) {
  return keywords.some((keyword) => {
    let escapedKeyword = keyword;
    const specialChars = ['\\', '.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']'];
    for (const char of specialChars) {
      escapedKeyword = escapedKeyword.split(char).join('\\' + char);
    }
    const pattern = new RegExp('\\b' + escapedKeyword + '\\b', 'i');
    return pattern.test(text);
  });
}

function selectMostSpecificCategory(matchedCategories) {
  if (matchedCategories.length === 0) {
    return 'Other';
  }
  if (matchedCategories.length === 1) {
    return matchedCategories[0];
  }
  let highestPriority = -1;
  let selectedCategory = 'Other';
  for (const category of matchedCategories) {
    const priority = CATEGORY_PRIORITY.indexOf(category);
    if (priority > highestPriority) {
      highestPriority = priority;
      selectedCategory = category;
    }
  }
  return selectedCategory;
}

export function inferCategory(platform = '', title = '', description = '', tags = []) {
  const platformText = String(platform || '').toLowerCase();
  const titleText = String(title || '').toLowerCase();
  const descriptionText = String(description || '').toLowerCase();
  const tagsText = Array.isArray(tags)
    ? tags.join(' ').toLowerCase()
    : String(tags || '').toLowerCase();
  const searchText = `${platformText} ${titleText} ${descriptionText} ${tagsText}`;
  const matchedCategories = [];
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (matchKeywords(searchText, keywords)) {
      matchedCategories.push(category);
    }
  }
  return selectMostSpecificCategory(matchedCategories);
}
