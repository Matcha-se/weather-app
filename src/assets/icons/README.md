# Icons

All pictures in this folder are normal image files, so you can replace any of them
with your own icon or photo.

## Weather icons (used on the Home screen)

`weather/sun.svg`
`weather/cloud.svg`
`weather/rain.svg`
`weather/partly-cloudy.svg`

The file names are mapped in `src/app/services/weather.service.ts` inside `getIcon()`.
Keep the same names and simply replace the files, or update the map if you rename them.

Recommended size: a square image (for example 96 x 96 or 128 x 128).

## Tab icons (used only in the style guide preview)

`tabs/home.svg`
`tabs/map.svg`
`tabs/places.svg`

The real app uses Ionicons for the tab bar (`cloudy-outline`, `map-outline`,
`location-outline`). These image files are only for the style guide mockup.

## Style guide extras

`status/` - phone status bar icons
`ui/` - location pin and refresh icons

These are only used by `src/assets/style-guide.html`.

## How to use your own picture

1. Put your file in the same folder.
2. Either keep the same file name (for example `sun.svg`), or
3. Rename the file and update the path in `weather.service.ts` / `style-guide.html`.
