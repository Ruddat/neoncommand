// ====== GAME DATA & CONSTANTS ======

export const NATIONS = {
  usa: { name: 'USA', flag: '\u{1F1FA}\u{1F1F8}', color: '#3b82f6', mil: 9, eco: 8, tech: 9, money: 500, desc: 'Milit\u00e4rmacht, High-Tech', buildRate: 0.8, personality: 'aggressive' },
  eu: { name: 'Europa', flag: '\u{1F1EA}\u{1F1FA}', color: '#fbbf24', mil: 6, eco: 9, tech: 8, money: 450, desc: 'Wirtschaft, Diplomatie', buildRate: 0.9, personality: 'diplomatic' },
  russia: { name: 'Russland', flag: '\u{1F1F7}\u{1F1FA}', color: '#ef4444', mil: 8, eco: 4, tech: 5, money: 300, desc: 'Atomwaffen, rohe Gewalt', buildRate: 0.5, personality: 'aggressive' },
  china: { name: 'China', flag: '\u{1F1E8}\u{1F1F3}', color: '#dc2626', mil: 7, eco: 8, tech: 7, money: 480, desc: 'Produktion, Cyber-Krieg', buildRate: 1.0, personality: 'expansive' },
  ukraine: { name: 'Ukraine', flag: '\u{1F1FA}\u{1F1E6}', color: '#22c55e', mil: 5, eco: 3, tech: 5, money: 200, desc: 'Widerstand, Verteidigung', buildRate: 0.6, personality: 'defensive' },
};

export const MAP_POS = {
  usa: { x: 0.18, y: 0.35 },
  eu: { x: 0.47, y: 0.28 },
  russia: { x: 0.62, y: 0.22 },
  china: { x: 0.72, y: 0.38 },
  ukraine: { x: 0.53, y: 0.30 },
};

export const BLDS = {
  factory: { label: 'Fabrik', key: '1', cost: 60, color: '#fbbf24', symbol: '$', desc: '+15$/s' },
  milbase: { label: 'Milit\u00e4rbasis', key: '2', cost: 80, color: '#ef4444', symbol: 'M', desc: '+3 Mil/St\u00e4rke' },
  lab: { label: 'Forschungslab', key: '3', cost: 70, color: '#3b82f6', symbol: 'T', desc: '+2 Tech/s' },
  defense: { label: 'Abwehrsystem', key: '4', cost: 100, color: '#22c55e', symbol: 'D', desc: '+5 Verteidigung' },
  silo: { label: 'Raketensilo', key: '5', cost: 150, color: '#a855f7', symbol: 'R', desc: 'Gegenangriff' },
};

export const ALLY_MAP = {
  usa: ['eu', 'ukraine'],
  eu: ['usa', 'ukraine'],
  russia: ['china'],
  china: ['russia'],
  ukraine: ['eu', 'usa'],
};

// Win condition: survive this many rounds with 3+ allies
export const WIN_ROUNDS = 30;
export const WIN_ALLIES = 3;
