---
title: Observer design pattern using javaScript
description: In this blog post, we will discuss an observer design pattern using javascript from scratch.
seoDescription: Learn to write an observer design pattern in javascript from scratch with examples to build loosely coupled and maintainable software systems
ogImage: observer-pattern.png
date: 2024-01-21
tags:
    - javaScript
    - design patterns
---

{{ description }}

{% image "observer-pattern.png", title, null, null, 'Observer Pattern' %}

## What is an Observer Pattern?

Observer design pattern is a **behavioral** pattern that allows one object to notify its change to another object without knowing the details of the other object promoting **loose coupling**. A **subject** (an object) maintains a list of **observers** (objects) and **notifies** them automatically of any changes, usually by calling one of their methods. It defines a **one-to-many** relationship between objects, such that when the subject changes state, all its dependents (observers) are notified and updated automatically.

<div class="note">

> **Note:** Behavioral pattern is concerned about **combining objects** and defining how they **communicate** with each other. The goal of this pattern is to create reusable, extensible and maintainable code. It is used to **reduce dependencies** between objects and **communicate** between disparate objects in a system.

</div>

## How to implement an observer pattern using javascript?

Let's first understand the roles and responsibilities of a **Subject**.

-   A subject should maintain a list of observers.

    => We can use an `array` to store observers.

-   A subject should provide a way to register observers.

    => We can add a `subscribe` method.

-   A subject should provide a way to cancel the observer registration.

    => We can add a `unsubscribe` method.

-   A subject should notify all observers when a change occurs in its state.

    => We can use `notify` method.

Now, let's model this using a `class` in javascript. We could also do this using a function construction and prototype but we will use class for simplicity.

```js
class Subject {
	constructor() {
		this.observers = [];
	}

	subscribe(observer) {
		this.observers.push(observer);
	}

	unsubscribe(observer) {
		this.observers = this.observers.filter((obs) => obs !== observer);
	}

	notify(change) {
		this.observers.forEach((observer) => {
			observer.update(change);
		});
	}
}
```

Now, let's go through the roles and responsibilities of an **Observer**.

-   An observer should have a method which will be called by the subject when a change occurs.

    => We can use `update` method.

```js
class Observer {
	constructor() {}

	update(message) {
		console.log(message);
	}
}
```

<div class="note">

> **Note:** Method names used in both **Subject** and **Observer** of the observer pattern are not standard. We can use any name that expresses the intent of the method as per the observer pattern standard. Also, both the subject and observers might have other properties and methods in the class representing state and other behaviours.

</div>

The following code shows how to use the observer pattern in action.

```js
// create multiple observers
const observer1 = new Observer();
const observer2 = new Observer();

// create a subject
const subject = new Subject();

// register the observers
subject.subscribe(observer1);
subject.subscribe(observer2);

// notify all observers about the change
// notify method can send anything such as a message,data,etc.
subject.notify("Hello World");
```

The above code will print the following output for each observer.

**Output**

```
Hello World
Hello World
```

If any any of the observers are not interested in receiving notifications, they can **unsubscribe** from the **subject** as follows:

```js
subject.unsubscribe(observer1);
subject.notify("Second Message");
```

When the next message is broadcasted by the **subject**, since **observer1** has already unsubscribed,
only **observer2** will receive the message.

**Output**

```
Second Message
```

<div class="note">

> **Note:** The **order** of calling the `notify` method of the `Subject` matters and should be called only after registering all the observers.
>
> </div>

So far, we have only gone through the concepts. Let's see how to use this pattern with an example.

**Imagine you are building a system for a bank to create joint accounts.** In this system, we have to notify the users when a change occurs in their account. For example, when a user withdraws money from their account, we have to notify them about the change in their account balance.

Let's create a `JointAccount` class by extending the `Subject` class which we defined earlier. This class have methods to `withdraw` and `deposit` money from the account. It also has a method to `add` an owner to the account. When an owner is added to the account, they will be automatically registered to receive notifications when a change occurs in their account.

```js
class JointAccount extends Subject {
	constructor(balance) {
		super();
		this.balance = balance;
	}

	withdraw(amount) {
		this.balance -= amount;
		// this method is inherited from Subject class
		this.notify(`${amount} withdrawn from JointAccount`);
	}

	deposit(amount) {
		this.balance += amount;
		// this method is inherited from Subject class
		this.notify(`${amount} deposited on JointAccount`);
	}

	addOwner(owner) {
		this.subscribe(owner);
	}
}
```

<div class="note">

> **Note:** Since `JointAccount` class extends `Subject`, it will have all the methods of Subject. So, we don't have to define the methods again.
>
> </div>

Now, let's create a `AccountOwner` class by extending an `Observer` class which we defined earlier.

```js
class AccountOwner extends Observer {
	constructor(name) {
		super();
		this.name = name;
	}

	// this method is inherited from Observer class
	// this method is also overridden
	update(message) {
		console.log(`${this.name} received a notification: ${message}`);
	}
}
```

Finally, it's time to create a joint account and add some owners to it.

```js
// create a joint account
const jointAccount = new JointAccount(10000);

// create two joint owners
const firstAccountOwner = new AccountOwner("Sophie");
const SecondAccountOwner = new AccountOwner("Norah");

// add joint owners to the joint account
// this will automatically register the owners to receive notifications
jointAccount.addOwner(firstAccountOwner);
jointAccount.addOwner(SecondAccountOwner);
```

To test the notification, we can `withdraw` some money from the joint account and see what happens.

```js
jointAccount.withdraw(1000);
```

When we `withdraw` money from the joint account, the `notify` method of the `Subject` class will be called which will in turn call the `update` method of the `AccountOwner` class.

**Output**

```
Sophie received a notification: 1000 withdrawn from JointAccount
Norah received a notification: 1000 withdrawn from JointAccount
```

Also, let's `deposit` some money in the joint account and see what happens.

```js
jointAccount.deposit(1000);
```

When we `deposit` money in the joint account, it is the same behaviour as the `withdraw` method.

**Output**

```
Sophie received a notification: 1000 deposited on JointAccount
Norah received a notification: 1000 deposited on JointAccount
```

If Sophie is not interested in receiving notifications, she can unsubscribe from the joint account as follows:

```js
jointAccount.unsubscribe(firstAccountOwner);
jointAccount.deposit(5000);
```

Since Sophie has unsubscribed from the joint account, only Norah will receive the deposit notifications.

Output

```
Norah received a notification: 5000 deposited on JointAccount
```

## Closing Notes

The above example is a very simple example of the observer pattern but it can be used to build complex systems too.
The only dependency between the `JointAccount` and `AccountOwner` is the `update` method. So, we can easily add new observers without changing the subject. Also, we can easily add new subjects without changing the observers.

Deciding on which pattern to use is not always easy and there are many variables to consider depending on the nature of the system. Further, the same system can be designed using different patterns. So, it is important to understand the pros and cons of each pattern and choose the right one for the system.

Some of the key points to remember about the observer pattern are:

-   It helps to create **loosely coupled system**.
-   It defines a **one-to-many** relationship between objects.
-   It's main goal is to **reduce** dependencies between objects. The only information the subject knows about an observer is that it has some method that can be called when some event occurs or some state changes on the subject.
-   It is used to build **event-driven** systems.

If you have any questions or feedback, please feel free to comment below.
