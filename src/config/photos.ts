/**
 * Landing photography.
 *
 * Stock for now, kept in one place so swapping in real Ocean Blue photos is a
 * one-file change: drop the images in /public and point these at `/team.jpg`
 * and so on. Alt text lives here too, next to the image it describes.
 */

const PARAMS = '?auto=format&fit=crop&q=80';

export interface Photo {
  src: string;
  alt: string;
}

export const PHOTOS = {
  team: {
    src: `https://images.unsplash.com/photo-1521737604893-d14cc237f11d${PARAMS}&w=1600`,
    alt: 'Colleagues working together around a table',
  },
  meeting: {
    src: `https://images.unsplash.com/photo-1600880292203-757bb62b4baf${PARAMS}&w=1200`,
    alt: 'Two colleagues talking through work at a desk',
  },
  working: {
    src: `https://images.unsplash.com/photo-1556761175-b413da4baf72${PARAMS}&w=1200`,
    alt: 'A team at work in an open office',
  },
  discussion: {
    src: `https://images.unsplash.com/photo-1551836022-d5d88e9218df${PARAMS}&w=1600`,
    alt: 'A group in discussion during a project review',
  },
  office: {
    src: `https://images.unsplash.com/photo-1497215728101-856f4ea42174${PARAMS}&w=1200`,
    alt: 'The office floor on a working day',
  },
} as const satisfies Record<string, Photo>;
