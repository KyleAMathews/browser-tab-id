# browser-tab-id
Library to get a unique integer id for each tab running the same app. Defaults to getting lowest positive integer.

Handles multiple tabs opening concurrently.

## Usage

```ts
import { TabIdCoordinator } from "browser-tab-id"

// Access the assigned tab ID.
tabIdCoordinator.tabId
```

