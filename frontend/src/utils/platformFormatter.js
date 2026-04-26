/**
 * Platform Name Formatter
 * Converts raw platform names (e.g., "leetcode.com") to formal display names (e.g., "LeetCode")
 */

const PLATFORM_DISPLAY_NAMES = {
  // Popular platforms
  'leetcode.com': 'LeetCode',
  'codeforces.com': 'CodeForces',
  'codeforces.com/gyms': 'CodeForces Gyms',
  'codechef.com': 'CodeChef',
  'atcoder.jp': 'AtCoder',
  'hackerrank.com': 'HackerRank',
  'hackerearth.com': 'HackerEarth',
  'topcoder.com': 'TopCoder',
  'kaggle.com': 'Kaggle',
  'Kaggle': 'Kaggle',
  
  // CTF and Security
  'ctftime.org': 'CTFtime',
  
  // Chinese platforms
  'ac.nowcoder.com': 'NowCoder',
  'luogu.com.cn': 'Luogu',
  
  // Other platforms
  'geeksforgeeks.org': 'GeeksforGeeks',
  'spoj.com': 'SPOJ',
  'toph.co': 'Toph',
  'dmoj.ca': 'DMOJ',
  'open.kattis.com': 'Kattis',
  'kattis.com': 'Kattis',
  'projecteuler.net': 'Project Euler',
  'codingame.com': 'CodinGame',
  'binarysearch.com': 'Binary Search',
  
  // Contest platforms
  'cups.online': 'Cups Online',
  'codedrills.io': 'CodeDrills',
  'algoleague.com': 'AlgoLeague',
  'algotester.com': 'AlgoTester',
  'cphof.org': 'CPHOF',
  
  // Educational platforms
  'naukri.com/code360': 'Code360',
  'my.newtonschool.co': 'Newton School',
  'mycode.prepbytes.com': 'PrepBytes',
  'techgig.com': 'TechGig',
  'codility.com': 'Codility',
  
  // Regional platforms
  'basecamp.eolymp.com': 'E-Olymp',
  'robocontest.uz': 'RoboContest',
  'dl.gsu.by': 'GSU',
  'acm.bsu.by': 'BSU ACM',
  'acm.bsuir.by': 'BSUIR ACM',
  'kep.uz': 'KEP',
  'algoge.com': 'AlgoGe',
  
  // Yandex contests
  'contest.yandex.ru': 'Yandex Contest',
  'contest.yandex.ru/CYF': 'Yandex CYF',
  'yandex.com/cup': 'Yandex Cup',
  'coderun.yandex.ru': 'Yandex CodeRun',
  'russiancodecup.ru': 'Russian Code Cup',
  'russianaicup.ru': 'Russian AI Cup',
  
  // ICPC and ACM
  'icpc.global': 'ICPC',
  'icpc.global/regionals': 'ICPC Regionals',
  'nerc.itmo.ru': 'NERC ITMO',
  'nerc.itmo.ru/school': 'NERC School',
  'nerc.itmo.ru/trains': 'NERC Trains',
  'opencup.ru': 'Open Cup',
  'ucup.ac': 'Universal Cup',
  'challenge.ucup.ac': 'Universal Cup Challenge',
  
  // University contests
  'acm.timus.ru': 'Timus Online Judge',
  'acm.hdu.edu.cn': 'HDU Online Judge',
  'acm.petrsu.ru': 'PetrSU',
  'camp.icpc.petrsu.ru': 'ICPC Camp',
  'pcms.university.innopolis.ru': 'Innopolis',
  'it-edu.mipt.ru': 'MIPT',
  
  // Google competitions
  'codingcompetitions.withgoogle.com': 'Google Coding Competitions',
  
  // Facebook/Meta
  'facebook.com/hackercup': 'Meta Hacker Cup',
  
  // Other judges
  'judge.beecrowd.com': 'beecrowd',
  'uva.onlinejudge.org': 'UVa Online Judge',
  'lightoj.com': 'LightOJ',
  'cses.fi': 'CSES',
  'usaco.org': 'USACO',
  'usaco.guide': 'USACO Guide',
  'solved.ac': 'solved.ac',
  'uoj.ac': 'UOJ',
  'acmu.ru': 'ACMU',
  'acmp.ru': 'ACMP',
  'tlx.toki.id': 'TLX',
  'yukicoder.me': 'yukicoder',
  'kilonova.ro': 'Kilonova',
  
  // Special events
  'adventofcode.com': 'Advent of Code',
  'hsin.hr/coci': 'COCI',
  'potyczki.mimuw.edu.pl': 'Potyczki Algorytmiczne',
  'bubblecup.org': 'Bubble Cup',
  'deadline24.pl': 'Deadline24',
  'marathon24.com': 'Marathon24',
  'ipsc.ksp.sk': 'IPSC',
  'icfpconference.org': 'ICFP Contest',
  
  // Corporate/Startup
  'challenges.reply.com': 'Reply Challenges',
  'huawei.com': 'Huawei',
  'quora.com': 'Quora',
  'codegoda.io': 'CodeGoda',
  'highload.fun': 'Highload',
  
  // Community platforms
  'csacademy.com': 'CS Academy',
  'contests.snarknews.info': 'Snark News',
  'sort-me.org': 'Sort Me',
  'supecoder.dev': 'SupeCoder',
  'codeweekend.dev': 'Code Weekend',
  'contest.pizza': 'Contest Pizza',
  'datsteam.dev': 'DatSteam',
  'codeany.org': 'CodeAny',
  'teamscode.org': 'TeamsCode',
  'codewars.com': 'Codewars',
  'codebattle.in': 'CodeBattle',
  
  // AI/ML platforms
  'aiplanet.com': 'AI Planet',
  'aigaming.com': 'AI Gaming',
  'aicontest.dev': 'AI Contest',
  'gameaicup.com': 'Game AI Cup',
  'coliseum.ai': 'Coliseum AI',
  'competesai.com': 'CompetesAI',
  
  // Other
  'bestcoder.hdu.edu.cn': 'BestCoder',
  'contest.bioinf.me': 'Bioinformatics Contest',
  'codesprintla.uclaacm.com': 'UCLA CodeSprint',
  'calico.cs.berkeley.edu': 'Berkeley CALICO',
  'inf-open.ru': 'Inf-Open',
  'informatics.mccme.ru': 'Informatics MCCME',
  'pythoncode.club': 'Python Code Club',
  'midnightcodecup.org': 'Midnight Code Cup',
  'blackboxcup.com': 'Black Box Cup',
  'battlecode.org': 'Battlecode',
  'bot-games.fun': 'Bot Games',
  'solve.by': 'Solve.by',
  'repovive.com': 'Repovive',
  'eldarverse.com': 'Eldarverse',
  'opener.itransition.com': 'iTransition Opener',
  'constructor.university': 'Constructor University',
  'andgein.ru': 'Andgein',
  'codecracker.arhn.in': 'Code Cracker',
  'wwppc.tech': 'WWPPC',
  'cerealcodes.org': 'CerealCodes',
  'judge.eluminatis-of-lu.com': 'Eluminatis',
  'ch24.org': 'CH24',
  'mitit.org': 'MITIT',
  'lit.lhsmathcs.org': 'LHS Math CS',
  'contest.bayan.ir': 'Bayan Contest',
  'coj.uci.cu': 'Caribbean Online Judge',
  'azspcs.com': 'AZSPCS',
  'codingcontest.org': 'Coding Contest',
  'wincentdragonbyte.com': 'Wincent Dragonbyte',
  
  // Fallback for CLIST
  'CLIST': 'CLIST',
};

/**
 * Format a raw platform name to a formal display name
 * @param {string} rawPlatform - Raw platform name (e.g., "leetcode.com")
 * @returns {string} Formatted platform name (e.g., "LeetCode")
 */
export function formatPlatformName(rawPlatform) {
  if (!rawPlatform) return 'Unknown';
  
  // Check if we have a mapping
  if (PLATFORM_DISPLAY_NAMES[rawPlatform]) {
    return PLATFORM_DISPLAY_NAMES[rawPlatform];
  }
  
  // Fallback: capitalize and clean up
  // Remove .com, .org, .io, etc.
  let formatted = rawPlatform
    .replace(/\.(com|org|io|net|co|jp|cn|ru|by|uz|hr|pl|ro|ir|cu|in|me|dev|fun|tech)$/i, '')
    .replace(/^www\./, '');
  
  // Split by dots, dashes, or slashes and capitalize each part
  formatted = formatted
    .split(/[.\-\/]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  return formatted;
}

/**
 * Get all formatted platform names from a list of raw platform names
 * @param {string[]} rawPlatforms - Array of raw platform names
 * @returns {Array<{raw: string, formatted: string}>} Array of objects with raw and formatted names
 */
export function formatPlatformList(rawPlatforms) {
  return rawPlatforms.map(raw => ({
    raw,
    formatted: formatPlatformName(raw),
  }));
}
