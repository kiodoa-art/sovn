# Nattero

**Hjælp til bedre søvn**

Nattero er en lille statisk PWA på dansk med rolige lydøvelser, konkrete søvnråd, søvnplan, påmindelse og søvndagbog.

## Teknologi

Appen er bygget med almindelig HTML, CSS og vanilla JavaScript. Den kræver ingen backend, konto eller eksterne biblioteker.

- Søvnplan, tjekliste og streak gemmes lokalt i `localStorage`.
- Søvndagbogen gemmes lokalt i `IndexedDB`.
- Ingen brugerdata sendes ud af browseren.
- Lydfiler og app-ikoner ligger lokalt i `assets/`.

## Upload til GitHub Pages

Pak zip-filen ud, og upload alle filer direkte til roden af repositoryet. `index.html` skal kunne ses på repositoryets forside.

Under **Settings → Pages** vælges:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/(root)`

## Opdatering

Aktuel version: **2.1.1**

Når appen ændres, skal samme versionsnummer opdateres disse steder:

- query-strings til `styles.css` og `app.js` i `index.html`
- `CACHE_VERSION` og filreferencernes query-strings i `sw.js`

Det sikrer, at installerede PWA-versioner henter den nye cache. Service workeren aktiveres automatisk, hvorefter appen genindlæses.

## Baggrundslyde

Baggrundsafspilleren er klargjort til tre MP3-filer i `assets/audio/`:

- `hvid-stoej.mp3`
- `regn.mp3`
- `skov.mp3`

Indtil filerne lægges ind, bruger appen de tidligere genererede lyde som midlertidig fallback. Når MP3-filerne tilføjes, bruges de automatisk. Ved den endelige lydopdatering bør filerne også føjes til `APP_SHELL` i `sw.js`, og versionsnummeret skal bumpes igen, så de bliver tilgængelige offline med det samme.

## Projektstruktur

- `index.html` – appens indhold og struktur
- `styles.css` – design og mobilvisning
- `app.js` – navigation, værktøjer, lyd, søvnplan og søvndagbog
- `manifest.webmanifest` – PWA-navn, farver og ikoner
- `sw.js` – offline-cache og opdatering
- `assets/` – ikoner, favicons og lydfiler
