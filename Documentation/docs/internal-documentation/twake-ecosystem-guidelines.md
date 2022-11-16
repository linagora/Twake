---
description: >-
  Global guidelines for any new projects around Twake, Frontend and Backend
  guidelines are discussed here.
---

# 🎨 Twake Ecosystem Guidelines

## Frontend guidelines

### Logo, UI and UX guidelines

#### Logos

{% file src="../.gitbook/assets/logo\_shape.svg" caption="Logo shape in SVG format" %}

#### Colors and fonts

The fonts and colors to use are defined in the document bellow, scroll down for the hexadecimal codes of each color.

![](../.gitbook/assets/screenshot-2021-03-31-at-14.51.23.png)



Colors code extracted from the Twake theme [https://github.com/linagora/Twake/blob/main/twake/frontend/src/app/theme.less](https://github.com/linagora/Twake/blob/main/twake/frontend/src/app/theme.less)

```css
// Circular Std = France
// Helvetica Neue = Vietnam
// TT Norms = Russia

// --- Twake fonts --- //
@main-font: 'Circular Std', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue',
  'Apple Color Emoji', Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';

// --- Twake colors --- //
@primary: #3840f7;
@primary-background: #3842f723;
@primary-hover: #3850f7;
@secondary: #0d0f38;

@black: #000000;
@black-alpha-50: #18295288;
@black-alpha-70: #18295255;
@grey-background: #f5f5f7;
@grey-light: #eeeeee;
@grey-dark: #6a6a6a;

@error: #ff5154;
@success: #04aa11;
@warning: #ff8607;
@white: #fff;
```

#### Icons and emojis \(⚠️ not validated by UX designer yet\)

Twake is currently using feather icons [https://feathericons.com/](https://feathericons.com/) and can fallback to Material Icons or FontAwesome.

Emojis on web must use the Apple emojis set preferably. On device, prefer to use the device emoji set.

### Frameworks and component system

#### Languages and frameworks

We recommend **TypeScript** and **VueJS** for any new projects around Twake. \(But Twake itself currently uses ReactJS with typescript.\)

#### **Components system**

We strongly recommend using Antd design system: [https://ant.design/](https://ant.design/) for 3 reasons:

1. We want to **differ from Material** UI that is too recognisable
2. Antd is very customisable, and **we provide a Twake theme here:** [**https://github.com/linagora/Twake/blob/main/twake/frontend/src/app/theme.less**](https://github.com/linagora/Twake/blob/main/twake/frontend/src/app/theme.less)\*\*\*\*
3. Antd contain more components than Material UI

### Libraries for common use cases

Feel free to add any library in this table.

| Use case | used by | prefered library |
| :--- | :--- | :--- |
| Infinite scroll | Twake message feed | [https://virtuoso.dev/](https://virtuoso.dev/) \(React\) |

## Backend guidelines

### Programmation languages

### Databases and middlewares



