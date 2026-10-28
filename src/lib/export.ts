import { toJpeg, toPng } from "html-to-image";
import type { Dimensions } from "../types/studio";

export type ExportType = "png" | "jpeg";

const hideForExport = (n: Node): boolean => !(n instanceof HTMLElement && n.dataset.exportHide !== undefined);

/** Renderiza el nodo (ya a tamaño de diseño, escalado con CSS) a 1080 px reales. */
export async function renderSlide(node: HTMLElement, size: Dimensions, type: ExportType): Promise<string> {
  await document.fonts.ready;
  const opts = { width: size.w, height: size.h, pixelRatio: 1, quality: 0.92, filter: hideForExport, style: { transform: "none", transformOrigin: "top left" } };
  const run = type === "png" ? toPng : toJpeg;
  await run(node, opts); // primera pasada: calienta fuentes e imágenes (comportamiento conocido de html-to-image)
  return run(node, opts);
}

export function download(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}

/** Reduce una foto subida para no reventar localStorage. */
export function loadPhoto(file: File, maxSide = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}
