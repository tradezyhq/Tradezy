/**

- TRADEZY CONTENT SCREENING ENGINE
- Based on Operating Agreement Section 1.6 — Prohibited Items
- 
- HOW IT WORKS:
- 1. Every listing title + description is scanned before going live
- 1. Every message is scanned before being sent
- 1. Violations are flagged with severity level
- 1. Auto-actions taken based on severity
- 1. All flags logged to admin panel
- 
- SEVERITY LEVELS:
- - CRITICAL: Immediate ban (drugs, weapons, adult content, animals)
- - HIGH: Listing blocked + warning (alcohol, tobacco, crypto, cash)
- - MEDIUM: Message blocked + warning (bypass attempts)
- - LOW: Flag for review (edge cases)
    */

const TradezyScan = (() => {

// ── PROHIBITED KEYWORDS BY CATEGORY ──
const BANNED = {

```
WEAPONS: {
  severity: 'CRITICAL',
  action: 'BAN',
  message: 'Your listing has been removed. Weapons and dangerous items are strictly prohibited on Tradezy. Your account has been flagged for review.',
  keywords: [
    'gun', 'guns', 'firearm', 'rifle', 'pistol', 'handgun', 'shotgun', 'revolver',
    'ammo', 'ammunition', 'bullets', 'ar-15', 'ak-47', 'glock', 'smith & wesson',
    'explosive', 'bomb', 'grenade', 'taser', 'stun gun', 'brass knuckles',
    'switchblade', 'gravity knife', 'ballistic knife', 'throwing stars',
    'silencer', 'suppressor', 'trigger', 'magazine clip', 'hollow point',
    'brass knuckle', 'nunchucks', 'pepper spray', 'mace spray',
    'weapon', 'weapons', 'tactical knife', 'combat knife', 'military knife',
  ]
},

DRUGS: {
  severity: 'CRITICAL',
  action: 'BAN_AND_REPORT',
  message: 'Your listing has been removed and your account has been permanently banned. Drug-related items are strictly prohibited on Tradezy and may be reported to law enforcement.',
  keywords: [
    'weed', 'marijuana', 'cannabis', 'thc', 'cbd oil', 'edibles', 'hash', 'hashish',
    'cocaine', 'coke', 'crack', 'heroin', 'meth', 'methamphetamine', 'crystal meth',
    'fentanyl', 'oxycontin', 'percocet', 'xanax', 'adderall', 'ritalin',
    'mdma', 'ecstasy', 'molly', 'lsd', 'acid', 'shrooms', 'mushrooms',
    'drug', 'drugs', 'narcotics', 'prescription pills', 'painkillers',
    'bong', 'pipe', 'rolling papers', 'dab rig', 'vape cartridge', 'cart',
    'dispensary', 'plug', '420', 'dank', 'loud', 'kush', 'sativa', 'indica',
  ]
},

ALCOHOL: {
  severity: 'CRITICAL',
  action: 'BAN',
  message: 'Your listing has been removed. Alcohol is strictly prohibited on Tradezy.',
  keywords: [
    'beer', 'wine', 'whiskey', 'vodka', 'rum', 'tequila', 'gin', 'bourbon',
    'scotch', 'brandy', 'champagne', 'spirits', 'liquor', 'alcohol',
    'six pack', 'case of beer', 'bottle of wine', 'craft beer', 'hard cider',
    'hard seltzer', 'white claw', 'truly', 'breweries', 'winery',
    'alcoholic', 'booze', 'hooch', 'moonshine',
  ]
},

TOBACCO: {
  severity: 'CRITICAL',
  action: 'BAN',
  message: 'Your listing has been removed. Tobacco and nicotine products are strictly prohibited on Tradezy.',
  keywords: [
    'cigarette', 'cigarettes', 'cigars', 'cigar', 'tobacco', 'nicotine',
    'vape', 'vaping', 'e-cigarette', 'juul', 'pod', 'nic', 'dip', 'chew',
    'chewing tobacco', 'snuff', 'marlboro', 'newport', 'camel cigarettes',
    'vape pen', 'vape juice', 'e-juice', 'nicotine patch', 'nicotine gum',
  ]
},

ANIMALS: {
  severity: 'CRITICAL',
  action: 'BAN',
  message: 'Your listing has been removed. Live animals of any kind are strictly prohibited on Tradezy.',
  keywords: [
    'puppy', 'puppies', 'kitten', 'kittens', 'dog for trade', 'cat for trade',
    'live animal', 'live animals', 'pet for trade', 'pets for trade',
    'rabbit', 'hamster', 'guinea pig', 'parrot', 'bird for trade',
    'reptile', 'snake', 'lizard', 'exotic animal', 'livestock',
    'chicken', 'rooster', 'goat for trade', 'pig for trade',
    'fish for trade', 'aquarium fish',
  ]
},

ADULT: {
  severity: 'CRITICAL',
  action: 'BAN',
  message: 'Your listing has been removed and your account has been permanently banned. Adult content is strictly prohibited on Tradezy.',
  keywords: [
    'porn', 'pornography', 'xxx', 'adult content', 'adult toy', 'sex toy',
    'dildo', 'vibrator', 'explicit', 'nsfw', 'onlyfans', 'nude', 'nudes',
    'adult dvd', 'adult film', 'escort', 'prostitution',
  ]
},

CASH_CRYPTO: {
  severity: 'HIGH',
  action: 'WARN_AND_REMOVE',
  message: 'Your listing has been removed. Cash, cryptocurrency, and gift cards cannot be listed as trade items on Tradezy. Platform fees are processed through Stripe only.',
  keywords: [
    'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'nft',
    'dogecoin', 'litecoin', 'binance', 'coinbase', 'wallet address',
    'gift card', 'gift cards', 'amazon gift card', 'visa gift card',
    'cash trade', 'cash only', 'physical cash', 'dollar bills',
    'money order', 'western union', 'moneygram',
  ]
},

BYPASS: {
  severity: 'MEDIUM',
  action: 'BLOCK_MESSAGE',
  message: 'Your message was blocked. Sharing contact information or payment methods outside of Tradezy violates our Terms of Service. This is your warning.',
  patterns: [
    // Phone numbers
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\(\d{3}\)\s?\d{3}[-.\s]\d{4}/,
    // Emails
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    // Payment apps
    /\b(venmo|cashapp|cash app|zelle|paypal|apple pay|google pay|chime)\b/i,
    // Social handles
    /\b(instagram|facebook|snapchat|whatsapp|telegram|signal|kik)\b/i,
    /[@]\w{2,}/,
    // Bypass phrases
    /\b(text me|call me|dm me|message me|find me on|hit me up|reach me|contact me outside|off app|off platform|outside the app)\b/i,
  ]
}
```

};

// ── SCAN A LISTING ──
function scanListing(title, description) {
const text = `${title} ${description}`.toLowerCase();
const results = [];

```
for (const [category, config] of Object.entries(BANNED)) {
  if (category === 'BYPASS') continue; // bypass is for messages only

  const keywords = config.keywords || [];
  const found = keywords.filter(kw => text.includes(kw.toLowerCase()));

  if (found.length > 0) {
    results.push({
      category,
      severity: config.severity,
      action: config.action,
      message: config.message,
      matched: found,
      timestamp: new Date().toISOString()
    });
  }
}

// Return worst severity first
results.sort((a, b) => {
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  return order[a.severity] - order[b.severity];
});

return {
  flagged: results.length > 0,
  violations: results,
  canPost: results.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH').length === 0
};
```

}

// ── SCAN A MESSAGE ──
function scanMessage(text) {
const results = [];
const bypass = BANNED.BYPASS;

```
// Check keyword patterns
for (const pattern of bypass.patterns) {
  if (pattern.test(text)) {
    results.push({
      category: 'BYPASS',
      severity: bypass.severity,
      action: bypass.action,
      message: bypass.message,
      matched: text.match(pattern)?.[0] || 'pattern match',
      timestamp: new Date().toISOString()
    });
    break; // one bypass flag is enough
  }
}

// Also check listing banned items in messages
const textLower = text.toLowerCase();
for (const [category, config] of Object.entries(BANNED)) {
  if (category === 'BYPASS') continue;
  const keywords = config.keywords || [];
  const found = keywords.filter(kw => textLower.includes(kw.toLowerCase()));
  if (found.length > 0) {
    results.push({
      category,
      severity: config.severity,
      action: config.action,
      message: config.message,
      matched: found,
      timestamp: new Date().toISOString()
    });
  }
}

return {
  flagged: results.length > 0,
  violations: results,
  canSend: results.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH' || r.severity === 'MEDIUM').length === 0
};
```

}

// ── GET USER ACTION ──
// Returns what should happen to the user based on violation
function getUserAction(violation) {
switch (violation.action) {
case ‘BAN_AND_REPORT’:
return { ban: true, report: true, warn: false, removeListng: true };
case ‘BAN’:
return { ban: true, report: false, warn: false, removeListing: true };
case ‘WARN_AND_REMOVE’:
return { ban: false, report: false, warn: true, removeListing: true };
case ‘BLOCK_MESSAGE’:
return { ban: false, report: false, warn: true, removeListing: false };
default:
return { ban: false, report: false, warn: true, removeListing: false };
}
}

// ── FORMAT FLAG FOR ADMIN ──
function formatAdminFlag(violation, context) {
return {
id: `FLAG-${Date.now()}`,
category: violation.category,
severity: violation.severity,
action: violation.action,
matched: violation.matched,
context: context, // listing title or message snippet
timestamp: violation.timestamp,
requiresReview: violation.severity === ‘CRITICAL’,
autoActioned: violation.severity !== ‘CRITICAL’ // admin must approve critical bans
};
}

// ── USER-FACING WARNING MESSAGES ──
const USER_MESSAGES = {
LISTING_BLOCKED: (category) => `
⚠️ Your listing was not posted.

```
  Tradezy does not allow listings in the "${category}" category.
  This is a violation of our Terms of Service (Section 3 — Prohibited Items).
  
  Repeated violations will result in permanent account suspension.
  
  Questions? Contact support@tradezyhq.com
`,
MESSAGE_BLOCKED: `
  ⚠️ Your message was not sent.
  
  Sharing contact information or payment methods outside of Tradezy 
  is a violation of our Terms of Service.
  
  This is your warning. Further attempts may result in account suspension.
`,
ACCOUNT_BANNED: `
  🚫 Your account has been permanently banned.
  
  Your account was found to be in violation of Tradezy's Terms of Service.
  All active listings have been removed and any pending trades have been cancelled.
  
  To appeal this decision, contact support@tradezyhq.com with subject line "Ban Appeal".
  
  — Tradezy Trust & Safety Team
`
```

};

// Public API
return {
scanListing,
scanMessage,
getUserAction,
formatAdminFlag,
USER_MESSAGES,
BANNED
};

})();

// ── EXPORT FOR USE IN ALL PAGES ──
if (typeof module !== ‘undefined’) {
module.exports = TradezyScan;
}
