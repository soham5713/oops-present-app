/**
 * Standardized spacing values for consistent UI across the app
 */

export const spacing = {
    // Base spacing units
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  
    // Screen padding (consistent across screens)
    screenPadding: 16,
  
    // Border radius
    borderRadius: {
      small: 4,
      medium: 8,
      large: 16,
      xl: 24,
      full: 9999,
    },
  
    // Consistent spacing for lists
    listItem: {
      padding: 16,
      marginBottom: 8,
    },
  
    // Form element spacing
    form: {
      fieldMargin: 16,
      labelMargin: 8,
    },
  }
  
  // Shadow utility for consistent elevation
  export const createShadow = (elevation = 1) => {
    return {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: elevation * 2,
      },
      shadowOpacity: 0.1 + elevation * 0.03,
      shadowRadius: 1 + elevation * 2,
      elevation: elevation,
    }
  }
  