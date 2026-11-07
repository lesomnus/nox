# ActivityHeatmap

A UTC daily calendar accepting neutral `{date, level, label?, disabled?}` entries. ISO dates locate cells even in sparse or unsorted input; duplicate dates use the last entry. Invalid dates are ignored. Leading and trailing partial weeks are padded. Metric aggregation and intensity thresholds belong to the host.

`selectedDate` and `onSelect` make the grid controlled. `onWeeksChange` reports how many week columns fit the measured width so a host can request an appropriate date range. Loading can retain existing content; `placeholder` explicitly suppresses selectable entries. Title, period, weekday labels and legend can be customized, and UIProvider supplies default locale/labels. CSS tokens own cell geometry and color levels.
