# CS2 Crosshair Lab

**Work in progress.** A browser editor for CS2 crosshairs, with an English interface inspired by the game's settings.

[Open the app](https://spiral-network.github.io/cs2-crosshair-lab/)

- Ten styles, crosshair/outline RGBA and scope dot settings.
- Resolution presets and custom game/monitor sizes, stretched, black bars or native aspect ratio.
- Shared game-pixel raster for the preview and ×8 zoom, with a center guide and pixel grid.
- Current `CS…` code import/export, CFG/VCFG import and one-line console commands.
- Family catalog, paginated parameter combinations and generic movement/firing animation.

## Run

No dependencies or build step. Serve `dist` with any static HTTP server:

```sh
python -m http.server 8765 --directory dist
```

Open http://localhost:8765. Optional checks: `node tests/verify.cjs`.

## Accuracy status

Targets CS2 **1.41.8.8 / client 2000922**. The current share-code layout was checked against the local client serializer; both supplied game codes decode and re-encode exactly. New generated configurations still need an in-game import check.

**Pixel-perfect CS2 rendering is not yet certified.** The preview and zoom use the same rasterized pixels at the selected game resolution, but native centering, odd/even thickness, scaling, circles and outlines require comparison with unscaled in-game screenshots. The aim-center guide marks the mathematical frame center; the integer raster anchor is provisional. Dynamic behavior uses a generic simulation, without weapon-specific data. Background cropping approximates the game's field of view.

Imported settings stay in the browser. No game commands are executed or Steam configuration files modified. Older `CSGO-` codes are unsupported; legacy dimension commands are converted approximately with a warning.

Background images were extracted unchanged from the user's CS2 installation. CS2 and these assets belong to Valve. This is an unofficial project. Current settings are listed in [GameTracking-CS2](https://github.com/SteamTracking/GameTracking-CS2/blob/master/DumpSource2/convars.txt).
