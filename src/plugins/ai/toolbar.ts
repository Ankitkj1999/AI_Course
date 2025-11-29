export const aiToolbarItem = {
  icon: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M 100 10 C 115 60, 140 85, 190 100 C 140 115, 115 140, 100 190 C 85 140, 60 115, 10 100 C 60 85, 85 60, 100 10 Z" fill="currentColor"/></svg>`,
  active: (ctx) => false, // AI button is never "active" in the traditional sense
  onRun: (ctx) => {
    console.log("AI toolbar button activated - functionality coming soon!");
    // TODO: Implement AI menu opening logic
  },
};