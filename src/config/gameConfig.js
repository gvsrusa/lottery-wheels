export const TEXAS_TWO_STEP = {
  name: 'Texas Two-Step',
  mainNumbers: {
    min: 1,
    max: 35,
    pick: 4
  },
  bonusNumber: {
    min: 1,
    max: 35,
    pick: 1,
    optional: true
  },
  wheelTypes: {
    ABBREVIATED: 'abbreviated',
    FULL: 'full',
    KEY_NUMBER: 'key_number'
  },
  guaranteeOptions: [
    { label: '2 if 3', value: '2if3', description: 'Guarantee 2 correct if 3 of your numbers are drawn', coverage: 'light' },
    { label: '3 if 4', value: '3if4', description: 'Guarantee 3 correct if 4 of your numbers are drawn', coverage: 'high' },
    { label: '2 if 4', value: '2if4', description: 'Guarantee 2 correct if 4 of your numbers are drawn', coverage: 'medium' },
    { label: '4 if 4', value: '4if4', description: 'Guarantee 4 correct if 4 of your numbers are drawn', coverage: 'maximum' },
    { label: '1 if 2', value: '1if2', description: 'Guarantee 1 correct if 2 of your numbers are drawn', coverage: 'minimal' },
    { label: '3 if 3', value: '3if3', description: 'Guarantee 3 correct if 3 of your numbers are drawn', coverage: 'high' }
  ],

  // User-configurable wheel options
  wheelOptions: {
    coverage: {
      minimal: { factor: 0.2, description: 'Minimal coverage - fewer tickets' },
      light: { factor: 0.3, description: 'Light coverage - basic guarantee' },
      medium: { factor: 0.5, description: 'Medium coverage - balanced approach' },
      high: { factor: 0.7, description: 'High coverage - strong guarantee' },
      maximum: { factor: 0.9, description: 'Maximum coverage - comprehensive' }
    },
    optimization: {
      cost: 'Minimize ticket cost',
      coverage: 'Maximize number coverage',
      balance: 'Balance cost and coverage'
    }
  },
  ticketCost: {
    base: 1.00,
    withBonus: 2.00
  }
};

export const WHEEL_SYSTEMS = {
  // Common abbreviated wheel systems for different pool sizes
  6: { combinations: 3, guarantee: '2if3' },
  7: { combinations: 7, guarantee: '2if3' },
  8: { combinations: 14, guarantee: '2if3' },
  9: { combinations: 21, guarantee: '2if3' },
  10: { combinations: 30, guarantee: '2if3' },
  12: { combinations: 66, guarantee: '2if3' },
  15: { combinations: 140, guarantee: '2if3' }
};