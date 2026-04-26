import { describe, expect, test } from '@jest/globals';
import { inferCategory, CATEGORY_KEYWORDS } from '../categoryInferenceEngine.js';

describe('categoryInferenceEngine', () => {
  describe('CATEGORY_KEYWORDS', () => {
    test('contains all 10 categories', () => {
      const categories = Object.keys(CATEGORY_KEYWORDS);
      expect(categories).toHaveLength(9); // 9 categories defined (Other is fallback)
      expect(categories).toContain('Web3/Blockchain');
      expect(categories).toContain('Game Development');
      expect(categories).toContain('Mobile Development');
      expect(categories).toContain('Design/UI/UX');
      expect(categories).toContain('Cloud/DevOps');
      expect(categories).toContain('AI/Data Science');
      expect(categories).toContain('Hackathons');
      expect(categories).toContain('CTF/Security');
      expect(categories).toContain('Competitive Programming');
    });

    test('each category has at least one keyword', () => {
      Object.entries(CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
        expect(keywords.length).toBeGreaterThan(0);
      });
    });
  });

  describe('inferCategory - Web3/Blockchain (highest priority)', () => {
    test('classifies Web3/Blockchain by platform keyword', () => {
      expect(inferCategory('Ethereum', '', '', [])).toBe('Web3/Blockchain');
    });

    test('classifies Web3/Blockchain by title keyword', () => {
      expect(inferCategory('', 'Build a DeFi Protocol', '', [])).toBe('Web3/Blockchain');
    });

    test('classifies Web3/Blockchain by description keyword', () => {
      expect(inferCategory('', '', 'Create smart contracts on blockchain', [])).toBe(
        'Web3/Blockchain'
      );
    });

    test('classifies Web3/Blockchain by tags', () => {
      expect(inferCategory('', '', '', ['web3', 'crypto'])).toBe('Web3/Blockchain');
    });

    test('Web3/Blockchain takes priority over Hackathons', () => {
      expect(inferCategory('Devpost', 'ETHGlobal Hackathon', 'Build on Ethereum', ['web3'])).toBe(
        'Web3/Blockchain'
      );
    });
  });

  describe('inferCategory - Game Development', () => {
    test('classifies Game Development by platform keyword', () => {
      expect(inferCategory('Unity', '', '', [])).toBe('Game Development');
    });

    test('classifies Game Development by title keyword', () => {
      expect(inferCategory('', 'Game Jam 2024', '', [])).toBe('Game Development');
    });

    test('classifies Game Development by description keyword', () => {
      expect(inferCategory('', '', 'Build a game using Unreal Engine', [])).toBe(
        'Game Development'
      );
    });

    test('classifies Game Development by tags', () => {
      expect(inferCategory('', '', '', ['gamedev', 'godot'])).toBe('Game Development');
    });
  });

  describe('inferCategory - Mobile Development', () => {
    test('classifies Mobile Development by platform keyword', () => {
      expect(inferCategory('Flutter', '', '', [])).toBe('Mobile Development');
    });

    test('classifies Mobile Development by title keyword', () => {
      expect(inferCategory('', 'Android App Challenge', '', [])).toBe('Mobile Development');
    });

    test('classifies Mobile Development by description keyword', () => {
      expect(inferCategory('', '', 'Build an iOS app with Swift', [])).toBe('Mobile Development');
    });

    test('classifies Mobile Development by tags', () => {
      expect(inferCategory('', '', '', ['mobile', 'react native'])).toBe('Mobile Development');
    });
  });

  describe('inferCategory - Design/UI/UX', () => {
    test('classifies Design/UI/UX by platform keyword', () => {
      expect(inferCategory('Figma', '', '', [])).toBe('Design/UI/UX');
    });

    test('classifies Design/UI/UX by title keyword', () => {
      expect(inferCategory('', 'UI Design Challenge', '', [])).toBe('Design/UI/UX');
    });

    test('classifies Design/UI/UX by description keyword', () => {
      expect(inferCategory('', '', 'Create a user experience prototype', [])).toBe('Design/UI/UX');
    });

    test('classifies Design/UI/UX by tags', () => {
      expect(inferCategory('', '', '', ['ux', 'wireframe'])).toBe('Design/UI/UX');
    });
  });

  describe('inferCategory - Cloud/DevOps', () => {
    test('classifies Cloud/DevOps by platform keyword', () => {
      expect(inferCategory('AWS', '', '', [])).toBe('Cloud/DevOps');
    });

    test('classifies Cloud/DevOps by title keyword', () => {
      expect(inferCategory('', 'Kubernetes Challenge', '', [])).toBe('Cloud/DevOps');
    });

    test('classifies Cloud/DevOps by description keyword', () => {
      expect(inferCategory('', '', 'Deploy infrastructure with Terraform', [])).toBe(
        'Cloud/DevOps'
      );
    });

    test('classifies Cloud/DevOps by tags', () => {
      expect(inferCategory('', '', '', ['docker', 'ci/cd'])).toBe('Cloud/DevOps');
    });
  });

  describe('inferCategory - AI/Data Science', () => {
    test('classifies AI/Data Science by platform keyword', () => {
      expect(inferCategory('Kaggle', '', '', [])).toBe('AI/Data Science');
    });

    test('classifies AI/Data Science by title keyword', () => {
      expect(inferCategory('', 'Machine Learning Competition', '', [])).toBe('AI/Data Science');
    });

    test('classifies AI/Data Science by description keyword', () => {
      expect(inferCategory('', '', 'Build a neural network model', [])).toBe('AI/Data Science');
    });

    test('classifies AI/Data Science by tags', () => {
      expect(inferCategory('', '', '', ['ai', 'data science'])).toBe('AI/Data Science');
    });
  });

  describe('inferCategory - Hackathons', () => {
    test('classifies Hackathons by platform keyword', () => {
      expect(inferCategory('Devpost', '', '', [])).toBe('Hackathons');
    });

    test('classifies Hackathons by title keyword', () => {
      expect(inferCategory('', 'MLH Hackathon', '', [])).toBe('Hackathons');
    });

    test('classifies Hackathons by description keyword', () => {
      expect(inferCategory('', '', 'Join our hackathon event', [])).toBe('Hackathons');
    });

    test('classifies Hackathons by tags', () => {
      expect(inferCategory('', '', '', ['hack', 'major league hacking'])).toBe('Hackathons');
    });
  });

  describe('inferCategory - CTF/Security', () => {
    test('classifies CTF/Security by platform keyword', () => {
      expect(inferCategory('CTF Platform', '', '', [])).toBe('CTF/Security');
    });

    test('classifies CTF/Security by title keyword', () => {
      expect(inferCategory('', 'Capture The Flag Challenge', '', [])).toBe('CTF/Security');
    });

    test('classifies CTF/Security by description keyword', () => {
      expect(inferCategory('', '', 'Test your cybersecurity skills', [])).toBe('CTF/Security');
    });

    test('classifies CTF/Security by tags', () => {
      expect(inferCategory('', '', '', ['security', 'pwn'])).toBe('CTF/Security');
    });
  });

  describe('inferCategory - Competitive Programming', () => {
    test('classifies Competitive Programming by platform keyword', () => {
      expect(inferCategory('CodeForces', '', '', [])).toBe('Competitive Programming');
    });

    test('classifies Competitive Programming by title keyword', () => {
      expect(inferCategory('', 'LeetCode Weekly Contest', '', [])).toBe('Competitive Programming');
    });

    test('classifies Competitive Programming by description keyword', () => {
      expect(inferCategory('', '', 'Solve algorithmic problems on HackerRank', [])).toBe(
        'Competitive Programming'
      );
    });

    test('classifies Competitive Programming by tags', () => {
      expect(inferCategory('', '', '', ['competitive programming', 'codechef'])).toBe(
        'Competitive Programming'
      );
    });
  });

  describe('inferCategory - Other (fallback)', () => {
    test('defaults to Other when no keywords match', () => {
      expect(inferCategory('Unknown Platform', 'Random Competition', 'No specific keywords', [])).toBe(
        'Other'
      );
    });

    test('defaults to Other with empty inputs', () => {
      expect(inferCategory('', '', '', [])).toBe('Other');
    });

    test('defaults to Other with undefined inputs', () => {
      expect(inferCategory()).toBe('Other');
    });
  });

  describe('inferCategory - case insensitivity', () => {
    test('matches keywords regardless of case in platform', () => {
      expect(inferCategory('KAGGLE', '', '', [])).toBe('AI/Data Science');
      expect(inferCategory('kaggle', '', '', [])).toBe('AI/Data Science');
      expect(inferCategory('KaGgLe', '', '', [])).toBe('AI/Data Science');
    });

    test('matches keywords regardless of case in title', () => {
      expect(inferCategory('', 'BLOCKCHAIN CHALLENGE', '', [])).toBe('Web3/Blockchain');
      expect(inferCategory('', 'blockchain challenge', '', [])).toBe('Web3/Blockchain');
      expect(inferCategory('', 'BlOcKcHaIn ChAlLeNgE', '', [])).toBe('Web3/Blockchain');
    });

    test('matches keywords regardless of case in description', () => {
      expect(inferCategory('', '', 'BUILD A MOBILE APP', [])).toBe('Mobile Development');
      expect(inferCategory('', '', 'build a mobile app', [])).toBe('Mobile Development');
      expect(inferCategory('', '', 'BuIlD a MoBiLe ApP', [])).toBe('Mobile Development');
    });

    test('matches keywords regardless of case in tags', () => {
      expect(inferCategory('', '', '', ['UNITY', 'GAME'])).toBe('Game Development');
      expect(inferCategory('', '', '', ['unity', 'game'])).toBe('Game Development');
      expect(inferCategory('', '', '', ['UnItY', 'GaMe'])).toBe('Game Development');
    });
  });

  describe('inferCategory - priority-based selection', () => {
    test('Web3/Blockchain has highest priority over AI/Data Science', () => {
      expect(
        inferCategory('Platform', 'Blockchain AI Competition', 'Use machine learning on blockchain data', [
          'web3',
          'ai',
        ])
      ).toBe('Web3/Blockchain');
    });

    test('Web3/Blockchain has highest priority over Hackathons', () => {
      expect(
        inferCategory('Devpost', 'ETHGlobal Hackathon', 'Build blockchain apps', ['hackathon', 'ethereum'])
      ).toBe('Web3/Blockchain');
    });

    test('Game Development has priority over AI/Data Science', () => {
      expect(
        inferCategory('Platform', 'AI Game Development', 'Build a game with AI', ['gamedev', 'ai'])
      ).toBe('Game Development');
    });

    test('Mobile Development has priority over Design/UI/UX', () => {
      expect(
        inferCategory('Platform', 'Mobile UI Design', 'Design mobile app interface', ['mobile', 'ui'])
      ).toBe('Mobile Development');
    });

    test('AI/Data Science has priority over Hackathons', () => {
      expect(
        inferCategory('Kaggle', 'Data Science Hackathon', 'ML competition', ['hackathon', 'data'])
      ).toBe('AI/Data Science');
    });
  });

  describe('inferCategory - tags as string', () => {
    test('handles tags as string instead of array', () => {
      expect(inferCategory('', '', '', 'web3 blockchain')).toBe('Web3/Blockchain');
    });

    test('handles tags as comma-separated string', () => {
      expect(inferCategory('', '', '', 'mobile,android,ios')).toBe('Mobile Development');
    });
  });

  describe('inferCategory - multiple text sources', () => {
    test('combines platform, title, description, and tags for analysis', () => {
      expect(
        inferCategory(
          'Custom Platform',
          'Annual Competition',
          'Build innovative solutions',
          ['blockchain', 'smart contract']
        )
      ).toBe('Web3/Blockchain');
    });

    test('finds keywords across different text sources', () => {
      expect(
        inferCategory('Platform', 'Design Challenge', 'Create prototypes', ['figma', 'ui'])
      ).toBe('Design/UI/UX');
    });
  });

  describe('inferCategory - edge cases', () => {
    test('handles null inputs gracefully', () => {
      expect(inferCategory(null, null, null, null)).toBe('Other');
    });

    test('handles undefined inputs gracefully', () => {
      expect(inferCategory(undefined, undefined, undefined, undefined)).toBe('Other');
    });

    test('handles empty string inputs', () => {
      expect(inferCategory('', '', '', '')).toBe('Other');
    });

    test('handles whitespace-only inputs', () => {
      expect(inferCategory('   ', '   ', '   ', ['   '])).toBe('Other');
    });

    test('handles mixed valid and invalid inputs', () => {
      expect(inferCategory('Kaggle', null, undefined, '')).toBe('AI/Data Science');
    });
  });
});
