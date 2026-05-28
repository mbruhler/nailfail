# AGENTS.md

Instrukcje dla agentów pracujących w tym repozytorium.

## Najważniejsze zasady

- Używaj `ccc` jako narzędzia discovery do szukania po kodzie i orientowania się w projekcie.
- Nie uruchamiaj ręcznie indeksowania `ccc`, jeśli w repozytorium istnieje katalog `.cocoindex_code` albo `cocoindex_code`. `ccc` ma sam aktualizować indeks po zmianach.
- Uruchamiaj komendy przez `rtk`, żeby kompaktować output CLI, np. `rtk npm run build`.
- Zawsze sprawdzaj `DESIGN.md`, jeśli istnieje w katalogu, nad którym pracujesz. Jeśli go nie ma, kontynuuj bez niego.
- Nie zapisuj obrazu ani video z kamery. Aplikacja działa w pełni lokalnie i nie przechowuje żadnych danych.
- Tryb tray/background, autostart i instalatory są późniejszym etapem. Najpierw działający MVP.

## Produkt

Projekt to aplikacja desktopowa Tauri v2 + React + TypeScript do wykrywania gryzienia paznokci przy użyciu lokalnej kamerki, MediaPipe landmarks i heurystycznego detektora temporalnego.

Najkrótsza ścieżka MVP:

1. Tauri v2 + React + TypeScript.
2. Kamera przez `getUserMedia`.
3. Lokalnie bundlowane modele MediaPipe Face Landmarker i Hand Landmarker.
4. Feature extraction z landmarków.
5. Rolling buffer 1-2 sekundy.
6. Heuristic detector v1.
7. Lokalny alert audio/visual.

## UI

Ekran główny ma być praktyczny i prosty:

- preview kamerki,
- Start / Stop,
- sensitivity,
- alert on/off,
- status detekcji,
- ustawienia alertów: głośność, typ alertu, cooldown.

Stosuj UI oszczędnie:

- Domyślnie wybieraj plain text i proste kontrolki.
- Nie dodawaj kart, paneli, widgetów, karuzel ani dekoracyjnych sekcji, jeśli nie poprawiają działania aplikacji.
- Używaj komponentów UI wtedy, gdy pomagają porównywać, wybierać, nawigować, sprawdzać albo obsługiwać wiele elementów.
- Nie opakowuj każdej sekcji w osobny element UI.
- Priorytetem są czytelność, ciągłość i wizualna powściągliwość.

W React twórz małe, skupione komponenty z propsami. Unikaj dużych komponentów, które mieszają dostęp do kamery, detekcję, logikę alertów i UI.

## Frontend I Kamera

- Pobieraj obraz z kamerki w frontendzie przez `navigator.mediaDevices.getUserMedia`.
- Frame loop powinien działać początkowo w okolicach 15 FPS.
- Do detekcji przekazuj klatki przez offscreen canvas albo technicznie równoważny canvas pipeline.
- Domyślnie nie zapisuj video, snapshotów ani surowych klatek.
- Preview powinno dać się później ukryć, ale nie jest to wymagane w pierwszym MVP.

## MediaPipe

Dodać lokalnie bundlowane modele:

- MediaPipe Face Landmarker,
- MediaPipe Hand Landmarker.

Nie używaj CDN dla modeli ani runtime, jeśli aplikacja ma działać lokalnie i prywatnie.

Wykrywaj:

- punkty ust,
- końcówki palców,
- pozycję dłoni,
- orientację twarzy.

## Feature Extraction

Dla każdej klatki licz mały wektor cech, bez przechowywania obrazu:

- minimalny dystans fingertip -> mouth center,
- czy fingertip jest wewnątrz albo blisko mouth bbox,
- velocity dłoni i palców,
- stabilność dłoni przy ustach,
- liczba palców blisko ust,
- proxy face yaw / pitch,
- confidence landmarków.

Normalizuj cechy względem rozmiaru twarzy, nie względem pikseli. Dzięki temu detektor ma działać podobnie przy różnych odległościach od kamery.

## Temporal Buffer

- Trzymaj rolling window 1-2 sekundy, np. 30 klatek przy 15 FPS.
- Score v1 licz z bufora, a nie z pojedynczej klatki.
- Osobno modeluj krótkotrwałe dotknięcie twarzy i utrzymywanie palców przy ustach.

## Heuristic Detector v1

Pierwsza wersja ma być bez trenowania modelu.

- `suspected_biting`: palce są blisko ust przez około 500 ms.
- `confirmed_biting`: warunek trwa około 900-1200 ms i ruch pasuje do gryzienia.
- Po alercie stosuj cooldown, żeby nie spamować użytkownika.
- Sensitivity powinna regulować progi dystansu, czas potwierdzenia albo oba te parametry.

## Alert System

Obsługiwane alerty dla MVP:

- lokalny dźwięk,
- visual flash / overlay,
- alert on/off,
- głośność,
- cooldown.

Native notification przez Tauri jest opcjonalne po działającym alert pipeline.

## Prywatność

Aplikacja nie zbiera feedbacku ani żadnych danych użytkownika. Nie zapisuj obrazu, video, surowych klatek, cech landmarków ani etykiet. Wszystko działa lokalnie i nic nie jest przechowywane ani eksportowane.

## Temporal Model v2

Opcjonalny, przyszły kierunek dla detekcji ML (bez zbierania danych od użytkowników):

- sekwencje cech z rolling window,
- mały 1D CNN albo GRU,
- eksport do ONNX,
- lokalne inference przez JS/WASM albo Rust sidecar.

Nie buduj Temporal Model v2 przed działającym heurystycznym MVP.

## Tauri

- Trzymaj logikę kamery i MediaPipe po stronie frontendowej, dopóki nie ma powodu przenosić jej do Rust.
- Rust/Tauri wykorzystuj do funkcji natywnych: lokalne pliki ustawień, opcjonalne powiadomienia, później tray/background/autostart.
- Nie dodawaj tray/background w MVP, jeśli użytkownik nie poprosi o ten etap.
- Docelowo najpierw build macOS, potem Windows.

## Jakość

- Preferuj proste, testowalne moduły: camera pipeline, landmarker setup, feature extraction, temporal buffer, detector, alerts.
- Czysto rozdzielaj stan UI od stanu detekcji.
- Tam, gdzie to możliwe, testuj czyste funkcje: feature normalization, buffer aggregation, scoring, cooldown.
- Po zmianach uruchamiaj adekwatne komendy przez `rtk`, np. build, typecheck, lint albo testy dostępne w projekcie.
