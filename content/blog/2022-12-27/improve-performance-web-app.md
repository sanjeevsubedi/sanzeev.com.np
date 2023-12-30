---
title: Top 7 ways to improve the performance of web apps
description: In this article, we will be discussing about various ways to boost the performance of web apps which ultimately provides high-quality user experience to the end users.
seoDescription: Various ways to boost the performance of web apps to provide high-quality user experience to the end users.
date: 2022-12-27
tags:
    - performance
    - server side rendering
    - progressive rendering
    - user experience
---

{{ description }}

{% image "improve-performance-web-app.png", title %}

## 1. Progressive HTML rendering with multiple flushes

Rendering the web page by **flushing out early and multiple times** will help to improve the performance and user experience of the web app. This approach is better than the traditional **single flush model or server-side rendering** where the user will see the blank screen until the server renders and flushes the full HTML page to the browser and **single page application** where a page is rendered only after javascript bundles are downloaded and parsed on the browser.

> Before writing progressive rendering code, let's first understand **CSR** and **SSR**

**Client side rendering (CSR)**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Single Page Application</title>
    <base href="/">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  <body>
    <app-root></app-root>
    <script src="runtime.d8a2330f14840f59.js" type="module"></script>
    <script src="polyfills.895e5e81a4720e7a.js" type="module"></script>
    <script src="main.1a26a4424b91b7e8.js" type="module"></script>
  </body>
</html>
```

> Server only sends the javascript bundles to the browser. It will then compile and execute the bundle to create DOM and attach necessary event handlers. We might see performance issues on low-end devices since the parse time will be slow because of slow CPUs.

**Server Side Rendering (SSR)**

With this approach, the server will not send any response to the browser until the **full HTML page** is rendered on the server.

I have used the **pug** template engine to demonstrate the SSR but we can use any other available templating engine.

_index.js_

```javascript
const express = require("express");
const app = express();
const path = require("path");

// set the public directory to serve static resources
app.use(express.static(path.join(__dirname, "public")));

// set the template view engine and path
app.set("template", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.get("/home", (req, res) => {
	// delay of 3000 is to simulate some domain service api call.
	// server will not flush until the api call is resolved and the page is fully rendered on the server.
	// browser is idle as it waits for the data to arrive.

	setTimeout(() => {
		res.render("home", { message: "Hello there!" });
	}, 3000);
});

app.listen(8080, function (err) {
	console.log("Server listening on port 8080");
});
```

_views/home.pug_

```pug
doctype html
html
  head
    style
      include style.css
  body
    div(class='toolbar')
      img(width='40' src="logo.png")

    div(class='content')
      div(id='left-nav') left nav
      div(id='middle') #{message}
      div(id='right-nav') right nav

    <footer>copyright</footer>
```

> Now let's come to **PSR**

**Progressive Rendering (PSR)**

This approach overcomes the drawback of server-side rendering and client-side rendering.

The following example doesn’t use any templating language and only uses the `res.write` method to stream HTML data. Also, **in-order flushing strategy** is used where the server defines the order of the chunks that should be flushed. The order of the flushing is head, header, left nav, middle content, right nav and the footer respectively. But it is also possible to do **out-of-order flushing** where the server sends the chunk which resolves first and so on.

```javascript
const express = require("express");
const app = express();
const path = require("path");

// set the public directory to serve static resources
app.use(express.static(path.join(__dirname, "public")));

app.get("/home", function (req, res) {
	res.setHeader("Content-Type", "text/html; charset=utf-8");

	// flush the head section right away so that downloading of css can start on browser
	// before server renders the full html page and send to the browser

	res.write("<html>");
	res.write(
		"<head><link rel='stylesheet' type='text/css' href='style.css' /></head>"
	);

	// flush the header which has a static resource logo
	res.write("<body>");
	res.write(`<div class= "toolbar"">
  <img width="40" src="logo.png">
</div>`);

	res.write('<div class="content">');

	setTimeout(() => {
		// flush the left navigation after 2000 ms
		res.write("<div id='left-nav'>left nav</div>");
	}, 2000);

	setTimeout(() => {
		// flush the middle content after 2500 ms
		const message = "Hello there!";
		res.write(`<div id='middle'>${message}</div>`);
	}, 2500);

	setTimeout(() => {
		// flush the right content after 3000 ms
		res.write("<div id='right-nav'>right nav</div>");
	}, 3000);

	setTimeout(() => {
		res.write("</div>");
	}, 3000);

	setTimeout(() => {
		// flush the footer
		res.write("<footer>copyright</footer>");
	}, 3000);

	// flush the closing html tag and end the response at 3000 ms
	setTimeout(() => {
		res.write("</body>");
		res.write("</html>");
		res.end();
	}, 3000);
});

app.listen(8080);
```

> What are the benefits of a progressive rendering approach?

-   Parsing/rendering HTML on the browser can start immediately after each flush and even before the end of the server response. This means a user can see something immediately without waiting for the full page to get rendered on the server and also improves the UX.

-   This approach optimizes the critical rendering path since the browser can start downloading critical resources defined on the <head> tag early in the process.

> Let’s do the visual comparison of **SSR** and **PSR** now :)

{% image "progressive-rendering.gif", "progressive rendering multiple flush", null, null, 'Progressive rendering (multiple flushes)' %}

{% image "server-side-rendering.gif", "server side rendering single flush", null, null, 'Server side rendering (single flush)' %}

> Note: In both approaches, the server flushes the HTML response by 3 seconds (3000ms).

[Marko](https://markojs.com/docs/rendering/Marko) supports streaming out the response and progressively rendering the web apps. It is very performant, scalable and capable of doing both SSR and PSR. We use this at eBay in almost all of the apps.

## 2. Reduce Bundle Size

One of the main drawbacks of single page apps (SPA) is that everything including DOM creation, hydration can happen only after all critical javaScript bundles have been downloaded on the browser. There is a cost of sending more javascript to the client and has a significant impact, especially on low bandwidth and low-end devices. So, it is very critical to send less javascript to the browser to avoid the performance bottleneck caused by large bundle size.

> The processing cost of parsing/compiling 170 KB of JavaScript vs decode time of an equivalently sized JPEG is not the same.

{% image "javascript-byte-size.png", "javaScript byte size" %}

### What do we get from a small bundle size?

-   JavaScript goes through 2 phases to execute the code.

    -   Parse/ Compile
    -   Execution

    So, the less javascript we have, the less time it takes to compile, execute the script and the faster user can interact with your apps.

-   A small bundle takes requires less bandwidth and fewer round trips to arrive on the browser.

> Fast Time to Interactive = less parse + less execute + less network trips+ less time to decompress

### How to reduce the bundle size?

-   **Compress (gzip, deflate)**: Server should use the proper compression header and send it to the browser.

-   **Minification**: Removing unnecessary characters such as comments, block delimiters, line breaks, and white space characters.

-   **Code splitting/lazy loading**: We can split the application into several chunks so that only the critical chunk is loaded on the first initial page load and other chunks will be loaded on demand during the run time as we navigate to other parts of the application. This strategy will reduce the main bundle file.

-   **Tree Shaking**: Removing dead code/unused code from the bundle.

## 3. Cache

### Etag

> How does Etag work?

-   Client requests a list of users for the first time.

-   Server generates an **Etag**, string of ASCII characters similar to 33a64df551425fcc55e4d42a148795d9f25f89d4 to represent the requested resource and sends to the client on the response header called ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

-   Client stores the Etag for future use. If the client requests the same resource, it will send the previously saved Etag under the request header called If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

-   Server checks the Etag value from the request header. If the response is exactly the same as a previous response, then the Etag generated earlier by the server will also match and therefore it will send a **304** status code without body.

-   If the response has changed, then a **200** status code along with the **body** and **new Etag** representing the **new response** is sent to the client.

> How did Etag help to improve the performance?

-   If the response has not changed then a client can save bandwidth since the server is not required to send the full response, and the client doesn’t have to re-render the page again.

-   This caching mechanism is especially for dynamic resources.
    {% image "etag.png", "etag", null, null, 'eTag request response header' %}

### HTTP caching (cache-Control)

-   This can be used especially for **static resources** such as fonts, images etc. because these kinds of resources don’t change that often.

-   Resources on the browser can be cached for a predefined duration of time in milliseconds. For example, in the following screenshot, the font is cached for 604800 ms and is served from the memory cache until the expiry of the cache.

    {% image "http-caching.png", "http caching", null, null, 'HTTP cache in browser'%}

## 4. Optimizing the critical rendering path

Critical rendering path (CRP) is the sequential or waterfall steps that the browser goes through to convert the HTML, CSS and JS into the visible pixels on the screen.

> Optimizing CRP is all about prioritizing which resources get loaded (critical) and which can be deferred (non-critical) later during the first initial page load to render the page faster.

We can use a few techniques to reduce the number and bytes of **critical resources** so that there is less work for the browser to parse and execute.

-   Mark non-critical resources with `async` or `defer` to make it non-render blocking.

```html
<script defer src="https://www.googletagmanager.com/gtag/js?id=TAG_ID"></script>
```

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=TAG_ID"></script>
```

-   Develop a strategy to download all critical resources as **early** as possible by using **resource hints** such as preload, prefetch, dns-prefetch.
-   Since CSS is rendering blocking and some CSS are conditional, for example, CSS for printing purposes, specific devices or orientation, we need to mark them using proper `media` attributes so that it becomes conditionally render blocking. In the following example, `landscape.css` is rendering blocking only for screens which are landscape and non-rendering blocking for all other types of screens. Likewise, print.css is non-rendering blocking for all screen devices.

```html
<link href="landscape.css" rel="stylesheet" media="orientation:landscape" />
<link href="print.css" rel="stylesheet" media="print" />
```

-   If the CSS file is large and not all of it is required for the first page load, we can probably separate it into inline CSS using the `<style>` tag as critical and remaining as non-critical on a separate CSS file which will be loaded asynchronously.

```html
<!-- inline css -->
<style>
  /*critical css required for first page load goes here*/
</style>

<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'"
```

## 5. Web workers

The browser uses a single thread, which is also called the **main** thread, to execute all the JavaScript code including reflow and layout-related activities. If there is any long-running JavaScript code, it will block the whole page resulting in an unresponsive page and bad user experience, ultimately impacting the performance of your application.

Since the web worker runs in a **separate thread** from the main thread, we can delegate long-running scripts to it and free the main thread to perform critical tasks. One caveat of web worker is that it doesn’t have access to DOM and therefore cannot perform any DOM manipulation.

> Web worker makes it possible to run JavaScript in multiple threads and achieve parallelization.

**How can web workers help to improve performance?**

-   We can isolate long-running and heavy computational work from the main thread and run it on a separate thread.
-   We can utilize the unused local resources (memory, CPU) of the computer running the browser to run the complex JavaScript code. For example, let’s assume there is an image processing task. Instead of sending the image to the server and processing it, we can run the script on the web worker to process it. This will be fast and also prevents the network roundtrip to the server and saves the server cost.

> Note: Moore’s Law states that the number of transistors on a microchip doubles every two years. The law claims that we can expect the speed and capability of our computers to increase every two years because of this. So, we can expect that computers running browsers will have a good memory and computational power.
> There might be some limitations where not every type of computation is possible to run on the client’s computer even if it is powerful and requires to be processed on the server side. But still, web workers open a door to think about utilizing the resources of the client’s computer, which is free.

Following is the sample code to implement a web worker.

_index.js_

```javascript
if (window.Worker) {
	const worker = new Worker("worker.js");

	// input can be anything based upon the nature of the task
	const input = "";

	// send input to the web work to perform heavy computational task
	worker.postMessage(input);

	// result of the heavy computational task such as image processing, running complex algorithms
	worker.addEventListener("message", (e) => {
		const result = e.data;

		// now use the result on the main thread
	});
}
```

_worker.js_

```javascript
onmessage = function (e) {
	// receive input from the main thread
	const input = e.data;

	// invoke complex task
	processLongRunningTask(input);
};

// CPU-intensive tasks
function processLongRunningTask(input) {
	// result of the heavy computational task such as image processing, running complex algorithms
	// output can be anything based upon the task of the task
	const output = "";

	// send the computed output to the main thread
	postMessage(output);
}
```

## 6. CDN for static resources

**Content Delivery Network (CDN)** is a group of servers which are grouped into points of presence (PoPs) and distributed in various geographic locations. The purpose of the network is to redirect the user to the closest possible PoP.

Serving static resources such as fonts, images, CSS etc. through the CDN will help to boost the performance of the web apps in the following ways:

-   It helps to decrease the latency and packet loss because requests will be made to the closest CDN server closest to end-users.
-   It reduces the load on the origin infrastructure which helps to preserve the origin server’s bandwidth usage.

## 7. Resource Hints

It provides instructions to the browsers to **prioritize** the origins or resources that need to be fetched and processed.

-   **preload**

This loads resources such as js, CSS, font, image etc. that are critical for the **current page** early in the process so that these are readily available during the rendering process. For e.g, we can optimize the font loading and rendering by preloading the font in advance to minimize the risk of FOIT (flash of invisible text).

[Learn more: https://sanzeev.com.np/blog/2022-12-23/optimize-font-loading/](https://sanzeev.com.np/blog/2022-12-23/optimize-font-loading/)

```html
<link
	rel="preload"
	href="http://localhost:3000/Tangerine-Regular.ttf"
	as="font"
	crossorigin
/>
```

-   **prefetch**

This loads resources which are necessary for **future navigation**. The goal is to improve the performance of the next page that the user might navigate by already caching the required resources.

> Note: We need to be cautious before applying this strategy on lower-end devices or where the connection might be very poor. It will be very costly if the resources are downloaded for future navigations and somehow the user didn’t navigate to the page for which the resources were fetched.

```html
<link rel="prefetch" href="/library-needed-for-next-page.js" as="script" />
```

-   **dns-prefetch**

This doesn’t fetch any resources but only helps to **set up the connection with the server/origin** early in the process so that when the resources are requested, those will be downloaded faster without latency since all the server connection activities which include DNS lookup, TLS handshake have already been completed.

```html
<link rel="dns-prefetch" href="http://localhost:3000" />
```

## References:

-   https://www.facebook.com/notes/10158791368532200/
-   https://blog.codinghorror.com/the-lost-art-of-progressive-html-rendering/
-   https://www.phpied.com/progressive-rendering-via-multiple-flushes/
-   https://almanac.httparchive.org/
