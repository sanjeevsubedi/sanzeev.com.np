---
title: How to make Angular component Test resilient and refactor friendly?
description: In this article, I will be discussing two strategies to make the Angular component test resilient and refactor friendly.
seoDescription: Ways to make the Angular component test resilient and refactor friendly without relying on the internal state of a component and using resilient selectors.
date: 2022-12-28
tags:
    - angular
    - testing
---

{{ description }}

{% image "resilience-angular-component-tests.png", title %}

## 1. Don’t test component state (internal implementation)

One of the main disadvantage of testing state is that it is very prone to breakage from future code refactor or new feature addition.

I am going to illustrate this with the help of the following code which is taken directly from the official angular website.

**light-switch.component.ts**

```ts
import { Component } from "@angular/core";

@Component({
	selector: "lightswitch-comp",
	template: `
		<button type="button" (click)="clicked()">Click me!</button>
		<span>{{'{{ message }}'}}</span>
	`,
})
export class LightswitchComponent {
	isOn = false;

	clicked() {
		this.isOn = !this.isOn;
	}

	get message() {
		return `The light is ${this.isOn ? "On" : "Off"}`;
	}
}
```

**light-switch.component.spec.ts**

```ts
import { LightswitchComponent } from "./light-switch.component";

describe("LightswitchComp", () => {
	it("#clicked() should toggle #isOn", () => {
		const comp = new LightswitchComponent();
		expect(comp.isOn).withContext("off at first").toBe(false);
		comp.clicked();
		expect(comp.isOn).withContext("on after click").toBe(true);
		comp.clicked();
		expect(comp.isOn).withContext("off after second click").toBe(false);
	});

	it('#clicked() should set #message to "is on"', () => {
		const comp = new LightswitchComponent();
		expect(comp.message)
			.withContext("off at first")
			.toMatch(/is off/i);
		comp.clicked();
		expect(comp.message).withContext("on after clicked").toMatch(/is on/i);
	});
});
```

There are few problems with this approach of testing a component.

-   If `isOn` got changed to `toggle`, it will break the test.
-   If `message` got changed to `toggleInfo`, it will break the test.

**light-switch.component.ts (modified version)**

```ts
import { Component } from "@angular/core";

@Component({
	selector: "lightswitch-comp",
	template: `
		<button type="button" (click)="clicked()">Click me!</button>
		<span>{{'{{ toggleInfo }}'}}</span>
	`,
})
export class LightswitchComponent {
	toggle = false;

	clicked() {
		this.toggle = !this.toggle;
	}

	get toggleInfo() {
		return `The light is ${this.toggle ? "On" : "Off"}`;
	}
}
```

> With the above changes, test will fail even though the feature itself is not broken.

Now, let me ask you few questions.

-   Do end users really care about these changes?
-   Will these changes impact how the end users see your component?

> Note: End users are those who uses your app on the browser.

I guess the answer is **NO**.

Even though the actual behaviour of the component has not changed at all from the **end user’s perspective**, above changes on the `LightswitchComponent.ts` will break the test. But it should only break if there are genuine issues such as user not able to see the correct message or toggle button not working as expected which users care about the most.

## How to fix this ?

> Component should be tested against the DOM (Document Object Model) rather than the internal state.

This is the **modified version** of test for the same component.

**light-switch.component.spec.ts (modified version)**

```ts
mport { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LightswitchComponent } from './light-switch.component';

describe('LightswitchComponent', () => {
  let component: LightswitchComponent;
  let fixture: ComponentFixture<LightswitchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightswitchComponent],
    }).compileComponents();

    // creates an instance of the LightswitchComponent
    // and adds a corresponding element to the test-runner DOM.
    // this is equivalent to rendering a component
    fixture = TestBed.createComponent(LightswitchComponent);
    component = fixture.componentInstance;
  });

  it('#clicked() should set #message to "is on"', () => {
    // selectors
    const toggleButton = fixture.debugElement.query(By.css('button'));
    const message = fixture.debugElement.query(By.css('span'));

    // simulate button click
    toggleButton.triggerEventHandler('click');
    // binding happens when Angular performs change detection
    fixture.detectChanges();

    // assertion for toggle on scenario
    expect(message.nativeElement.textContent)
      .withContext('on after clicked')
      .toMatch(/is on/i);

    // simulate button click
    toggleButton.triggerEventHandler('click');
    // binding happens when Angular performs change detection
    fixture.detectChanges();

    // assertion for toggle off scenario
    expect(message.nativeElement.textContent)
      .withContext('off after clicked')
      .toMatch(/is off/i);
  });
});
```

In the above modified code, we did the following tasks sequentially.

-   **Render** the LightswitchComponent component.
-   **Get** the **toggle button** and **message span** html element using `By.css ()` method provided by angular.
-   Trigger the **click** event and run change detection to allow DOM binding.
-   Write **test assertion** to make sure we get proper message when we click the button multiple times (toggle scenario).

> With this change, component tests will **not fail** as a result of change in the internal state.

## 2. Use resilient CSS selectors

In the above component DOM testing, we saw that we are using the following selectors:

```ts
// selectors
const toggleButton = fixture.debugElement.query(By.css("button"));
const message = fixture.debugElement.query(By.css("span"));
```

There are still few problems with the way we are traversing the DOM to find the desired selector.

-   What will happen if we change `span` to `div` to display the message and apply the exact same styles of span on `div` ? ( This should not impact end user because message will still render in the same old way on the browser.)
-   What will happen if we add a **new button** just above the old button ?

**light-switch.component.ts (modified version)**

```ts
import { Component } from "@angular/core";

@Component({
	selector: "lightswitch-comp",
	template: `
		<button type="button" (click)="clickedNewFeature()">
			New Feature click me !
		</button>
		<button type="button" (click)="clicked()">Click me!</button>
		<div>{{'{{ message }}'}}</div>
	`,
})
export class LightswitchComponent {
	isOn = false;

	clicked() {
		this.isOn = !this.isOn;
	}

	clickedNewFeature() {
		// ...
	}

	get message() {
		return `The light is ${this.isOn ? "On" : "Off"}`;
	}
}
```

With either of above changes, component test will **break**.

> Even if we try to use a **class** on the button as follows, the test will still fail.
>
> > Note: `primary-button` class has been added.

**light-switch.component.ts (modified version)**

```ts
template: `
    <button class="primary-button" type="button" (click)="clickedNewFeature()">
      New Feature click me !
    </button>
    <button class="primary-button" type="button" (click)="clicked()">Click me!</button>
    <div>{{'{{ message }}'}}</div>
  `,
```

**light-switch.component.spec.ts (modified version)**

```ts
// selectors
const toggleButton = fixture.debugElement.query(By.css(".primary-button"));
```

Note: Both `By.css (".primary-button")` or `By.css (button)` gives the first found button selector which is a new button that we recently added and not the old button.

> We could have used a unique id or class on html elements, but these should be primarily used for styling purpose only. If we use them in component test, we are creating a **tight coupling** between the **presentation layer** and the **test**, and this is a seed for a brittle test.

## How to fix this ?

We need to look for some meaningful **unique metadata** on the element we’re trying to select in order to solve the problem.

I have added the following attributes.

-   A `name` attribute on the button.
-   A `data-testid` attribute on the div which contains the message.

> Note: We can always remove custom `data-*` attribute if we don’t it to be part of the production bundle by simply creating an **angular directive**.

**light-switch.component.ts (modified version)**

```ts
@Component({
  selector: 'lightswitch-comp',
  template: `
    <button name="new" type="button" (click)="clickedNewFeature()">
      New Feature click me !
    </button>
    <button name="toggle" type="button" (click)="clicked()">Click me!</button>
    <div data-testid="message">{{'{{ message }}'}}</div>
  `,
})
```

**light-switch.component.spec.ts (modified version)**

```ts
it('#clicked() should set #message to "is on"', () => {
	// selectors
	const toggleButton = fixture.debugElement.query(
		By.css(`button[name='toggle']`)
	);
	const message = fixture.debugElement.query(
		By.css(`[data-testid='message']`)
	);

	// simulate button click
	toggleButton.triggerEventHandler("click");
	// binding happens when Angular performs change detection
	fixture.detectChanges();

	expect(message.nativeElement.textContent)
		.withContext("on after clicked")
		.toMatch(/is on/i);

	// simulate button click
	toggleButton.triggerEventHandler("click");
	// binding happens when Angular performs change detection
	fixture.detectChanges();

	expect(message.nativeElement.textContent)
		.withContext("off after clicked")
		.toMatch(/is off/i);
});
```

**Everything will pass now** 😄

> Note: The only time the **value** of `name` attribute will change is when the product requirement changes. So, **toggle** will always be **toggle** and is not coupled with UI/UX in any way (separation of concern).

Furthermore, I think `data-testid` attribute will also help in the **E2E testing**. But if you need to get rid of it, the following directive does the job.

**data-testid.directive.ts**

```ts
import { environment } from "./../environments/environment";
import { Directive, ElementRef, Renderer2 } from "@angular/core";
@Directive({
	selector: "[data-testid]",
})
export class DataTestidDirective {
	constructor(private el: ElementRef, private renderer: Renderer2) {
		if (environment.production) {
			this.renderer.removeAttribute(this.el.nativeElement, "data-testid");
		}
	}
}
```

## Alternative solution to attributes

Instead of using attributes such as `name`, `data-testid` and so on, another alternative would be to find the selector with the desired **text content**. In general, text content is unique in a component among all the elements contained within it. So, we can create some custom helper function for this as follows:

**test.util.ts**

```ts
function getSelectorByText(
	node: HTMLElement,
	text: string
): HTMLElement | undefined {
	if (node?.innerHTML?.trim() === text) {
		return node;
	}

	for (let i = 0; i < node.children.length; i++) {
		const found = getSelectorByText(node.children[i] as HTMLElement, text);
		if (found) {
			return found;
		}
	}

	return undefined;
}
```

Now, we can use the helper function on our test file as follows. Also, there are no `data-testid` and `name` attributes anymore.

**light-switch.component.ts (modified version)**

```ts
@Component({
  selector: 'lightswitch-comp',
  template: `
    <button type="button" (click)="clickedNewFeature()">
      New Feature click me !
    </button>
    <button type="button" (click)="clicked()">Click me!</button>
    <div>{{'{{ message }}'}}</div>
  `,
})
```

**light-switch.component.spec.ts (modified version)**

```ts
it('#clicked() should set #message to "is on"', () => {
	const toggleButton = getSelectorByText(
		fixture.debugElement.nativeElement,
		"Click me!"
	);

	// simulate button click
	toggleButton?.click();
	// binding happens when Angular performs change detection
	fixture.detectChanges();

	const message = getSelectorByText(
		fixture.debugElement.nativeElement,
		"The light is On"
	);

	expect(message?.textContent)
		.withContext("on after clicked")
		.toMatch(/is on/i);

	// simulate button click
	toggleButton?.click();
	// binding happens when Angular performs change detection
	fixture.detectChanges();

	expect(message?.textContent)
		.withContext("off after clicked")
		.toMatch(/is off/i);
});
```

Furthermore, we can also combine both `data-testid` and `getSelectorByText` approach together.

## Why is text content better than id, class and element selectors?

-   The main reason is that **text content** does not change that often compared to selectors. Once we setup the mock data for tests, it doesn't change frequently. Don't you agree with me? 😄
-   Tests using **text content** won't break with the change in class, id and element selectors. For example, in the below component, class name for button can change from `primary-button` to `secondary-button` due to the change in requirements (UI). If the class name is referenced in test, it will **fail** because a button with `primary-button` class does not exist anymore.

**component before `class` change**

```ts
@Component({
  selector: 'lightswitch-comp',
  template: `
    <button class="primary-button" type="button" (click)="clicked()">Click me!</button>
    <span class="message">{{'{{ toggleInfo }}'}}</span>
  `,
})
```

**component after `class` change**

```ts
@Component({
  selector: 'lightswitch-comp',
  template: `
    <button class="secondary-button" name="toggle" type="button" (click)="clicked()">Click me!</button>
    <span class="message">{{'{{ toggleInfo }}'}}</span>
  `,
})
```

Imagine if we have relied on the **text content** for button while writing tests, it will not break even with the change in class name. Which one is highly likely to change, **class name** or **text content** ?

Of course, there are situations when the text content also changes, but in that scenario, we also need to make the corresponding changes on the test. This is expected and the main goal is to make our test less brittle and resilient with minimal changes.

> There are also situations where we **need** to use class, id or element selectors, but we need to discourage it's general use in tests.

## Conclusion

In this post we learned

-   how to make Angular component test resilient and refactor friendly without relying on the internal state of a component.
-   how to use resilient selectors using unique attributes and `getSelectorByText` method to select the html element instead of class, ids and HTML tags.
-   how to create a directive to remove the `data-testid` attribute from the prod environment bundle.
