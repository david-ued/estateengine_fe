/** 條件式 className 合併（shadcn 慣例的輕量版，無額外相依）。 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}
