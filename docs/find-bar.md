# FindBar

Compound, controlled search UI: FindBar, FindBarControls, FindBarIcon, FindBarInput, FindBarCounter, FindBarOptions, FindBarClose, FindBarResults and FindBarResult. FindBarMessage hosts empty or validation feedback; FindBarAction supports caller-defined submit/stop controls.

The component does not index data, fetch results, intercept global shortcuts or dismiss on outside click. The host owns search interpretation, options, highlighting, navigation and close/focus policy. This permits local-document search and streamed remote search to use the same surface. Inputs accept refs and native keyboard handlers, including IME guards. Each option supplies its own ID, symbol, accessible label and pressed state.

Result content is a slot; the results viewport owns the scrollbar rather than reserving space in each row. Set the result-count CSS variable when rendering a bounded list. Placement relative to a document remains the caller's layout responsibility.
