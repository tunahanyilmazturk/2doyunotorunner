// Canvas yazıları için ortak yazı tipi yığını (index.html'de Google Fonts ile yüklenir).
export const PIXEL_FONT = '"Pixelify Sans", "Trebuchet MS", system-ui, sans-serif';

export const font = (size, weight = 700) => `${weight} ${size}px ${PIXEL_FONT}`;
