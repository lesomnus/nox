// Typographic spaces reserve the same advances in native text and its overlay.
export const FILE_CHIP_PREFIX = "\u2002\u2002\u2002\u2002";
export const FILE_CHIP_SUFFIX = "\u2005";

export function fileChipText(label: string) {
  return FILE_CHIP_PREFIX + label + FILE_CHIP_SUFFIX;
}
