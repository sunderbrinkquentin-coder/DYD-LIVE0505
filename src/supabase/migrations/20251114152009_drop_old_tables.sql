/*
  # Lösche alte applications und optimized_cvs Tabellen

  1. Tabellen entfernen
    - DROP TABLE `applications` - Alte applications Tabelle wird nicht mehr benötigt
    - DROP TABLE `optimized_cvs` - Alte optimized_cvs Tabelle wird nicht mehr benötigt
    
  2. Auswirkungen
    - Alle Foreign Key Constraints werden automatisch durch CASCADE entfernt
    - Alle abhängigen Indices werden automatisch entfernt
    - Alle RLS Policies für diese Tabellen werden automatisch entfernt
    
  WICHTIG: Keine Datenmigration! Daten werden gelöscht.
*/

-- Lösche applications Tabelle falls vorhanden
DROP TABLE IF EXISTS applications CASCADE;

-- Lösche optimized_cvs Tabelle falls vorhanden
DROP TABLE IF EXISTS optimized_cvs CASCADE;