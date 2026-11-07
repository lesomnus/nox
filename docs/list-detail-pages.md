# ListDetailPages

A list/detail lifecycle on top of SlidingPages. `open` selects the detail; `list` and `detail` are React nodes. The list mounts on its first visit and stays mounted, retaining scroll and selection. An outgoing detail remains visible until its exit animation finishes, then unmounts. Rapid reentry starts a fresh editor instead of restoring a discarded draft.

`scope` prevents a departing detail from leaking between unrelated data scopes. Inactive pages remain inert and inaccessible. The host owns routes, push/replace history, dirty-form guards and data refresh. The viewport requires a bounded flex/grid area. Motion timing is defined by the shared CSS tokens and honors reduced motion.
