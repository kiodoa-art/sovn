# Søvnro

Lille statisk PWA til patienter med søvnproblemer.

## Upload til GitHub Pages

Upload alle filer i denne mappe til roden af dit GitHub repository.

Appen bruger ingen backend og sender ingen data. Søvnplanen gemmes kun lokalt i browserens localStorage.

## Opdatering

Når du ændrer appen, så bump versionsnummeret i:

- `index.html` query strings
- `app.js` APP_VERSION
- `sw.js` CACHE_VERSION og fil-query strings

Det får installerede PWA-versioner til at hente ny cache og vise opdateringsbanner.


## Ændringer i v1.0.4
- Opdateringsbjælken er fjernet helt fra HTML/CSS.
- Illustrationerne i fanen “Nu” er fjernet helt.
