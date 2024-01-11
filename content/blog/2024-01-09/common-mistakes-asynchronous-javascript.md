---
title: Avoid common mistakes in Asynchronous JavaScript
description: In this blog post, we will learn some **common mistakes** while writing asynchronous javaScript code with examples. If you are a **beginner**, this article is for you, but even if you are an experienced developer, who knows, you might have missed something too. :)
seoDescription: Top common mistakes while writing asynchronous javascript code - silent failures, incorrect forEach loop and error handling, wrong promise order. Fix issues with for of, reduce, promise.all, try catch, etc.
date: 2024-01-09
tags:
    - javaScript
    - node
---

{{ description }}

{% image "common-mistakes-asynchronous-javascript.png", title %}

I have listed some of the common mistakes while writing asynchronous javaScript code as follows:

## 1. Using `forEach` for sequential promise execution

Given we have a collection of **promises** as follows, we want to loop through each promise and wait for it to resolve before moving on to the next one.

```js
const p1 = new Promise((resolve, reject) => {
	setTimeout(() => {
		resolve(1);
	}, 3000);
});

const p2 = new Promise((resolve, reject) => {
	setTimeout(() => {
		resolve(2);
	}, 500);
});

const p3 = new Promise((resolve, reject) => {
	setTimeout(() => {
		resolve(3);
	}, 2000);
});

const collection = [p1, p2, p3];
```

<div class="bad-example">

```js
// mistake 1: using await in the forEach callback
async function execute() {
	collection.forEach(async function (promiseItem) {
		const value = await promiseItem;
		console.log(value);
	});
}

// mistake 2: using await in the forEach callback + forEach statement itself
async function execute() {
	await collection.forEach(async function (promiseItem) {
		const value = await promiseItem;
		console.log(value);
	});
}

// uncomment and run each function one by one
// execute()
```

</div>

But using any flavors of `forEach`, all code above will output in the **wrong** order in the console as follows:

```
2
3
1
```

<div class="note">

> **Note:** `forEach` is not designed to work with `async` callbacks. It will not wait for the `async` callback to complete and will move on to the next iteration. This is the reason why we see the output in the console in the **wrong** order.

</div>

**How can we fix this?**

There are many ways to fix this. But we will look at two of them.

**Alternative 1: `for...of`**

<div class="good-example">

```js
// approach 1: using await in the for statement itself
async function execute() {
	for await (const promiseItem of collection) {
		console.log(promiseItem);
	}
}

// approach 2: using await in the body of the loop
async function execute() {
	for (const promiseItem of collection) {
		console.log(await promiseItem);
	}
}

// uncomment and run each function one by one
// execute()
```

</div>

<div class="note">

> **Note:** "The for `await...of` statement creates a loop iterating over `async` iterable objects as well as sync iterables." - [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)

</div>

**Alternative 2: `Array.prototype.reduce()`**

<div class="good-example">

```js
collection.reduce(async (prev, current) => {
	// wait for the previous promise to resolve
	await prev;

	const value = await current;
	console.log(value);
}, Promise.resolve());
```

</div>

Both alternative 1 and alternative 2 above will output in the console in the following **correct** order.

```
1
2
3
```

## 2. Silent failures

Unhandled promise rejections is one of the sources of silent failures which is very painful to debug and track down the bugs. Let's see how we can avoid them.

We have a function called `readFile` that reads a config file and returns a **promise** that resolves with the file’s contents.
This is a node.js example, but the same concept applies to the browser as well. For example, if we replace the `fs.readFile` with some callback based API such as `XMLHttpRequest` in the browser, the same problem will occur.

<div class="bad-example">

```js
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "config.json");

const readFile = () => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, "utf8", (err, data) => {
			resolve(data);
		});
	});
};
readFile()
	.then((data) => {
		console.log("success:", data);
	})
	.catch((err) => {
		console.log("error:", err);
	});
```

</div>

**What will happen if the config.json file somehow accidentally got deleted?**

-   The error will be **silently** ignored and the program will continue to run with **undefined** config state.
-   `catch` block is never executed.
-   We will see the following output in the console.

```
success: undefined
```

**How can we fix this?**

We need to make sure to handle the **error** scenario. We can do this by adding a `reject` call inside the callback as shown below.

<div class="good-example">

```js
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "config.json");

const readFile = () => {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, "utf8", (err, data) => {
			// added code to handle error scenario
			if (err) {
				reject(err);
			}
			resolve(data);
		});
	});
};
readFile()
	.then((data) => {
		console.log("success:", data);
	})
	.catch((err) => {
		console.log("error:", err);
	});
```

</div>

With this change, `catch` block is executed, and we will see the following output in the console if the config.json file is deleted.

```
error: [Error: ENOENT: no such file or directory ....]
```

So, proper error handling is very important to avoid silent failures and debug nightmares.

## 3. Error handling on multiple promises

While dealing with multiple promises, we need to make sure to handle the error scenario properly. Let's see how we can do that.

<div class="bad-example">

```js
async function getData() {
	const p1 = new Promise((resolve) => setTimeout(() => resolve("1"), 1000));
	const p2 = new Promise((_, reject) =>
		setTimeout(() => reject("error"), 500)
	);
	const results = [await p1, await p2];
	return results;
}
getData().catch((err) => console.log("catch:", err));
```

</div>

The above code will throw the following unhandled promise rejection error in node.
`catch` block will never get executed.

```
[UnhandledPromiseRejection: This error originated....]
```

<div class="note">

> **Note:**
>
> -   Timer runs **concurrently** for both `p1` and `p2` and doesn't wait for each other.
>
> -   `p2` waits for `p1` to complete. Look at the order of `await` in the array.
>
> -   Even if the order of wait is `p1` first and then `p2`, if `p2` rejects before `p1` is fulfilled, then an **unhandled** promise rejection error will trigger, irrespective of whether the caller has set up a catch clause or not.

</div>

**How to fix this?**

We can use `Promise.all` instead of multiple `await` in an array to solve this problem.

<div class="good-example">

```js
async function getData() {
	const p1 = new Promise((resolve) => setTimeout(() => resolve("1"), 1000));
	const p2 = new Promise((_, reject) =>
		setTimeout(() => reject("error"), 500)
	);
	const results = await Promise.all([p1, p2]);
	return results;
}

getData().catch((err) => console.log("catch:", err));
```

</div>

With this change, `catch` block is executed, and we will see the following output in the console.

```
catch: error
```

## 4. Catching errors thrown from async callbacks

We **can’t** catch errors thrown from async callbacks with a `try/catch` block.

In the following example, `setTimeout` is being used to simulate an asynchronous operation, but it can be any asynchronous operation such as reading a file, making an API call, etc. Callback function of `setTimeout` is only called after the execution of `try/catch` block because the event loop first executes the current **call stack** and then executes the **callback queue** afterwards. I will highly recommend learning more about event loop to understand the rationale behind this.

<div class="bad-example">

```js
try {
	setTimeout(() => {
		throw "error occurred";
	}, 0);
} catch (err) {
	console.log("error:", err);
}
```

</div>
<div class="note">

> **Note:** `catch` block is never executed. You might be tempted to use application’s global uncaught exception handler such as `process.on('uncaughtException')` event on node or `window.onerror()` event on browser to catch these errors, but these are not meant to be used as a replacement for proper error handling and should be avoided.

</div>

## 5. Order of then and catch matters in promise chains

Promise order matters and results in different behavior. This is even more important when we are dealing with a long chain of promises because in case of a bug, it will be difficult to find the bug in the code.

Let's imagine we have a function called `getUsers` that returns a **promise** that resolves with the list of users in case of success and rejects when there is some api issue. And we have a function called `render` that renders the list of users on the UI in case of success and logs the error in case of failure.

<div class="bad-example">

```js
function getUsers() {
	return new Promise((resolve, reject) => {
		// simulate some api call error
		reject("Network Error");
	});
}

function render() {
	getUsers()
		.catch((err) => {
			console.log("catch:", err);
		})
		.then((users) => {
			console.log("success:", users);
		});
}

render();
```

</div>

The above code will work fine if there is no error. We can replace the `reject` with the `resolve` in the `getUsers` function to see the success scenario.

**But what would happen if there is an error?**

It will output the following in the console in case of an error.

```
catch: Network Error
success: undefined
```

We are seeing the **success** message in the console even though the api call failed. This is because `then` block is executed even when there is an error. This might bring some unexpected behavior in the application.

<div class="note">

> **Note:** `catch` block is a shorthand for `Promise.prototype.then(undefined, onRejected)`. This means it also returns a `promise` and can be chained in the same way as `then` block.

</div>

**How can we fix this?**

We need to make sure to handle the **error** scenario after the `then` block.

<div class="good-example">

```js
function getUsers() {
	return new Promise((resolve, reject) => {
		// simulate some api call error
		reject("Network Error");
	});
}

function render() {
	getUsers()
		// we have moved catch block after then block
		.then((users) => {
			console.log("success:", users);
		})
		.catch((err) => {
			console.log("catch:", err);
		});
}

render();
```

</div>

The above code will output the following in the console. `then` block is never executed.

```
catch: Network Error
```

### 6. Classic newbie mistake

<div class="bad-example">

```js
function getConfig() {
	let config;

	// simulating some api call
	setTimeout(() => {
		config = {
			name: "John",
			age: 30,
		};
	}, 0);

	return config;
}

const config = getConfig();
console.log(config);
```

</div>

The above code will always output `undefined` in the console. This is because `setTimeout` is an asynchronous operation and the `getConfig` function returns `config` before the `setTimeout` callback is executed.

```
undefined
```

**How to fix this?**

There are multiple ways to fix this, but one of the ways is to use promise approach as follows:

<div class="good-example">

```js
function getConfig() {
	return new Promise((resolve, reject) => {
		// simulating some api call
		setTimeout(() => {
			const config = {
				name: "John",
				age: 30,
			};
			resolve(config);
		}, 0);
	});
}

getConfig().then((config) => {
	console.log(config);
});
```

</div>

The above code will output the following in the console.

```
{
	name: 'John',
	age: 30
}
```

## Closing Notes

We learned about common mistakes while writing asynchronous javaScript code and the ways to fix it with examples. I hope you found this article useful. If you have any questions, please post them in the comments section below.

**References**

-   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of
-   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
