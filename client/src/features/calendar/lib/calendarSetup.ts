import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import duration from "dayjs/plugin/duration";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import updateLocale from "dayjs/plugin/updateLocale";
import { dayjsLocalizer } from "react-big-calendar";

dayjs.extend(isBetween);
dayjs.extend(duration);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(updateLocale);

// Set Monday as first day of week (0 = Sunday, 1 = Monday)
dayjs.updateLocale("en", { weekStart: 1 });

export const localizer = dayjsLocalizer(dayjs);
