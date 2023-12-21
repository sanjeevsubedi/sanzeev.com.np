---
title: Optimize fonts loading and rendering on web application
description: How to apply preloading, DNS prefetch strategy and font-display property of CSS to improve the loading speed of a web application by optimizing the web fonts loading and rendering process?
seoDescription: Apply preloading, DNS prefetch strategy and font-display property of CSS to improve the loading speed of a web application.
date: 2022-12-23
tags:
    - performance
    - fonts
---

{{ description }}

{% image "font-loading.png", title %}

## Background

By default, all fonts are lazily loaded on the browsers and the request to download fonts is only initiated during the construction of **CSSOM** (CSS Object Model) which happens only after the creation of **DOM** (Document Object Model).

{% image "critical-rendering-path.png", 'critical rendering path', null, null, 'Critical Rendering Path (source: https://web.dev)' %}

While parsing a CSS file, if a browser finds a custom font is used, it will make an HTTP request to download the font either on the same server or on a cross-origin server depending on what is provided on the src attribute of **@font-face**. Let’s take an example where we have an _index.html_ and _main.css_

_index.html_

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<title>Preloading Fonts</title>
		<link rel="stylesheet" href="main.css" as="style" />
	</head>
	<body>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
			eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
			ad minim
		</p>
	</body>
</html>
```

_main.css_

```css
font-face {
	font-family: Tangerine;
	src: url("Tangerine-Regular.ttf");
}

p {
	font-family: "Tangerine";
}
```

In the above diagram which depicts the **critical rendering path** (waterfall steps ), the request to download the font happens in **T2** phase. Until the font is successfully downloaded or the download process passes the following default **Timeout** period depending on the type of browser, the user will see a blank screen.

| Browser           | Timeout    | Fallback | Swap |
| ----------------- | ---------- | -------- | ---- |
| Chrome 35+        | 3 seconds  | Yes      | Yes  |
| Opera             | 3 seconds  | Yes      | Yes  |
| Firefox           | 3 seconds  | Yes      | Yes  |
| Internet Explorer | 0          | Yes      | Yes  |
| Safari            | No timeout | N/A      | N/A  |

For example, in the case of **Chrome**, we can observe the following actions:

-   A request to download the font is made.
-   If the font is downloaded within 3 seconds, the user will first see a blank screen and will be immediately swapped with the custom font after it is downloaded. This phenomenon is called a **Flash of Invisible Text (FOIT)**.
-   If the font does not download within 3 seconds, the user will first see a blank screen for 3 seconds followed by the system font (fallback) until the custom font is downloaded and swapped or stay with the system font in case of download failure. This phenomenon is called a **Flash of Unstyled Text (FOUT)**.

## Solution

### 1. Preload

We can use a preloading strategy to minimize the risk of FOIT. The main idea of preloading is to start the process of downloading the font very early in the process of the critical rendering path, **T1 phase**, in the above diagram. The font will likely be downloaded completely when the process reaches to T2 phase, and the browser can paint the text with custom font right away if there are no other blocking resources. In case, if the font is served from a cross-origin server, href property below should be adjusted accordingly.

> Note: **crossorigin** must be added on the link tag below even if the font is served from the same origin.

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Preloading Fonts</title>
		<link
			rel="preload"
			href="Tangerine-Regular.ttf"
			as="font"
			crossorigin
		/>
		<link rel="stylesheet" href="main.css" as="style" />
	</head>
	<body>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
			eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
			ad minim
		</p>
	</body>
</html>
```

> Note: If the latency to download the font is very much high even after we start the download process early in the stage, then preloading will also not help and we need to look for another alternative which we will discuss shortly.

### 2. DNS prefetch

In cases where the **cross-origin server** is used and many fonts need to be downloaded, we can use **DNS prefetch** strategy instead of preloading each font explicitly. The main goal of this approach is to start the **handshaking** process including the DNS resolving process and establishing the connection with the server early in the process so that later in the process of critical rendering path, downloading resources becomes faster since the connection to the server which might include several network roundtrips has already been set up. This also helps to optimize the rendering of other resources such as images, javascript etc if they are served from the same cross-origin server.

> Note: If all the resources are on the same origin server, then this is not useful.

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Preloading Fonts</title>
		<link rel="dns-prefetch" href="https://example.com" />
		<link rel="stylesheet" href="main.css" as="style" />
	</head>
	<body>
		<p>
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
			eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
			ad minim
		</p>
	</body>
</html>
```

### 3. font-display CSS property

We can use the _font-display_ CSS property. If we want to get rid of the **FOIT** completely, we can use **swap** value. With this, it is guaranteed that we will see the system font right away without the flash of invisible text and when the custom font gets downloaded, it will swap the system font **(FOUT)**.

```css
@font-face {
	font-family: Tangerine;
	src: url("Tangerine-Regular.ttf");
	font-display: swap; /*auto | block | optional | fallback | optional*/
}

p {
	font-family: "Tangerine";
}
```

> But there are 2 main drawbacks to using _swap_ value.

-   It will most likely trigger **layout shifts** (movement of page content without user interaction) because the positions of custom and system fonts might be different for the same text on the viewport. Also, the browser has to recalculate the layout and paint it again on the screen with the new coordinates and dimensions.
-   It will degrade the user experience because of layout shifts and the interchanging of different fonts.

> There are 5 different possible values of **font-display** property, and different browsers have their specific block and swap period for each of these values (**see the table below**).

-   **block**: Hides text up to a defined block period while waiting for the custom font to download, and always swaps custom font when it loads successfully.
-   **swap**: Shows text as soon as possible with the system font, and always swaps the custom font when it loads successfully.
-   **fallback**: Hides text up to a defined block period, then swaps the custom font only if it loads within the defined swap period. If the font can’t be swapped with the defined swap period, the system font will be applied even after the successful download of the custom font in the future.
-   **optional**: Hides text up to a defined block period, and only uses the custom font if it is available within this block period. If the custom font is not downloaded or gets downloaded after the block period, it will not be applied since there is no swapping at all. This also means there are no risks of layout shifts.
-   **auto**: Based upon the default browser implementation and varies from browser to browser.

| Value    | Block Period          | Swap Period           | Outcome                                                                                                        |
| -------- | --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| block    | Short                 | Infinite              | FOIT, layout shifts                                                                                            |
| swap     | None                  | Infinite              | FOUT, layout shifts                                                                                            |
| fallback | Extremely Short       | Short                 | Minimize the risk of layout shift and invisible text                                                           |
| optional | Extremely Short       | None                  | Minimize the risk of layout shift and invisible text (even better than fallback since there is no swap period) |
| auto     | Based upon User agent | Based upon User agent | Based upon User agent                                                                                          |

## My opinions on which font-display value to pick

-   **block**: I think displaying a blank screen for 3 seconds, for example in the case of chrome, is not ideal. Users might leave the page getting frustrated before the text gets painted on the screen.
-   **swap**: Swapping a font is bad for a user experience and prone to layout shifts. However, if you must have a custom font, for example, you have a company logo that only makes sense when it is rendered with the proper font or some other branding information, then this might be a good option. But there is a trade-off.
-   **fallback/optional**: I think both fallback and optional are good picks because they care more about minimizing layout shifts and blank screens with a trade-off of not displaying the custom font in case it is not downloaded on time.
-   **auto**: I think it is hard to get the same user experience across different browsers since they have different implementations.

## Summary

Following are some of the ways to optimize the loading and rendering of web fonts which ultimately improves the loading speed of the web application.

-   Preload fonts
-   DNS prefetch
-   Font-display property of CSS

I also have a **video** of this blog post on **youtube** [here](https://www.youtube.com/watch?v=wnpMeYARV4g&ab_channel=FrontendMento).
