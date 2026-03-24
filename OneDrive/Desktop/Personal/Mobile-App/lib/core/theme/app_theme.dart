import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Centralized design system for Scanni
/// Defines all border radiuses, spacing, colors, and theme configuration
class AppTheme {
  // Border Radiuses - Rounded Design System
  static const double radiusXS = 8.0;
  static const double radiusSM = 12.0;
  static const double radiusMD = 16.0;
  static const double radiusLG = 24.0;
  static const double radiusXL = 32.0;
  static const double radiusFull = 9999.0;

  // Spacing System
  static const double spacingXS = 4.0;
  static const double spacingSM = 8.0;
  static const double spacingMD = 16.0;
  static const double spacingLG = 24.0;
  static const double spacingXL = 32.0;
  static const double spacingXXL = 48.0;

  // Dark Theme Colors
  static const Color primaryBlue = Color(0xFF60A5FA);
  static const Color primaryBlueDark = Color(0xFF1E3A5F);
  static const Color primaryBlueContainer = Color(0xFF3B82F6);
  static const Color secondaryBlue = Color(0xFF93C5FD);
  
  static const Color backgroundDark = Color(0xFF0F0F0F);
  static const Color surfaceDark = Color(0xFF1A1A1A);
  static const Color surfaceLight = Color(0xFF262626);
  static const Color surfaceHighlight = Color(0xFF333333);
  
  static const Color textPrimaryDark = Color(0xFFF5F5F5);
  static const Color textSecondaryDark = Color(0xFFA3A3A3);
  
  // Light Theme Colors
  static const Color backgroundLight = Color(0xFFFAFAFA);
  static const Color surfaceLightTheme = Color(0xFFFFFFFF);
  static const Color surfaceLightAlt = Color(0xFFF5F5F5);
  static const Color surfaceHighlightLight = Color(0xFFE5E5E5);
  
  static const Color textPrimaryLight = Color(0xFF171717);
  static const Color textSecondaryLight = Color(0xFF525252);
  
  static const Color textPrimary = textPrimaryDark;
  static const Color textSecondary = textSecondaryDark;
  static const Color divider = Color(0xFF2A2A2A);
  
  // Accent colors
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  
  // Border Radius Helpers
  static BorderRadius get borderRadiusXS => BorderRadius.circular(radiusXS);
  static BorderRadius get borderRadiusSM => BorderRadius.circular(radiusSM);
  static BorderRadius get borderRadiusMD => BorderRadius.circular(radiusMD);
  static BorderRadius get borderRadiusLG => BorderRadius.circular(radiusLG);
  static BorderRadius get borderRadiusXL => BorderRadius.circular(radiusXL);
  static BorderRadius get borderRadiusFull => BorderRadius.circular(radiusFull);
  
  static Radius get radiusXSRadius => Radius.circular(radiusXS);
  static Radius get radiusSMRadius => Radius.circular(radiusSM);
  static Radius get radiusMDRadius => Radius.circular(radiusMD);
  static Radius get radiusLGRadius => Radius.circular(radiusLG);
  static Radius get radiusXLRadius => Radius.circular(radiusXL);

  /// Modern text styles using Poppins (clean, modern font)
  static TextStyle get headingLarge => GoogleFonts.poppins(
    fontSize: 28,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.5,
  );
  
  static TextStyle get headingMedium => GoogleFonts.poppins(
    fontSize: 22,
    fontWeight: FontWeight.w600,
    letterSpacing: -0.3,
  );
  
  static TextStyle get headingSmall => GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: FontWeight.w600,
  );
  
  static TextStyle get bodyLarge => GoogleFonts.poppins(
    fontSize: 16,
    fontWeight: FontWeight.w400,
  );
  
  static TextStyle get bodyMedium => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w400,
  );
  
  static TextStyle get bodySmall => GoogleFonts.poppins(
    fontSize: 12,
    fontWeight: FontWeight.w400,
  );
  
  static TextStyle get labelLarge => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
  );
  
  static TextStyle get labelSmall => GoogleFonts.poppins(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.8,
  );
  
  static TextStyle get buttonText => GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.5,
  );

  /// Get the dark theme
  static ThemeData getDarkTheme() {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      primaryColor: primaryBlue,
      
      colorScheme: const ColorScheme.dark(
        primary: primaryBlue,
        onPrimary: Colors.white,
        primaryContainer: primaryBlueContainer,
        secondary: secondaryBlue,
        surface: surfaceDark,
        onSurface: textPrimaryDark,
        surfaceContainerHighest: surfaceHighlight,
        error: error,
      ),
      
      cardTheme: CardThemeData(
        color: surfaceLight,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: borderRadiusMD),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlueContainer,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: borderRadiusSM),
          padding: const EdgeInsets.symmetric(horizontal: spacingLG, vertical: spacingMD),
          textStyle: buttonText,
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryBlue,
          shape: RoundedRectangleBorder(borderRadius: borderRadiusSM),
          textStyle: buttonText,
        ),
      ),
      
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryBlue,
          side: const BorderSide(color: primaryBlue),
          shape: RoundedRectangleBorder(borderRadius: borderRadiusSM),
          textStyle: buttonText,
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceLight,
        border: OutlineInputBorder(borderRadius: borderRadiusMD, borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: borderRadiusMD, borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: borderRadiusMD, borderSide: const BorderSide(color: primaryBlue, width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: spacingMD, vertical: spacingMD),
        labelStyle: bodyMedium.copyWith(color: textSecondaryDark),
        hintStyle: bodyMedium.copyWith(color: textSecondaryDark),
      ),
      
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: borderRadiusLG),
      ),
      
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(topLeft: radiusLGRadius, topRight: radiusLGRadius),
        ),
      ),
      
      chipTheme: ChipThemeData(
        backgroundColor: surfaceLight,
        selectedColor: primaryBlueContainer,
        shape: RoundedRectangleBorder(borderRadius: borderRadiusFull),
        labelStyle: labelSmall,
      ),
      
      appBarTheme: AppBarTheme(
        backgroundColor: backgroundDark,
        foregroundColor: textPrimaryDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: headingSmall.copyWith(color: textPrimaryDark),
      ),
      
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceDark,
        selectedItemColor: primaryBlue,
        unselectedItemColor: textSecondaryDark,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: labelSmall,
        unselectedLabelStyle: labelSmall,
      ),
      
      textTheme: TextTheme(
        displayLarge: headingLarge.copyWith(color: textPrimaryDark),
        displayMedium: headingMedium.copyWith(color: textPrimaryDark),
        displaySmall: headingSmall.copyWith(color: textPrimaryDark),
        headlineLarge: headingLarge.copyWith(color: textPrimaryDark),
        headlineMedium: headingMedium.copyWith(color: textPrimaryDark),
        headlineSmall: headingSmall.copyWith(color: textPrimaryDark),
        titleLarge: headingSmall.copyWith(color: textPrimaryDark),
        titleMedium: labelLarge.copyWith(color: textPrimaryDark),
        titleSmall: labelSmall.copyWith(color: textPrimaryDark),
        bodyLarge: bodyLarge.copyWith(color: textPrimaryDark),
        bodyMedium: bodyMedium.copyWith(color: textPrimaryDark),
        bodySmall: bodySmall.copyWith(color: textSecondaryDark),
        labelLarge: labelLarge.copyWith(color: textPrimaryDark),
        labelMedium: bodySmall.copyWith(color: textSecondaryDark),
        labelSmall: labelSmall.copyWith(color: textSecondaryDark),
      ),
      
      useMaterial3: true,
    );
  }

  /// Get the light theme
  static ThemeData getLightTheme() {
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,
      primaryColor: primaryBlueContainer,
      
      colorScheme: const ColorScheme.light(
        primary: primaryBlueContainer,
        onPrimary: Colors.white,
        primaryContainer: primaryBlue,
        secondary: secondaryBlue,
        surface: surfaceLightTheme,
        onSurface: textPrimaryLight,
        surfaceContainerHighest: surfaceHighlightLight,
        error: error,
      ),
      
      cardTheme: CardThemeData(
        color: surfaceLightTheme,
        elevation: 1,
        shadowColor: Colors.black12,
        shape: RoundedRectangleBorder(borderRadius: borderRadiusMD),
      ),
      
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlueContainer,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: borderRadiusSM),
          padding: const EdgeInsets.symmetric(horizontal: spacingLG, vertical: spacingMD),
          textStyle: buttonText,
        ),
      ),
      
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primaryBlueContainer,
          shape: RoundedRectangleBorder(borderRadius: borderRadiusSM),
          textStyle: buttonText,
        ),
      ),
      
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryBlueContainer,
          side: const BorderSide(color: primaryBlueContainer),
          shape: RoundedRectangleBorder(borderRadius: borderRadiusSM),
          textStyle: buttonText,
        ),
      ),
      
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceLightAlt,
        border: OutlineInputBorder(borderRadius: borderRadiusMD, borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(borderRadius: borderRadiusMD, borderSide: const BorderSide(color: surfaceHighlightLight)),
        focusedBorder: OutlineInputBorder(borderRadius: borderRadiusMD, borderSide: const BorderSide(color: primaryBlueContainer, width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: spacingMD, vertical: spacingMD),
        labelStyle: bodyMedium.copyWith(color: textSecondaryLight),
        hintStyle: bodyMedium.copyWith(color: textSecondaryLight),
      ),
      
      dialogTheme: DialogThemeData(
        backgroundColor: surfaceLightTheme,
        shape: RoundedRectangleBorder(borderRadius: borderRadiusLG),
      ),
      
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: surfaceLightTheme,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(topLeft: radiusLGRadius, topRight: radiusLGRadius),
        ),
      ),
      
      chipTheme: ChipThemeData(
        backgroundColor: surfaceLightAlt,
        selectedColor: primaryBlue,
        shape: RoundedRectangleBorder(borderRadius: borderRadiusFull),
        labelStyle: labelSmall.copyWith(color: textPrimaryLight),
      ),
      
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceLightTheme,
        foregroundColor: textPrimaryLight,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: headingSmall.copyWith(color: textPrimaryLight),
        surfaceTintColor: Colors.transparent,
      ),
      
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surfaceLightTheme,
        selectedItemColor: primaryBlueContainer,
        unselectedItemColor: textSecondaryLight,
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: labelSmall,
        unselectedLabelStyle: labelSmall,
      ),
      
      textTheme: TextTheme(
        displayLarge: headingLarge.copyWith(color: textPrimaryLight),
        displayMedium: headingMedium.copyWith(color: textPrimaryLight),
        displaySmall: headingSmall.copyWith(color: textPrimaryLight),
        headlineLarge: headingLarge.copyWith(color: textPrimaryLight),
        headlineMedium: headingMedium.copyWith(color: textPrimaryLight),
        headlineSmall: headingSmall.copyWith(color: textPrimaryLight),
        titleLarge: headingSmall.copyWith(color: textPrimaryLight),
        titleMedium: labelLarge.copyWith(color: textPrimaryLight),
        titleSmall: labelSmall.copyWith(color: textPrimaryLight),
        bodyLarge: bodyLarge.copyWith(color: textPrimaryLight),
        bodyMedium: bodyMedium.copyWith(color: textPrimaryLight),
        bodySmall: bodySmall.copyWith(color: textSecondaryLight),
        labelLarge: labelLarge.copyWith(color: textPrimaryLight),
        labelMedium: bodySmall.copyWith(color: textSecondaryLight),
        labelSmall: labelSmall.copyWith(color: textSecondaryLight),
      ),
      
      useMaterial3: true,
    );
  }
}
