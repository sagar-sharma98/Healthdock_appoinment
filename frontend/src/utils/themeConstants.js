export const THEMES = [
  {
    id: 'Retro Arcade',
    name: 'Retro Arcade',
    primary: '#d946ef',
    hover: '#c026d3',
    lightBg: '#fdf4ff',
    border: '#f0abfc',
    darkText: '#fae8ff',
  },
  {
    id: 'Kodama Grove',
    name: 'Kodama Grove',
    primary: '#65a30d',
    hover: '#4d7c0f',
    lightBg: '#f7fee7',
    border: '#bef264',
    darkText: '#ecfccb',
  },
  {
    id: 'Claude',
    name: 'Claude',
    primary: '#c2410c',
    hover: '#9a3412',
    lightBg: '#fff7ed',
    border: '#fed7aa',
    darkText: '#ffedd5',
  },
  {
    id: 'Claymorphism',
    name: 'Claymorphism',
    primary: '#4f46e5',
    hover: '#4338ca',
    lightBg: '#eef2ff',
    border: '#c7d2fe',
    darkText: '#e0e7ff',
  },
  {
    id: 'Vintage Paper',
    name: 'Vintage Paper',
    primary: '#b45309',
    hover: '#92400e',
    lightBg: '#fef3c7',
    border: '#fde68a',
    darkText: '#fef3c7',
  },
  {
    id: 'Ocean Breeze',
    name: 'Ocean Breeze',
    primary: '#059669',
    hover: '#047857',
    lightBg: '#ecfdf5',
    border: '#a7f3d0',
    darkText: '#d1fae5',
  },
  {
    id: 'Candyland',
    name: 'Candyland',
    primary: '#f472b6',
    hover: '#ec4899',
    lightBg: '#fdf2f8',
    border: '#fbcfe8',
    darkText: '#fce7f3',
  },
  {
    id: 'Twitter',
    name: 'Twitter',
    primary: '#0284c7',
    hover: '#0369a1',
    lightBg: '#f0f9ff',
    border: '#bae6fd',
    darkText: '#e0f2fe',
  },
  {
    id: 'Vercel',
    name: 'Vercel',
    primary: '#18181b',
    hover: '#09090b',
    lightBg: '#f4f4f5',
    border: '#e4e4e7',
    darkText: '#fafafa',
  },
  {
    id: 'Modern Minimal',
    name: 'Modern Minimal',
    primary: '#0d9488',
    hover: '#0f766e',
    lightBg: '#f0fdfa',
    border: '#99f6e4',
    darkText: '#ccfbf1',
  },
  {
    id: 'Violet Bloom',
    name: 'Violet Bloom',
    primary: '#7c3aed',
    hover: '#6d28d9',
    lightBg: '#f5f3ff',
    border: '#ddd6fe',
    darkText: '#ede9fe',
  },
  {
    id: 'T3 Chat',
    name: 'T3 Chat',
    primary: '#9f1239',
    hover: '#881337',
    lightBg: '#fff1f2',
    border: '#fecdd3',
    darkText: '#ffe4e6',
  },
  {
    id: 'Mocha Mousse',
    name: 'Mocha Mousse',
    primary: '#8c5b36',
    hover: '#734626',
    lightBg: '#faf5f0',
    border: '#e6d3c4',
    darkText: '#f5eae1',
  },
  {
    id: 'Bubblegum',
    name: 'Bubblegum',
    primary: '#e11d48',
    hover: '#be123c',
    lightBg: '#ffe4e6',
    border: '#fecdd3',
    darkText: '#ffe4e6',
  },
  {
    id: 'Amethyst Haze',
    name: 'Amethyst Haze',
    primary: '#8b5cf6',
    hover: '#7c3aed',
    lightBg: '#faf5ff',
    border: '#e9d5ff',
    darkText: '#f3e8ff',
  },
  {
    id: 'Notebook',
    name: 'Notebook',
    primary: '#475569',
    hover: '#334155',
    lightBg: '#f8fafc',
    border: '#cbd5e1',
    darkText: '#f1f5f9',
  },
  {
    id: 'Doom 64',
    name: 'Doom 64',
    primary: '#dc2626',
    hover: '#b91c1c',
    lightBg: '#fef2f2',
    border: '#fecaca',
    darkText: '#fee2e2',
  },
  {
    id: 'Catppuccin',
    name: 'Catppuccin',
    primary: '#a855f7',
    hover: '#9333ea',
    lightBg: '#fdf4ff',
    border: '#f5d0fe',
    darkText: '#fae8ff',
  },
];

export const LOGO_SHAPES = [
  { id: 'Square', label: 'Square' },
  { id: 'Circle', label: 'Circle' },
  { id: 'Rounded', label: 'Rounded' },
  { id: 'Rectangle', label: 'Rectangle' },
];

export const COLOR_MODES = [
  { id: 'Light', label: 'Light' },
  { id: 'Dark', label: 'Dark' },
  { id: 'System', label: 'System' },
];

export const LAYOUT_STYLES = [
  { id: 'SPLIT_2_COL', label: 'Split 2-Column', desc: 'Side-by-side doctor & calendar (Cal.com style)' },
  { id: 'CENTERED_CARD', label: 'Centered Card', desc: 'Classic single card step flow' },
];

export const CORNER_RADII = [
  { id: 'Sharp', label: 'Sharp (0px)' },
  { id: 'Rounded', label: 'Rounded (16px)' },
  { id: 'Pill', label: 'Pill Curved (24px)' },
];

export const BG_STYLES = [
  { id: 'Mesh Gradient', label: 'Mesh Glow' },
  { id: 'Dot Grid', label: 'Dot Pattern' },
  { id: 'Solid', label: 'Solid Clean' },
];

export const CARD_FINISHES = [
  { id: 'Glassmorphic', label: 'Frosted Glass' },
  { id: 'Solid Clean', label: 'Solid Clean' },
];

export const BUTTON_STYLES = [
  { id: 'Solid', label: 'Solid Fill' },
  { id: 'Gradient', label: 'Theme Gradient' },
];

export function getTheme(themeName) {
  return THEMES.find(t => t.id === themeName || t.name === themeName) || THEMES[9]; // default Modern Minimal
}

