interface DownloadCsvOptions {
  includeUtf8Bom?: boolean;
  appendLinkToDocument?: boolean;
  revokeAfterMs?: number;
}

export function downloadCsvFile(
  filename: string,
  contents: string,
  {
    includeUtf8Bom = false,
    appendLinkToDocument = false,
    revokeAfterMs = 0,
  }: DownloadCsvOptions = {}
) {
  const parts = includeUtf8Bom ? ["\uFEFF", contents] : [contents];
  const blob = new Blob(parts, { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  if (appendLinkToDocument) document.body.append(link);
  link.click();
  if (appendLinkToDocument) link.remove();

  if (revokeAfterMs > 0) {
    window.setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs);
  } else {
    URL.revokeObjectURL(url);
  }
}
