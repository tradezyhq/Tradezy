export default async function handler(req, res) {
// Only allow POST
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { email } = req.body;

// Validate email
if (!email || !email.includes(’@’) || !email.includes(’.’)) {
return res.status(400).json({ error: ‘Invalid email address’ });
}

// These are stored securely in Vercel Environment Variables
const API_KEY = process.env.MAILCHIMP_API_KEY;
const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const DC = process.env.MAILCHIMP_DC; // us22

try {
const response = await fetch(
`https://${DC}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
{
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘Authorization’: `Bearer ${API_KEY}`
},
body: JSON.stringify({
email_address: email,
status: ‘subscribed’,
tags: [‘founding-trader’, ‘coming-soon’],
merge_fields: {
SIGNUPDATE: new Date().toISOString().split(‘T’)[0]
}
})
}
);

```
const data = await response.json();

// Already subscribed
if (response.status === 400 && data.title === 'Member Exists') {
  return res.status(200).json({ status: 'already_subscribed' });
}

if (!response.ok) {
  throw new Error(data.detail || 'Mailchimp error');
}

return res.status(200).json({ status: 'subscribed' });
```

} catch (err) {
console.error(‘Mailchimp error:’, err);
return res.status(500).json({ error: ‘Subscription failed’ });
}
}
