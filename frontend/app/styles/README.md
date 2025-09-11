# CSS Architecture

This directory contains the organized CSS files for the application, split from the original `globals.css` file for better maintainability and organization.

## File Structure

### Core Styles
- **`base.css`** - Global base styles including CSS variables, body, html, and fundamental element styles
- **`utilities.css`** - Utility classes for common patterns (spacing, typography, layout, etc.)

### Component-Specific Styles
- **`header.css`** - Header and navigation component styles
- **`notifications.css`** - Toast/notification component styles

### Page-Specific Styles
- **`auth.css`** - Authentication pages (login, register)
- **`dashboard.css`** - Dashboard page styles
- **`product-editor.css`** - Product editor component and related dashboard styles
- **`shops.css`** - Shop pages and product listing styles

## Usage

All CSS files are imported in `layout.tsx` and will be available globally. The styles are organized by:

1. **Functionality** - Related styles are grouped together
2. **Scope** - Page-specific vs component-specific vs utility styles
3. **Maintainability** - Easier to find and modify specific styles

## Benefits

- **Better Organization** - Styles are logically grouped by purpose
- **Easier Maintenance** - Find and modify styles more quickly
- **Reduced Conflicts** - Less chance of CSS conflicts between different areas
- **Better Performance** - Only load styles that are needed (when using CSS modules in the future)
- **Team Collaboration** - Multiple developers can work on different CSS files without conflicts

## Migration Notes

The original `globals.css` has been minimized and now only contains a comment. All styles have been moved to their appropriate files in this directory structure.
