interface ImportMetaEnv {
  /** ID del Meta Pixel. Vacío = sin Pixel ni Conversions API. */
  readonly PUBLIC_META_PIXEL_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
