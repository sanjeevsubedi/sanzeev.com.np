---
title: Writing unit tests for asynchronous Angular Service methods
description: How to test angular services consisting of observable, promise, setTimeout () and delay () ?
seoDescription: How to test angular services consisting of observable, promise, setTimeout () and delay () ?
date: 2023-01-08
tags:
    - angular
    - testing
---

{{ description }}

{% image "unit-test-async-angular-service.png", title %}

## 1. Testing service method returning observable

Let’s first go through the following service (user.service.ts)

-   It has 1 dependency on _HttpClient_.
-   It has 1 method called _getUsers_ which returns an _observable_ of users modelled by _User_ interface

> Note: There is a misconception that observable is always asynchronous, but this is not true. It can be synchronous too.

_user.service.ts_

```ts
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

// User model
export interface User {
	completed: boolean;
	id: number;
	title: string;
	userId: number;
}

@Injectable({
	providedIn: "root",
})
export class UserService {
	API_URL: string = "https://jsonplaceholder.typicode.com/todos";

	constructor(private httpClient: HttpClient) {}

	getUsers(): Observable<User[]> {
		return this.httpClient.get<User[]>(this.API_URL);
	}
}
```

Before we dive into the unit testing code, let’s first visualize the things that are needed for the test.

-   Firstly, in order to write unit test for service in test, we first need to **create an instance** of the service class. Then only we can test the methods, properties that are part of this instance.
-   Secondly, if the service has any dependencies, we need to mock the real dependency with the mocked version of it. The main goal of unit testing is to test the service in test in **isolation**.

> It is very difficult to create the instance of real **dependencies** since those might not be in our control and sometimes it does not make sense to use the real dependencies. For example, in user.service.ts, _getUsers_ method makes the real api call. We don’t want to hit the database while running our unit tests.

-   Thirdly, there are 2 major ways to fake the real dependency.

    -   Create a separate mock class which has similar methods to the real dependency.

    -   Use **Spy** on the **real** dependency to only replace the behaviour of the methods that we are testing. This is the **preferred approach** since it is easy and fast to fake the real dependency.

-   Fourth, inject the fake dependencies on the **constructor** of the service in test. Now, we have an **instance** of service with all the dependencies.

Let’s see in action now 😺

_user.service.spec.ts_

```ts
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { User, UserService } from "./user.service";

describe("UserService", () => {
	let userService: UserService;
	// spy/replace only the 'get' method of the real HttpClient instance.
	// all other methods are intact.
	// 'get' method will be replaced with a new mock function which returns undefined
	let mockHttpClient: jasmine.SpyObj<HttpClient> = jasmine.createSpyObj(
		"HttpClient",
		["get"]
	);

	beforeEach(() => {
		// new instance will be created for each test case since
		// beforeEach runs before each test case.
		userService = new UserService(mockHttpClient);
	});

	it("#getUsers should return observable of  users", () => {
		// arrange/setup all deps, data required for the service method in test.
		const mockUsers: User[] = [
			{
				userId: 1,
				id: 1,
				title: "delectus aut autem",
				completed: false,
			},
			{
				userId: 2,
				id: 2,
				title: "my test",
				completed: false,
			},
		];

		// replace the return value of 'get' method to be observable of users.
		// we need to simulate what the real api will return.
		// tests are good as long as mock is done correctly.
		// since 'getUsers' method is calling httpClient.get,
		// we need this before we execute the method we want to test.
		mockHttpClient.get.and.returnValue(of(mockUsers));

		console.log("start");

		// act/invoke
		userService.getUsers().subscribe((response: User[]) => {
			console.log(response, "inside subscribe");

			// assertion/expectation
			expect(response.length).toBe(2);

			console.log("after first expect");

			expect(mockHttpClient.get).toHaveBeenCalledOnceWith(
				"https://jsonplaceholder.typicode.com/todos"
			);

			console.log("finish expect");
		});

		console.log("end");
	});
});
```

> Note: In the spec above, we are simulating that userService.getUsers() returns a synchronous observable. All the tests got passed.

{% image "synchronous-observable-unit-testing.png", "synchronous observable unit testing with jasmine/karma", null, null, "synchronous observable unit testing with jasmine/karma" %}

Let’s twist the scenario a little bit by simulating an **async** observable by adding a delay of 3000ms on the mock observable below. I have applied a delay method from rxjs, **import { delay } from ‘rxjs’;**

```ts
it('#getUsers should return observable of  users', () => {
  // arrange
  const mockUsers: User[] = [...]; // same list of users as above

    // simulating an async observable by adding a delay of 3000ms.
    mockHttpClient.get.and.returnValue(of(mockUsers).pipe(delay(3000)));

    console.log('start');

    // act/invoke
    userService.getUsers().subscribe((response: User[]) => {
      console.log(response, 'inside subscribe');

      // assertion/expectation
      expect(response.length).toBe(2);

      console.log('after first expect');

      expect(mockHttpClient.get).toHaveBeenCalledOnceWith(
        'https://jsonplaceholder.typicode.com/todos'
      );

      console.log('finish expect');
    });

    console.log('end');
});

```

As we can see below on the log, **subscriber/observer** (callback function passed on the subscribe function) got executed at the end of the test execution since there is a delay of 3000ms. Also, all **assertions** (expect) never got executed. Since, there were no errors on the log, we might think that everything has passed correctly, but that is not true and we need to be cautious on this kind of scenario. Even if we change the value of **response.length** from **2** to **200**, we will still not see any errors on the test log because _expect_ will never be invoked.

{% image "async-observable-unit-testing.png", "asynchronous observable unit testing with jasmine/karma", null, null, "asynchronous observable unit testing with jasmine/karma" %}

**How to fix this issue?**

_Solution 1: done() method_

This is an _action_ method that should be called when the async work is complete.

```ts
it('#getUsers should return observable of  users', (done: DoneFn) => {
    // arrange
    const mockUsers: User[] = [...]; // same list of users as above

    // simulating an async observable by adding a delay of 3000ms.
    mockHttpClient.get.and.returnValue(of(mockUsers).pipe(delay(3000)));


    console.log('start');

    // act/invoke
    userService.getUsers().subscribe((response: User[]) => {
      console.log(response, 'inside subscribe');

      // assertion/expectation
      expect(response.length).toBe(2);

      console.log('after first expect');

      expect(mockHttpClient.get).toHaveBeenCalledOnceWith(
        'https://jsonplaceholder.typicode.com/todos'
      );

      console.log('finish expect');

      //async work is complete
      done();
    });

    console.log('end');
  });

```

As per the log below, it can be verified that all of our tests have now passed.

{% image "async-observable-unit-testing-success.png", 'asynchronous observable unit testing with jasmine/karma' %}

> If the delay time is more than the default interval timeout set by your test framework, then we will get an error. In case of jasmine, it is 5000ms. If I change the delay time to 6000ms, we will see the following error because 6000ms is greater than 5000ms. So, we need to make sure the delay time is always less than the default interval timeout or increase it appropriately.

{% image "delay-error.png", 'asynchronous observable unit testing with jasmine/karma' %}

_Solution 2: Using fakeAsync and tick()_

-   fakeAsync is a special zone that helps to test asynchronous code in a **synchronous** way.
-   tick() method can only be called inside the fakeAsync zone. It **moves forward or advances** the virtual clock by the number of milliseconds passed as an argument or 0 by default.

```ts
it('#getUsers should return observable of  users', fakeAsync(() => {
    const mockUsers: User[] = [...]; // same list of users as above

    // simulating an async observable by adding a delay of 3000ms.
    mockHttpClient.get.and.returnValue(of(mockUsers).pipe(delay(3000)));

    console.log('start');

    // act/invoke
    userService.getUsers().subscribe((response: User[]) => {
      console.log(response, 'inside subscribe');

      // assertion/expectation
      expect(response.length).toBe(2);

      console.log('after first expect');

      expect(mockHttpClient.get).toHaveBeenCalledOnceWith(
        'https://jsonplaceholder.typicode.com/todos'
      );

      console.log('finish expect');
    });

    tick(3000);

    console.log('end');
  }));
```

> In the above code, we are simulating the passage of 3000 milliseconds with tick(3000). Also, the log below shows that test execution is synchronous because the order of console.log() is exactly the same as in the code even though there is a delay of 3000 ms. Compare this with the test log of Solution 1 where the order doesn’t match.

{% image "delay-error.png", 'fake async and tick' %}

## 2. Testing service method returning observable with delay

This is an extension to the scenario of testing service method returning observable with a **delay**.

_user.service.ts_

```ts
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, delay } from "rxjs";

// User model
export interface User {
	completed: boolean;
	id: number;
	title: string;
	userId: number;
}

@Injectable({
	providedIn: "root",
})
export class UserService {
	API_URL: string = "https://jsonplaceholder.typicode.com/todos";

	constructor(private httpClient: HttpClient) {}

	getUsers(): Observable<User[]> {
		return this.httpClient.get<User[]>(this.API_URL).pipe(delay(3000));
	}
}
```

In this case also, we will get the exact same errors that we saw above, and we can apply the same exact solutions above to fix the issues. Don’t forget to remove the **delay** from the spec file to only have **mockHttpClient.get.and.returnValue(of(mockUsers))** because the **getUsers** function already has the **delay** inside the pipe function. If we want to have delay on both **httpClient.get** and **pipe** method then we need to have **tick(600)** to simulate the time passage of 3000ms for httpClient.get and 3000ms for delay inside pipe function.

## 3. Testing service method returning promise

We have the same service and the same method, but now the _getUsers_ method returns **promise** instead of an observable.

_user.service.ts_

```ts
import { Injectable } from "@angular/core";

// User model
export interface User {
	completed: boolean;
	id: number;
	title: string;
	userId: number;
}

@Injectable({
	providedIn: "root",
})
export class UserService {
	API_URL: string = "https://jsonplaceholder.typicode.com/todos";

	constructor() {}

	getUsers(): Promise<User[]> {
		return fetch(this.API_URL).then((res: Response) => res.json());
	}
}
```

> Note: res.json () is a method of Body interface, and Response implements Body.

{% image "response.png", "http response", null, null, "Response Interface" %}

{% image "body.png", "http body", null, null, "Body Interface" %}

Since we are using **fetch** method of **window** object, we don’t want to make the real api call. So, we need to mock the fetch method, and we are spying to achieve that.

> Note: Consider spying as replacing the original method with the mock/ fake version of your own.

_user.service.spec.ts_

```ts
it('#getUsers should return promise of users', () => {
    // arrange
    const mockUsers: User[] = [...]; // same list of users as above

    const responseStub: any = new Promise((resolve, reject) => {
      const resBody = {
        json() {
          return Promise.resolve(mockUsers);
        },
      };
      resolve(resBody);
    });

    // replace the original implementation with your own fake version (stub)
    spyOn(window, 'fetch').and.returnValue(responseStub);


    console.log('start');

    // act
    userService.getUsers().then((response: User[]) => {
      console.log(response, 'inside promise');

      // assertion
      expect(response.length).toBe(2);

      console.log('after first expect');

      expect(window.fetch).toHaveBeenCalledOnceWith(
        'https://jsonplaceholder.typicode.com/todos'
      );

      console.log('finish expect');
    });

    console.log('end');
})
```

Based upon the above test, all assertions (expect) did not got executed and we can see the error on the following log too. The reason for this is the asynchronous nature of promise. The **callback** that we add on the ‘then’ function (thennable) is added to the **microtask queue** and not executed immediately. So, not everything inside ‘then’ callback will be guaranteed to execute on time set up by your test framework.

> I highly recommend to learn **event loop** in javaScript to learn about how callbacks are stored on different queues and executed with different priorities.

{% image "promise-unit-testing.png", "http response", null, null, "Promise unit testing with karma/jasmine" %}

**How to fix this issue?**

_Solution 1: Using done() method_

This is similar to how we solved for function returning observable. This approach will wait until you call this method or the default time of your testing framework expires.

```ts
it('#getUsers should return promise of users', (done: DoneFn) => {
    // arrange
    const mockUsers: User[] = [...]; // same list of users as above

    const responseStub: any = new Promise((resolve, reject) => {
      const resBody = {
        json() {
          return Promise.resolve(mockUsers);
        },
      };
      resolve(resBody);
    });

    spyOn(window, 'fetch').and.returnValue(responseStub);

    console.log('start');

    // act
    userService.getUsers().then((response: User[]) => {
      console.log(response, 'inside promise');

      //assertion
      expect(response.length).toBe(2);

      console.log('after first expect');

      expect(window.fetch).toHaveBeenCalledOnceWith(
        'https://jsonplaceholder.typicode.com/todos'
      );

      console.log('finish expect');

      //async work is complete
      done();
});

console.log('end');
});
```

As per the log below, it can be verified that all of our tests have now passed. Keep in mind that the tests are not synchronous. We can see _'end'_ on the log first before the assertions (expect).

{% image "promise-unit-testing-done.png", "Promise unit testing with karma/jasmine", null, null, "Promise unit testing with karma/jasmine" %}

_Solution 2:_
We can use any of the following 3 solutions to solve the issue.

-   fakeAsync and flushMicrotasks()

    **fakeAsync** runs the asynchronous tests synchronously in a fakeAsync zone and **flushMicrotasks()** clear pending microtasks from microtask queue. In other words ‘flushMicrotasks’ method resolves the pending promises.

-   fakeAsync and flush()

    **flush()** flushes any pending microtasks from the microtask queue and simulates the asynchronous passage of time for the timers in the `fakeAsync` zone by draining the **macrotask** queue until it is empty.

    > Note: callback passed in setTimeout is stored in macrotask queue whereas callback passed in ‘then’ function of promise is stored in the microtask queue.

-   fakeAsync and tick()

    **tick()** flushes any pending **microtasks** from the microtask queue, simulates the asynchronous passage of time for the timers in the `fakeAsync` zone and after that timer callback will be executed.

> Since all of the 3 above solutions drains the microtasks queue, any method can be used.

```ts
it('#getUsers should return promise of users', fakeAsync(() => {
    // arrange
    const mockUsers: User[] = [...]; // same list of users as above

    const responseStub: any = new Promise((resolve, reject) => {
      const resBody = {
        json() {
          return Promise.resolve(mockUsers);
        },
      };
      resolve(resBody);
    });

    let usersCount = 0;

    spyOn(window, 'fetch').and.returnValue(responseStub);

    console.log('start');

    // act
    userService.getUsers().then((response: User[]) => {
      console.log(response, 'inside promise');
      usersCount = response.length;
    });

    // use any of the 3 methods to flush microtask queue.
    // in order words, we can resolve the promise using any of the following 3 methods
    flushMicrotasks();
    // flush();
    // tick();

    //assertion
    expect(usersCount).toBe(2);

    console.log('after first expect');

    expect(window.fetch).toHaveBeenCalledOnceWith(
      'https://jsonplaceholder.typicode.com/todos'
    );

    console.log('finish expect');

    console.log('end');
  }));
```

All tests are passing now. One thing to observe is that tests are running synchronously and _'end'_ is at the very bottom on the following log.

{% image "promise-async-test-fakeasync.png", 'promise test using fake async and tick', null, null, "promise unit testing with karma/jasmine" %}

## 4. Testing service method returning promise with setTimeout

This is an extension to the scenario of testing service method returning promise with **setTimeout**.

_user.service.ts_

```ts
mport { Injectable } from '@angular/core';

// User model
export interface User {
  completed: boolean;
  id: number;
  title: string;
  userId: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  API_URL: string = 'https://jsonplaceholder.typicode.com/todos';

  constructor() {}

  getUsers(): Promise<User[]> {
    return fetch(this.API_URL).then((res: Response) =>
      res.json().then(
        (users: User[]) =>
          new Promise((resolve) => {
            // add delay to mimic other async calls
            setTimeout(() => {
              resolve(users);
            }, 2000);
          })
      )
    );
  }
}
```

In this scenario, **flushMicrotasks()** will not work because _setTimeout_ is not a **microtask** but rather it is a macrotask which can only be flushed using either **tick()** or **flush()**. In addition, these methods will first resolve the promise (flush the microtask queue) and then fast forward the timer with the number of milliseconds passed as the arguments.

_user.service.spec.ts_

```ts
  it('#getUsers should return promise of users', fakeAsync(() => {
    // arrange
    const mockUsers: User[] = [...]; // same list of users as above

    const responseStub: any = new Promise((resolve, reject) => {
      const resBody = {
        json() {
          return Promise.resolve(mockUsers);
        },
      };
      resolve(resBody);
    });

    let usersCount = 0;

    spyOn(window, 'fetch').and.returnValue(responseStub);

    console.log('start');

    // act
    userService.getUsers().then((response: User[]) => {
      console.log(response, 'inside promise');
      usersCount = response.length;
    });


    // use any of the 2 methods to flush microtask queue + advance the timer of 2000ms
    tick(2000);
    // flush();

    //assertion
    expect(usersCount).toBe(2);

    console.log('after first expect');

    expect(window.fetch).toHaveBeenCalledOnceWith(
      'https://jsonplaceholder.typicode.com/todos'
    );

    console.log('finish expect');

    console.log('end');
  }));
```

## Conclusion

In this post, we learned how to test asynchronous service methods returning promises and observables including setTimeout() and delay() with the help of the following:

-   fakeAsync()
-   tick()
-   flush()
-   flushMicrotasks()
-   done()
-   jasmine spy
