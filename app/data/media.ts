export interface Footage {
  video: string;
  poster: string;
  media: string;
}

const PHONE = '(max-width: 767px)';

// The mountain footage behind the site, also cropped into the contact page's image window.
// Phones get a portrait cut; everything wider gets the landscape one.
export const MOUNTAIN_VIDEO = {
  phone: { video: '/media/mountain/mobile.mp4', poster: '/media/mountain/mobile.jpg', media: PHONE },
  desktop: { video: '/media/mountain/desktop.mp4', poster: '/media/mountain/desktop.jpg', media: `not all and ${PHONE}` },
} as const satisfies Record<string, Footage>;
