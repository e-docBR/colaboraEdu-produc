import { useMemo, useState, useEffect, createContext, useContext } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from "@mui/material";

import { tokens } from "./tokens";

const buildTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.primary,
        dark: tokens.primaryDark,
        light: tokens.primaryLight
      },
      secondary: {
        main: tokens.secondary,
        dark: tokens.secondaryDark
      },
      success: {
        main: tokens.success
      },
      warning: {
        main: tokens.warning
      },
      error: {
        main: tokens.danger
      },
      info: {
        main: tokens.info
      },
      background: {
        default: mode === "light" ? tokens.slate50 : tokens.slate900,
        paper: mode === "light" ? "#ffffff" : tokens.slate800
      },
      text: {
        primary: mode === "light" ? tokens.slate900 : tokens.slate50,
        secondary: mode === "light" ? tokens.slate600 : tokens.slate400
      },
      divider: mode === "light" ? tokens.slate200 : tokens.slate700
    },
    typography: {
      fontFamily: "'Inter', 'DM Sans', 'Segoe UI', system-ui, sans-serif",
      // Dramatic Scale (1.5 ratio) for hierarchy
      h1: {
        fontWeight: 800,
        fontSize: "3rem", // 48px
        letterSpacing: "-0.03em",
        lineHeight: 1.2
      },
      h2: {
        fontWeight: 700,
        fontSize: "2rem", // 32px
        letterSpacing: "-0.02em",
        lineHeight: 1.3
      },
      h3: {
        fontWeight: 700,
        fontSize: "1.5rem", // 24px
        letterSpacing: "-0.01em",
        lineHeight: 1.4
      },
      h4: {
        fontWeight: 600,
        fontSize: "1.25rem", // 20px
        lineHeight: 1.4
      },
      h5: {
        fontWeight: 600,
        fontSize: "1.125rem", // 18px
        lineHeight: 1.5
      },
      h6: {
        fontWeight: 600,
        fontSize: "1rem", // 16px
        lineHeight: 1.5
      },
      body1: {
        fontSize: "0.9375rem", // 15px
        lineHeight: 1.6
      },
      body2: {
        fontSize: "0.875rem", // 14px
        lineHeight: 1.6
      },
      button: {
        textTransform: "none",
        fontWeight: 600,
        letterSpacing: "0.01em"
      },
      caption: {
        fontSize: "0.75rem", // 12px
        lineHeight: 1.5
      }
    },
    shape: {
      borderRadius: 2 // Sharp geometry (was 16 - too rounded!)
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 4, // Slightly softer for buttons
            padding: "10px 20px",
            fontWeight: 600
          },
          sizeLarge: {
            padding: "12px 24px",
            fontSize: "1rem"
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6, // Sharp but not harsh
            boxShadow: mode === "light"
              ? "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)"
              : "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)"
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 4
            }
          }
        }
      }
    }
  });

// Context for theme management
interface ThemeContextType {
  mode: "light" | "dark";
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Local storage key for theme preference
const THEME_STORAGE_KEY = "colaborafrei-theme-mode";

export const useAppTheme = () => {
  // Initialize from localStorage or default to light
  const [mode, setMode] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      // Check system preference
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    }
    return "light";
  });

  const theme = useMemo(() => buildTheme(mode), [mode]);

  // Persist theme preference
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  return { theme, mode, toggleTheme };
};

export const useColorMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useColorMode must be used within an AppThemeProvider");
  }
  return context;
};

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const themeManagement = useAppTheme();

  return (
    <ThemeContext.Provider value={themeManagement}>
      <MuiThemeProvider theme={themeManagement.theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

