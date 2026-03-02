export interface ThemeDefinition {
  id: string;
  name: string;
  isDark: boolean;
  colors: Record<string, string>;
}

/**
 * All CSS variable names that every theme must define.
 */
export const THEME_VARIABLES = [
  'radius',
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'border',
  'input',
  'ring',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'sidebar',
  'sidebar-foreground',
  'sidebar-primary',
  'sidebar-primary-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'sidebar-ring',
] as const;

export type ThemeVariable = (typeof THEME_VARIABLES)[number];

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

const defaultLight: ThemeDefinition = {
  id: 'default-light',
  name: 'Default Light',
  isDark: false,
  colors: {
    radius: '0.625rem',
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.145 0 0)',
    card: 'oklch(1 0 0)',
    'card-foreground': 'oklch(0.145 0 0)',
    popover: 'oklch(1 0 0)',
    'popover-foreground': 'oklch(0.145 0 0)',
    primary: 'oklch(0.205 0 0)',
    'primary-foreground': 'oklch(0.985 0 0)',
    secondary: 'oklch(0.97 0 0)',
    'secondary-foreground': 'oklch(0.205 0 0)',
    muted: 'oklch(0.97 0 0)',
    'muted-foreground': 'oklch(0.556 0 0)',
    accent: 'oklch(0.97 0 0)',
    'accent-foreground': 'oklch(0.205 0 0)',
    destructive: 'oklch(0.577 0.245 27.325)',
    border: 'oklch(0.922 0 0)',
    input: 'oklch(0.922 0 0)',
    ring: 'oklch(0.708 0 0)',
    'chart-1': 'oklch(0.646 0.222 41.116)',
    'chart-2': 'oklch(0.6 0.118 184.704)',
    'chart-3': 'oklch(0.398 0.07 227.392)',
    'chart-4': 'oklch(0.828 0.189 84.429)',
    'chart-5': 'oklch(0.769 0.188 70.08)',
    sidebar: 'oklch(0.985 0 0)',
    'sidebar-foreground': 'oklch(0.145 0 0)',
    'sidebar-primary': 'oklch(0.205 0 0)',
    'sidebar-primary-foreground': 'oklch(0.985 0 0)',
    'sidebar-accent': 'oklch(0.97 0 0)',
    'sidebar-accent-foreground': 'oklch(0.205 0 0)',
    'sidebar-border': 'oklch(0.922 0 0)',
    'sidebar-ring': 'oklch(0.708 0 0)',
  },
};

const defaultDark: ThemeDefinition = {
  id: 'default-dark',
  name: 'Default Dark',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: 'oklch(0.145 0 0)',
    foreground: 'oklch(0.985 0 0)',
    card: 'oklch(0.205 0 0)',
    'card-foreground': 'oklch(0.985 0 0)',
    popover: 'oklch(0.205 0 0)',
    'popover-foreground': 'oklch(0.985 0 0)',
    primary: 'oklch(0.922 0 0)',
    'primary-foreground': 'oklch(0.205 0 0)',
    secondary: 'oklch(0.269 0 0)',
    'secondary-foreground': 'oklch(0.985 0 0)',
    muted: 'oklch(0.269 0 0)',
    'muted-foreground': 'oklch(0.708 0 0)',
    accent: 'oklch(0.269 0 0)',
    'accent-foreground': 'oklch(0.985 0 0)',
    destructive: 'oklch(0.704 0.191 22.216)',
    border: 'oklch(1 0 0 / 10%)',
    input: 'oklch(1 0 0 / 15%)',
    ring: 'oklch(0.556 0 0)',
    'chart-1': 'oklch(0.488 0.243 264.376)',
    'chart-2': 'oklch(0.696 0.17 162.48)',
    'chart-3': 'oklch(0.769 0.188 70.08)',
    'chart-4': 'oklch(0.627 0.265 303.9)',
    'chart-5': 'oklch(0.645 0.246 16.439)',
    sidebar: 'oklch(0.205 0 0)',
    'sidebar-foreground': 'oklch(0.985 0 0)',
    'sidebar-primary': 'oklch(0.488 0.243 264.376)',
    'sidebar-primary-foreground': 'oklch(0.985 0 0)',
    'sidebar-accent': 'oklch(0.269 0 0)',
    'sidebar-accent-foreground': 'oklch(0.985 0 0)',
    'sidebar-border': 'oklch(1 0 0 / 10%)',
    'sidebar-ring': 'oklch(0.556 0 0)',
  },
};

// Solarized palette (Ethan Schoonover):
// base03 #002b36, base02 #073642, base01 #586e75, base00 #657b83
// base0 #839496, base1 #93a1a1, base2 #eee8d5, base3 #fdf6e3
// yellow #b58900, orange #cb4b16, red #dc322f, magenta #d33682
// violet #6c71c4, blue #268bd2, cyan #2aa198, green #859900
const solarizedLight: ThemeDefinition = {
  id: 'solarized-light',
  name: 'Solarized Light',
  isDark: false,
  colors: {
    radius: '0.625rem',
    background: '#fdf6e3', // base3
    foreground: '#657b83', // base00
    card: '#eee8d5', // base2
    'card-foreground': '#657b83', // base00
    popover: '#fdf6e3', // base3
    'popover-foreground': '#657b83', // base00
    primary: '#268bd2', // blue
    'primary-foreground': '#fdf6e3', // base3
    secondary: '#eee8d5', // base2
    'secondary-foreground': '#586e75', // base01
    muted: '#eee8d5', // base2
    'muted-foreground': '#93a1a1', // base1
    accent: '#2aa198', // cyan
    'accent-foreground': '#fdf6e3', // base3
    destructive: '#dc322f', // red
    border: '#93a1a1', // base1
    input: '#93a1a1', // base1
    ring: '#268bd2', // blue
    'chart-1': '#268bd2', // blue
    'chart-2': '#2aa198', // cyan
    'chart-3': '#859900', // green
    'chart-4': '#b58900', // yellow
    'chart-5': '#d33682', // magenta
    sidebar: '#eee8d5', // base2
    'sidebar-foreground': '#657b83', // base00
    'sidebar-primary': '#268bd2', // blue
    'sidebar-primary-foreground': '#fdf6e3', // base3
    'sidebar-accent': '#fdf6e3', // base3
    'sidebar-accent-foreground': '#586e75', // base01
    'sidebar-border': '#93a1a1', // base1
    'sidebar-ring': '#268bd2', // blue
  },
};

const solarizedDark: ThemeDefinition = {
  id: 'solarized-dark',
  name: 'Solarized Dark',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#002b36', // base03
    foreground: '#839496', // base0
    card: '#073642', // base02
    'card-foreground': '#839496', // base0
    popover: '#073642', // base02
    'popover-foreground': '#839496', // base0
    primary: '#268bd2', // blue
    'primary-foreground': '#fdf6e3', // base3
    secondary: '#073642', // base02
    'secondary-foreground': '#93a1a1', // base1
    muted: '#073642', // base02
    'muted-foreground': '#586e75', // base01
    accent: '#2aa198', // cyan
    'accent-foreground': '#fdf6e3', // base3
    destructive: '#dc322f', // red
    border: '#586e75', // base01
    input: '#586e75', // base01
    ring: '#268bd2', // blue
    'chart-1': '#268bd2', // blue
    'chart-2': '#2aa198', // cyan
    'chart-3': '#859900', // green
    'chart-4': '#b58900', // yellow
    'chart-5': '#d33682', // magenta
    sidebar: '#073642', // base02
    'sidebar-foreground': '#839496', // base0
    'sidebar-primary': '#268bd2', // blue
    'sidebar-primary-foreground': '#fdf6e3', // base3
    'sidebar-accent': '#002b36', // base03
    'sidebar-accent-foreground': '#93a1a1', // base1
    'sidebar-border': '#586e75', // base01
    'sidebar-ring': '#268bd2', // blue
  },
};

// Monokai palette (Wimer Hazenberg):
// bg #272822, fg #f8f8f2
// pink #f92672, green #a6e22e, yellow #e6db74
// orange #fd971f, purple #ae81ff, blue #66d9ef
const monokai: ThemeDefinition = {
  id: 'monokai',
  name: 'Monokai',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#272822', // bg
    foreground: '#f8f8f2', // fg
    card: '#3e3d32', // lighter bg
    'card-foreground': '#f8f8f2',
    popover: '#3e3d32',
    'popover-foreground': '#f8f8f2',
    primary: '#a6e22e', // green
    'primary-foreground': '#272822',
    secondary: '#3e3d32',
    'secondary-foreground': '#f8f8f2',
    muted: '#3e3d32',
    'muted-foreground': '#75715e', // comments color
    accent: '#66d9ef', // blue
    'accent-foreground': '#272822',
    destructive: '#f92672', // pink
    border: '#75715e',
    input: '#75715e',
    ring: '#a6e22e', // green
    'chart-1': '#f92672', // pink
    'chart-2': '#a6e22e', // green
    'chart-3': '#e6db74', // yellow
    'chart-4': '#66d9ef', // blue
    'chart-5': '#ae81ff', // purple
    sidebar: '#1e1f1c', // darker bg
    'sidebar-foreground': '#f8f8f2',
    'sidebar-primary': '#a6e22e',
    'sidebar-primary-foreground': '#272822',
    'sidebar-accent': '#3e3d32',
    'sidebar-accent-foreground': '#f8f8f2',
    'sidebar-border': '#75715e',
    'sidebar-ring': '#a6e22e',
  },
};

// Monokai Light - light variant inspired by Monokai Pro Light
const monokaiLight: ThemeDefinition = {
  id: 'monokai-light',
  name: 'Monokai Light',
  isDark: false,
  colors: {
    radius: '0.625rem',
    background: '#fafafa',
    foreground: '#49483e',
    card: '#f0f0e8',
    'card-foreground': '#49483e',
    popover: '#fafafa',
    'popover-foreground': '#49483e',
    primary: '#7a8600', // green darkened for light bg
    'primary-foreground': '#fafafa',
    secondary: '#f0f0e8',
    'secondary-foreground': '#49483e',
    muted: '#f0f0e8',
    'muted-foreground': '#9e9d8f',
    accent: '#0095a8', // blue/cyan darkened
    'accent-foreground': '#fafafa',
    destructive: '#f92672',
    border: '#d8d8d0',
    input: '#d8d8d0',
    ring: '#7a8600',
    'chart-1': '#f92672',
    'chart-2': '#7a8600',
    'chart-3': '#c49700',
    'chart-4': '#0095a8',
    'chart-5': '#7b59c0',
    sidebar: '#f0f0e8',
    'sidebar-foreground': '#49483e',
    'sidebar-primary': '#7a8600',
    'sidebar-primary-foreground': '#fafafa',
    'sidebar-accent': '#fafafa',
    'sidebar-accent-foreground': '#49483e',
    'sidebar-border': '#d8d8d0',
    'sidebar-ring': '#7a8600',
  },
};

// Nord palette (Arctic Ice Studio):
// Polar Night: nord0 #2e3440, nord1 #3b4252, nord2 #434c5e, nord3 #4c566a
// Snow Storm: nord4 #d8dee9, nord5 #e5e9f0, nord6 #eceff4
// Frost: nord7 #8fbcbb, nord8 #88c0d0, nord9 #81a1c1, nord10 #5e81ac
// Aurora: nord11 #bf616a, nord12 #d08770, nord13 #ebcb8b, nord14 #a3be8c, nord15 #b48ead
const nord: ThemeDefinition = {
  id: 'nord',
  name: 'Nord',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#2e3440', // nord0
    foreground: '#eceff4', // nord6
    card: '#3b4252', // nord1
    'card-foreground': '#eceff4', // nord6
    popover: '#3b4252', // nord1
    'popover-foreground': '#eceff4', // nord6
    primary: '#88c0d0', // nord8
    'primary-foreground': '#2e3440', // nord0
    secondary: '#434c5e', // nord2
    'secondary-foreground': '#d8dee9', // nord4
    muted: '#434c5e', // nord2
    'muted-foreground': '#d8dee9', // nord4
    accent: '#81a1c1', // nord9
    'accent-foreground': '#eceff4', // nord6
    destructive: '#bf616a', // nord11
    border: '#4c566a', // nord3
    input: '#4c566a', // nord3
    ring: '#88c0d0', // nord8
    'chart-1': '#88c0d0', // nord8
    'chart-2': '#a3be8c', // nord14
    'chart-3': '#ebcb8b', // nord13
    'chart-4': '#d08770', // nord12
    'chart-5': '#b48ead', // nord15
    sidebar: '#3b4252', // nord1
    'sidebar-foreground': '#eceff4', // nord6
    'sidebar-primary': '#88c0d0', // nord8
    'sidebar-primary-foreground': '#2e3440', // nord0
    'sidebar-accent': '#434c5e', // nord2
    'sidebar-accent-foreground': '#d8dee9', // nord4
    'sidebar-border': '#4c566a', // nord3
    'sidebar-ring': '#88c0d0', // nord8
  },
};

// Dracula palette (Zeno Rocha):
// bg #282a36, current line #44475a, fg #f8f8f2, comment #6272a4
// cyan #8be9fd, green #50fa7b, orange #ffb86c, pink #ff79c6
// purple #bd93f9, red #ff5555, yellow #f1fa8c
const dracula: ThemeDefinition = {
  id: 'dracula',
  name: 'Dracula',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#282a36', // bg
    foreground: '#f8f8f2', // fg
    card: '#44475a', // current line
    'card-foreground': '#f8f8f2',
    popover: '#44475a',
    'popover-foreground': '#f8f8f2',
    primary: '#bd93f9', // purple
    'primary-foreground': '#282a36',
    secondary: '#44475a', // current line
    'secondary-foreground': '#f8f8f2',
    muted: '#44475a',
    'muted-foreground': '#6272a4', // comment
    accent: '#ff79c6', // pink
    'accent-foreground': '#282a36',
    destructive: '#ff5555', // red
    border: '#6272a4', // comment
    input: '#6272a4',
    ring: '#bd93f9', // purple
    'chart-1': '#bd93f9', // purple
    'chart-2': '#50fa7b', // green
    'chart-3': '#f1fa8c', // yellow
    'chart-4': '#8be9fd', // cyan
    'chart-5': '#ff79c6', // pink
    sidebar: '#21222c', // darker bg
    'sidebar-foreground': '#f8f8f2',
    'sidebar-primary': '#bd93f9',
    'sidebar-primary-foreground': '#282a36',
    'sidebar-accent': '#44475a',
    'sidebar-accent-foreground': '#f8f8f2',
    'sidebar-border': '#6272a4',
    'sidebar-ring': '#bd93f9',
  },
};

// Catppuccin Mocha palette:
// base #1e1e2e, mantle #181825, crust #11111b
// surface0 #313244, surface1 #45475a, surface2 #585b70
// overlay0 #6c7086, overlay1 #7f849c, overlay2 #9399b2
// text #cdd6f4, subtext0 #a6adc8, subtext1 #bac2de
// rosewater #f5e0dc, flamingo #f2cdcd, pink #f5c2e7
// mauve #cba6f7, red #f38ba8, maroon #eba0ac
// peach #fab387, yellow #f9e2af, green #a6e3a1
// teal #94e2d5, sky #89dceb, sapphire #74c7ec
// blue #89b4fa, lavender #b4befe
const catppuccinMocha: ThemeDefinition = {
  id: 'catppuccin-mocha',
  name: 'Catppuccin Mocha',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#1e1e2e', // base
    foreground: '#cdd6f4', // text
    card: '#313244', // surface0
    'card-foreground': '#cdd6f4', // text
    popover: '#313244', // surface0
    'popover-foreground': '#cdd6f4', // text
    primary: '#cba6f7', // mauve
    'primary-foreground': '#1e1e2e', // base
    secondary: '#313244', // surface0
    'secondary-foreground': '#cdd6f4', // text
    muted: '#45475a', // surface1
    'muted-foreground': '#a6adc8', // subtext0
    accent: '#f5c2e7', // pink
    'accent-foreground': '#1e1e2e', // base
    destructive: '#f38ba8', // red
    border: '#45475a', // surface1
    input: '#45475a', // surface1
    ring: '#cba6f7', // mauve
    'chart-1': '#cba6f7', // mauve
    'chart-2': '#a6e3a1', // green
    'chart-3': '#f9e2af', // yellow
    'chart-4': '#89b4fa', // blue
    'chart-5': '#fab387', // peach
    sidebar: '#181825', // mantle
    'sidebar-foreground': '#cdd6f4', // text
    'sidebar-primary': '#cba6f7', // mauve
    'sidebar-primary-foreground': '#1e1e2e', // base
    'sidebar-accent': '#313244', // surface0
    'sidebar-accent-foreground': '#cdd6f4', // text
    'sidebar-border': '#45475a', // surface1
    'sidebar-ring': '#cba6f7', // mauve
  },
};

// Gruvbox Dark palette (Pavel Pertsev):
// bg #282828, bg1 #3c3836, bg2 #504945, bg3 #665c54, bg4 #7c6f64
// fg #ebdbb2, fg2 #d5c4a1, fg3 #bdae93, fg4 #a89984
// red #fb4934, green #b8bb26, yellow #fabd2f
// blue #83a598, purple #d3869b, aqua #8ec07c, orange #fe8019
// gray #928374
const gruvboxDark: ThemeDefinition = {
  id: 'gruvbox-dark',
  name: 'Gruvbox Dark',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#282828', // bg
    foreground: '#ebdbb2', // fg
    card: '#3c3836', // bg1
    'card-foreground': '#ebdbb2', // fg
    popover: '#3c3836', // bg1
    'popover-foreground': '#ebdbb2', // fg
    primary: '#fabd2f', // yellow
    'primary-foreground': '#282828', // bg
    secondary: '#3c3836', // bg1
    'secondary-foreground': '#ebdbb2', // fg
    muted: '#504945', // bg2
    'muted-foreground': '#a89984', // fg4
    accent: '#83a598', // blue
    'accent-foreground': '#282828', // bg
    destructive: '#fb4934', // red
    border: '#504945', // bg2
    input: '#504945', // bg2
    ring: '#fabd2f', // yellow
    'chart-1': '#fb4934', // red
    'chart-2': '#b8bb26', // green
    'chart-3': '#fabd2f', // yellow
    'chart-4': '#83a598', // blue
    'chart-5': '#d3869b', // purple
    sidebar: '#1d2021', // bg0_h (hard contrast bg)
    'sidebar-foreground': '#ebdbb2', // fg
    'sidebar-primary': '#fabd2f', // yellow
    'sidebar-primary-foreground': '#282828',
    'sidebar-accent': '#3c3836', // bg1
    'sidebar-accent-foreground': '#ebdbb2',
    'sidebar-border': '#504945', // bg2
    'sidebar-ring': '#fabd2f',
  },
};

// Tokyo Night palette (Enkia):
// bg #1a1b26, bg_dark #16161e, bg_highlight #292e42
// terminal_black #414868, fg #c0caf5, fg_dark #a9b1d6, fg_gutter #3b4261
// dark3 #545c7e, comment #565f89, dark5 #737aa2
// blue #7aa2f7, cyan #7dcfff, blue1 #2ac3de, blue5 #89ddff
// magenta #bb9af7, magenta2 #ff007c, purple #9d7cd8
// orange #ff9e64, yellow #e0af68, green #9ece6a, green1 #73daca
// teal #1abc9c, red #f7768e, red1 #db4b4b
const tokyoNight: ThemeDefinition = {
  id: 'tokyo-night',
  name: 'Tokyo Night',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#1a1b26', // bg
    foreground: '#c0caf5', // fg
    card: '#292e42', // bg_highlight
    'card-foreground': '#c0caf5',
    popover: '#292e42',
    'popover-foreground': '#c0caf5',
    primary: '#7aa2f7', // blue
    'primary-foreground': '#1a1b26',
    secondary: '#292e42', // bg_highlight
    'secondary-foreground': '#c0caf5',
    muted: '#292e42',
    'muted-foreground': '#565f89', // comment
    accent: '#bb9af7', // magenta
    'accent-foreground': '#1a1b26',
    destructive: '#f7768e', // red
    border: '#3b4261', // fg_gutter
    input: '#3b4261',
    ring: '#7aa2f7', // blue
    'chart-1': '#7aa2f7', // blue
    'chart-2': '#9ece6a', // green
    'chart-3': '#e0af68', // yellow
    'chart-4': '#7dcfff', // cyan
    'chart-5': '#bb9af7', // magenta
    sidebar: '#16161e', // bg_dark
    'sidebar-foreground': '#c0caf5',
    'sidebar-primary': '#7aa2f7',
    'sidebar-primary-foreground': '#1a1b26',
    'sidebar-accent': '#292e42',
    'sidebar-accent-foreground': '#c0caf5',
    'sidebar-border': '#3b4261',
    'sidebar-ring': '#7aa2f7',
  },
};

// One Dark palette (Atom):
// bg #282c34, gutter #4b5263, fg #abb2bf
// mono-1 #abb2bf, mono-2 #828997, mono-3 #5c6370
// hue-1 cyan #56b6c2, hue-2 blue #61afef, hue-3 purple #c678dd
// hue-4 green #98c379, hue-5 red1 #e06c75, hue-5-2 red2 #be5046
// hue-6 orange #d19a66, hue-6-2 yellow #e5c07b
const oneDark: ThemeDefinition = {
  id: 'one-dark',
  name: 'One Dark',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#282c34', // bg
    foreground: '#abb2bf', // fg mono-1
    card: '#2c313a',
    'card-foreground': '#abb2bf',
    popover: '#2c313a',
    'popover-foreground': '#abb2bf',
    primary: '#61afef', // blue hue-2
    'primary-foreground': '#282c34',
    secondary: '#2c313a',
    'secondary-foreground': '#abb2bf',
    muted: '#2c313a',
    'muted-foreground': '#5c6370', // mono-3
    accent: '#c678dd', // purple hue-3
    'accent-foreground': '#282c34',
    destructive: '#e06c75', // red hue-5
    border: '#4b5263', // gutter
    input: '#4b5263',
    ring: '#61afef', // blue
    'chart-1': '#61afef', // blue
    'chart-2': '#98c379', // green
    'chart-3': '#e5c07b', // yellow
    'chart-4': '#56b6c2', // cyan
    'chart-5': '#c678dd', // purple
    sidebar: '#21252b',
    'sidebar-foreground': '#abb2bf',
    'sidebar-primary': '#61afef',
    'sidebar-primary-foreground': '#282c34',
    'sidebar-accent': '#2c313a',
    'sidebar-accent-foreground': '#abb2bf',
    'sidebar-border': '#4b5263',
    'sidebar-ring': '#61afef',
  },
};

// Rose Pine palette (Rose Pine):
// base #191724, surface #1f1d2e, overlay #26233a
// muted #6e6a86, subtle #908caa, text #e0def4
// love #eb6f92, gold #f6c177, rose #ebbcba
// pine #31748f, foam #9ccfd8, iris #c4a7e7
// highlight-low #21202e, highlight-med #403d52, highlight-high #524f67
const rosePine: ThemeDefinition = {
  id: 'rose-pine',
  name: 'Rose Pine',
  isDark: true,
  colors: {
    radius: '0.625rem',
    background: '#191724', // base
    foreground: '#e0def4', // text
    card: '#1f1d2e', // surface
    'card-foreground': '#e0def4', // text
    popover: '#1f1d2e', // surface
    'popover-foreground': '#e0def4', // text
    primary: '#c4a7e7', // iris
    'primary-foreground': '#191724', // base
    secondary: '#26233a', // overlay
    'secondary-foreground': '#e0def4', // text
    muted: '#26233a', // overlay
    'muted-foreground': '#6e6a86', // muted
    accent: '#ebbcba', // rose
    'accent-foreground': '#191724', // base
    destructive: '#eb6f92', // love
    border: '#403d52', // highlight-med
    input: '#403d52', // highlight-med
    ring: '#c4a7e7', // iris
    'chart-1': '#c4a7e7', // iris
    'chart-2': '#9ccfd8', // foam
    'chart-3': '#f6c177', // gold
    'chart-4': '#ebbcba', // rose
    'chart-5': '#31748f', // pine
    sidebar: '#191724', // base (same, RP doesn't have a darker shade)
    'sidebar-foreground': '#e0def4', // text
    'sidebar-primary': '#c4a7e7', // iris
    'sidebar-primary-foreground': '#191724',
    'sidebar-accent': '#26233a', // overlay
    'sidebar-accent-foreground': '#e0def4',
    'sidebar-border': '#403d52', // highlight-med
    'sidebar-ring': '#c4a7e7', // iris
  },
};

export const themes: ThemeDefinition[] = [
  defaultLight,
  defaultDark,
  solarizedLight,
  solarizedDark,
  monokai,
  monokaiLight,
  nord,
  dracula,
  catppuccinMocha,
  gruvboxDark,
  tokyoNight,
  oneDark,
  rosePine,
];

/**
 * Get a theme by its ID. Returns undefined if not found.
 */
export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id);
}

/**
 * Resolve a theme ID, handling the special "system" value.
 * Returns the resolved ThemeDefinition.
 */
export function resolveTheme(themeId: string, systemPrefersDark: boolean): ThemeDefinition {
  if (themeId === 'system') {
    return systemPrefersDark ? defaultDark : defaultLight;
  }
  return getThemeById(themeId) ?? defaultDark;
}
