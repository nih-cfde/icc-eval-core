import { ref } from "vue";

/** list of all pdf report files */
export const pdfs = ref<Record<string, string>>({});

try {
  /**
   * get list of pdf files. safely import dynamically to not fail build if
   * import does not exist.
   */
  pdfs.value =
    (
      await Object.values(
        import.meta.glob<boolean, string, { default: Record<string, string> }>(
          "~/pdfs.json",
        ),
      )[0]?.()
    )?.default ?? {};

} catch (error) {
  console.error("Couldn't load PDF list");
}
