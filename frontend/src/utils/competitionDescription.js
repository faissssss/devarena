const categoryFallbacks = {
  'Competitive Programming':
    'Sharpen your problem-solving with timed algorithmic challenges built for fast, precise coding.',
  'AI/Data Science':
    'Build, train, and evaluate data-driven solutions across machine learning, analytics, and applied AI.',
  Hackathons:
    'Create and ship ideas quickly in a collaborative sprint focused on real product building.',
  'CTF/Security':
    'Test your security instincts through hands-on exploitation, defense, and forensic problem solving.',
  'Web3/Blockchain':
    'Explore decentralized apps, smart contracts, and protocol design in a blockchain-focused competition.',
  'Game Development':
    'Design interactive experiences, mechanics, and polished gameplay under a fixed challenge brief.',
  'Mobile Development':
    'Craft mobile-first products with strong UX, performance, and practical feature delivery.',
  'Design/UI/UX':
    'Solve product and interface problems with thoughtful visual systems, flows, and user-centered design.',
  'Cloud/DevOps':
    'Tackle infrastructure, deployment, automation, and reliability challenges in modern cloud environments.',
  Other:
    'Take on a curated developer competition that rewards creativity, execution, and technical range.',
};

export function getCompetitionDescription(competition) {
  if (competition?.description?.trim()) {
    return competition.description.trim();
  }

  const categoryFallback = categoryFallbacks[competition?.category] || categoryFallbacks.Other;
  const platform = competition?.platform ? `${competition.platform} challenge` : 'community challenge';
  const location = competition?.location && competition.location.toLowerCase() !== 'online'
    ? ` with an on-site component in ${competition.location}`
    : '';

  return `${categoryFallback} This ${platform} gives you a chance to compete, learn, and stand out${location}.`;
}
