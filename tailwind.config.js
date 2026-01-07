// tailwind.config.js
module.exports = {
  content: [
    "./layout/**/*.liquid",
    "./templates/**/*.liquid",
    "./sections/**/*.liquid",
    "./snippets/**/*.liquid",
    "./assets/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["var(--font-body)"],
        heading: ["var(--font-heading)"],
      },

      colors: {
        // legacy (ok to keep)
        bg: "rgb(var(--color-background-rgb) / <alpha-value>)",
        fg: "rgb(var(--color-foreground-rgb) / <alpha-value>)",

        // brand tokens
        page: "rgb(var(--ggms-page-bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--ggms-surface-rgb) / <alpha-value>)",
        border: "rgb(var(--ggms-border-rgb) / <alpha-value>)",
        text: "rgb(var(--ggms-text-rgb) / <alpha-value>)",
        muted: "rgb(var(--ggms-text-muted-rgb) / <alpha-value>)",
        link: "rgb(var(--ggms-link-rgb) / <alpha-value>)",
        "link-hover": "rgb(var(--ggms-link-hover-rgb) / <alpha-value>)",
        "button-hover": "rgb(var(--ggms-button-hover-rgb) / <alpha-value>)",
        "base-icon": "rgb(var(--ggms-base-icon) / <alpha-value>)",

        // overlays + statuses
        overlay: "rgb(var(--overlay-rgb) / <alpha-value>)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        warning: "rgb(var(--warning-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",

        brand: {
          blue: "rgb(var(--ggms-brand-blue-rgb) / <alpha-value>)",
          burgundy: "rgb(var(--ggms-brand-burgundy-rgb) / <alpha-value>)",
        },
      },

      borderRadius: {
        input: "var(--radius-input)",
      },

      maxWidth: {
        page: "var(--page-width)",
      },

      zIndex: {
        base: "var(--z-base)",
        header: "var(--z-header)",
        dropdown: "var(--z-dropdown)",
        overlay: "var(--z-overlay)",
        drawer: "var(--z-drawer)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        interior: "var(--shadow-interior)",
      },

      screens: {
        xs: "450px",
        "2xs": "320px",
      },

      listStyleType: {
        square: "square",
        circle: "circle",
        roman: "upper-roman",
      },

      transitionDuration: {
        main: "0.5s",
      },
      spacing: {
        // ergonomic spacing tokens (won't override Tailwind defaults)
        "gg-1": "var(--space-1)",
        "gg-2": "var(--space-2)",
        "gg-3": "var(--space-3)",
        "gg-4": "var(--space-4)",
        "gg-5": "var(--space-5)",
        "gg-6": "var(--space-6)",
        "gg-8": "var(--space-8)",
        "gg-10": "var(--space-10)",
        "gg-12": "var(--space-12)",
        "gg-16": "var(--space-16)",

        gutter: "var(--page-margin)",
        "section-tight": "var(--section-py-tight)",
        "section": "var(--section-py-normal)",
        "section-loose": "var(--section-py-loose)",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        card: "var(--radius-card)",
        popover: "var(--radius-popover)",
        input: "var(--radius-input)", // keep yours
      },

      borderWidth: {
        1: "var(--border-1)",
        2: "var(--border-2)",
      },

      transitionTimingFunction: {
        standard: "var(--ease-standard)",
        emphasized: "var(--ease-emphasized)",
      },

      transitionDuration: {
        fast: "var(--dur-fast)",
        normal: "var(--dur-normal)",
        slow: "var(--dur-slow)",
      },

      height: {
        header: "var(--header-h)",
        control: "var(--control-h)",
        "control-sm": "var(--control-h-sm)",
        "control-lg": "var(--control-h-lg)",
      },
    },
  },
  plugins: [],
};
