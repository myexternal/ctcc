// Ceylon Tampere CC: settings for the kit order and membership forms.
// This is the only file the club needs to edit. See SETUP.md.

export const CONFIG = {
  // Paste the Google Apps Script web app URL here (ends in /exec).
  // While it's empty, both forms run in DEMO MODE: nothing is sent anywhere,
  // entries are kept only in the visitor's own browser, and a banner says so.
  SCRIPT_URL: '',

  // Set to true once the committee has agreed the prices and fees below.
  // While false, the pages show "Example prices, to be confirmed".
  PRICES_CONFIRMED: false,

  season: 2027,
  currency: '€',

  kit: {
    numberMin: 1,
    numberMax: 99,
    // Numbers nobody can reserve (retired, kept for the club). Example: [10, 99]
    blocked: [],
    nameMaxLength: 12,
    maxQuantity: 5,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    // id must stay the same once orders exist. Prices are examples.
    items: [
      { id: 'shirt',    name: 'Playing shirt',   note: 'Short sleeve, with your number and name', price: 35, sizes: true, numbered: true },
      { id: 'shirt_ls', name: 'Playing shirt, long sleeve', note: 'For cold April and September games', price: 40, sizes: true, numbered: true },
      { id: 'trousers', name: 'Playing trousers', note: '', price: 30, sizes: true },
      { id: 'cap',      name: 'Cap',              note: 'One size', price: 15, sizes: false },
      { id: 'training', name: 'Training T-shirt', note: '', price: 20, sizes: true },
    ],
  },

  membership: {
    // id must stay the same once members exist. Fees are examples.
    tiers: [
      { id: 'player',    name: 'Playing member', fee: 120, note: 'Practice from January and selection for league matches.' },
      { id: 'student',   name: 'Student player', fee: 80,  note: 'The same as a playing member, with a valid student card.' },
      { id: 'supporter', name: 'Supporter',      fee: 25,  note: "You don't play, but you're part of the club and its events." },
    ],
  },

  // How people pay. Leave a value empty to hide that option.
  payment: {
    bank: {
      recipient: '',   // e.g. 'Ceylon Tampere Cricket Club ry'
      iban: '',        // e.g. 'FI00 0000 0000 0000 00'
      bic: '',
    },
    mobilepay: {
      number: '',      // MobilePay number or box code
    },
    // Stripe Payment Links (card, Apple Pay, Google Pay), one per membership tier.
    // The page adds the member ID and email to the link so the payment can be matched.
    stripe: {
      player: '',
      student: '',
      supporter: '',
    },
    dueDays: 14,
  },

  contactEmail: 'ceylontamperecricket@gmail.com',
};
