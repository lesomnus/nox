# ImageViewer

Compose `ImageViewer`, `ImageViewerViewport` and `ImageViewerControls` inside your own Card or Dialog. The provider owns loading, real image dimensions, fit zoom, bounded pointer/keyboard panning and object URL cleanup. Give the viewport a bounded flex/grid area.

Use `src` for an existing URL, or a stable `load(signal)` callback returning a Blob. The host owns authentication and file lookup; abort signals are canceled on replacement/unmount. Failed loads can be retried. Controls accept extra footer actions as children. A zoom of one hundred percent maps one source image pixel to one CSS pixel. Fit never enlarges a small image. Arrow keys pan; Home centers. The checkerboard stays visible through transparency.

Labels come from the optional UIProvider. Geometry, checkerboard and control spacing live in the component CSS module.
