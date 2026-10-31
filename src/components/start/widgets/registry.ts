// Every widget type's view, settings form and defaults. The catalogue (names, tiers) is START_WIDGETS in start-plans.
import { INFO_WIDGETS } from "./info";
import { LINK_WIDGETS } from "./links";
import { MEDIA_WIDGETS } from "./media";
import { PRODUCTIVITY_WIDGETS } from "./productivity";
import type { WidgetModule } from "./types";

export const WIDGETS: Record<string, WidgetModule> = { ...LINK_WIDGETS, ...PRODUCTIVITY_WIDGETS, ...INFO_WIDGETS, ...MEDIA_WIDGETS };
