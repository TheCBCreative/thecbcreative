// The mountain footage behind the site, also cropped into the contact page's image window.
// Phones get a 720p encode (about half the size); the browser picks the first source whose media matches.
export const MOUNTAIN_VIDEO = {
  sources: [{ src: '/media/mountain/mobile.mp4', media: '(max-width: 767px)' }, { src: '/media/mountain/desktop.mp4' }],
  poster: '/media/mountain/desktop.jpg',
} as const;
