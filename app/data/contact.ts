// Contact page copy and form rules, mirroring the Figma contact frame and interaction states F2 / G.
export const CONTACT = {
  metaDescription:
    'Get in touch with The CB Creative about a new website, a refresh, or a landing page. Based in Snoqualmie, WA — serving the greater Seattle area and beyond.',
  intro: "Tell me about your business, your idea, or your next big step. I'll get back to you personally.",
  eyebrow: "Let's build something beautiful",
  headline: 'Contact',
  submit: "Let's talk",
  sending: 'Sending…',
  email: 'cait@thecbcreative.com',
  fields: {
    name: 'Your name',
    business: 'Your business (optional)',
    email: 'Your email',
    phone: 'Your phone (optional)',
    message: 'Your message',
    links: 'Helpful links (optional)',
    images: 'Attach images (optional)',
  },
  errors: {
    name: 'Please add your name.',
    email: 'Please add your email.',
    emailFormat: "That email address doesn't look quite right.",
    message: 'Please tell me a little about your project.',
    tooMany: 'Please attach 10 images or fewer.',
    tooLarge: 'Those images add up to more than 3.5 MB. Try fewer, or email them over directly.',
    notImage: 'Attachments need to be images (PNG, JPG or WEBP).',
    failed: 'Something went wrong sending that. Please try again, or email cait@thecbcreative.com directly.',
  },
  success: {
    eyebrow: '(Message sent)',
    headline: 'Thank you.',
    body: "I've got it! I'll personally take a look at everything you shared and get back to you within 48 hours.",
    back: 'Back to home',
  },
} as const;

// Kept in step with api/contact.mjs, which enforces the same limits server-side.
export const ATTACHMENT_LIMITS = { files: 10, bytes: 3.5 * 1024 * 1024 } as const;

// A hidden field people never fill; the API discards submissions that fill it (and ones sent too fast).
export const HONEYPOT_FIELD = 'website';
