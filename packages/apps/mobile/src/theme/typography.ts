export const headingFont = 'DMSerifDisplay_400Regular';

export const typography = {
  heading: {
    fontFamily: headingFont,
    // DM Serif Display has a regular face; avoid synthesized bold on native.
    fontWeight: '400',
    letterSpacing: 0,
  },
} as const;
