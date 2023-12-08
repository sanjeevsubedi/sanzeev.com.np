---
title: Feature Flags
description: In this article, I will discuss feature flags, its advantages, disadvantages and demonstrate sample code using openFeature javaScript client library.
date: 2023-11-25
tags:
    - velocity
    - feature flags
---

{{ description }}

{% image "feature-flags.png", title %}

## What are feature flags?

-   Feature flags are simply a feature **toggle** or **switch** which controls the **visibility** of features or code path to targeted audience without modifying the source code at **run time**.

-   These help to control the behaviour of the product.

-   These act as a **gatekeeper** to your feature.

> At a glance, feature flags look like just a simple _conditional check_ which wraps the feature, but it becomes very powerful when we use contextual information to determine its values which we call as **targeting** or **audience aware** feature flags.

```ts
// 'showBannerFeatureFlag' can consist of permutation of contextual data to derive its value.
// Management of its value is the responsibility of the independent feature flag management tool.

if (showBannerFeatureFlag) {
	// show banner to the audience
} else {
	// hide banner to the audience
}
```

## What are the advantages of feature flags?

**1. Decouple feature rollout and deployment**

Feature flags decouple deployment from feature release and promote progressive delivery (canary release).
Once the feature flag is integrated, we can continue to push experimental or unfinished feature code but these need to be hidden using the feature flag. Once the feature is ready, we can easily switch the feature on without deployment.

> Rollout of a feature can be controlled from an isolated feature flag management system without deployment of the source code.

**2. Test features in production with confidence**

This is very powerful because nothing is better than testing product features in an actual production environment.
Features can be turned on to the subset of **internal users** to test in production without affecting other users. This helps to understand the impact of the update before releasing the feature to all users.

If there are issues while testing, we can turn off the flag, and once everything looks good, we can enable the feature flag again.

**3. Release features to targeted audience**

Feature flags are very useful for feature **experimentation**.
We can create targeting rules based upon different criteria. Following are some of the popular contextual information.

-   individual users
-   groups/ cohorts
-   location
-   traffic %
-   internal users
-   channel (mobile web, desktop web, native app etc)

Let's say we have two variants of a button, RED button and YELLOW button.

For example, we can release the RED button to the audience having the following context.

-   US Site
-   Channel is Web
-   users: userid1, userid2

> This is targeted only for 2 specific users for a US site on a web channel.

Likewise, we can release the YELLOW button to the audience with the following context.

-   DE site
-   traffic: 50%
-   channel: native

> This is targeted for 50% of DE traffic coming from native channels.

Further, with the permutation of complex rules, we can achieve advanced audience targeting.

**4. Improves the velocity by releasing features in small batches**

Feature flag has promoted **trunk based** development. It is a practice where developers merge small frequent updates/PRs to the core trunk or main branch. There is no separate 'release' branch which is created to release the feature at some point in the future. Developers can continue to build a new feature by turning the feature flag off and deploying to master at any time even before a feature is completed. It also prevents merge conflicts/merge hell caused by the state long-lived branches. Since the PR is small, it is easier to review too.

**5. Reduce risk on high traffic area**

Since the controlled testing can be performed on a targeted audience, it reduces the risk of affecting all users on high traffic areas and promotes quick, safe and high quality releases.

**6. Flexible rollout**

Since feature flags management is decoupled from the feature codebase, anyone who has authority to release the feature can do it from the feature flag management tool anytime they want. There is no need for a developer to release the feature. Product managers can release the feature in absence of a developer. Feature flag management tool is very easy to use and similar to CMS where we simply turn on and off a feature with the intuitive user interface.

## How to use a feature flag?

The following is the sample code which uses **openfeature** javaScript SDK client in a node.js app.

```ts
import { OpenFeature, InMemoryProvider } from "@openfeature/server-sdk";

const myFlags = {
	showBanner: {
		variants: {
			on: true,
			off: false,
		},
		disabled: false,
		defaultVariant: "on",
	},
};

// Register your feature flag provider
// Note: we created a provider with some dummy data.
// But we can create a provider that talks to the real feature flag management tool.
await OpenFeature.setProviderAndWait(new InMemoryProvider(myFlags));

// Create a new client
const client = OpenFeature.getClient();

// Evaluate feature flag
const showBanner = await client.getBooleanValue("showBanner", false);

// showBanner evaluates to true since the defaultVariant is set to "on" and "on" is set to true
if (showBanner) {
	console.log("banner is visible");
}
```

Github link: [https://github.com/sanjeevsubedi/feature-flags](https://github.com/sanjeevsubedi/feature-flags)

> Note: In the above example, feature variant is of _boolean_ type, but it can be _string_, _number_ or an _object_ too. When the variant type changes, we also need to change the evaluation method to _getStringValue_, _getNumberValue_ or _getObjectValue_ respectively.

## What are the costs of a feature flag?

-   Since feature flags are created and maintained in a separate system, there is a **runtime cost** of making an API call to get the value of a feature flag. This should not be a matter of concern if the API is implemented using proper caching strategies.

-   There is a **tech debt** associated with each feature flag. Once the feature is fully released, we need to remove the if/else statement along with the test cases.

-   There is a need to write **tests** for both feature on/off cases.

## Conclusion

Feature flags should be thought of from the very beginning and should be part of the **rollout** plan. It is very important to set up the milestone for enabling and disabling feature flags. We often forget to clean up the feature flag when we complete the 100% release. Effective integration and implementation of feature flags is dependent on the governance rules of feature flags.

**References**

-   https://openfeature.dev/docs/reference/concepts/evaluation-api/

**Attributions**

-   https://www.figma.com/community/file/1164674624510852419
-   https://www.figma.com/community/file/977510812493321569
