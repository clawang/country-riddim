/**
 * detect if a file is an audio.
 */
export const isAudio = (file: File) => file.type.indexOf('audio') > -1;

/**
 * create range [min .. max]
 */
export const range = (min: number, max: number) => Array.from(
  new Array(max - min + 1),
  (v, i) => i + min,
);

interface FileReadAsType {
  ArrayBuffer: ArrayBuffer;
  DataURL: string;
}

/**
 * FileReader in promise
 */
export const readFile = <Type extends keyof FileReadAsType>(
  file: Blob,
  dataType: Type,
) => new Promise<FileReadAsType[Type]>((resolve, reject) => {
    const reader = new FileReader();
    (reader as any)[`readAs${dataType}`](file);
    reader.onload = () => resolve(reader.result as any);
    reader.onerror = (err) => reject(err);
  });

/**
 * Read File/Blob to ArrayBuffer
 */
export const readArrayBuffer = (file: Blob) => readFile(file, 'ArrayBuffer');

/**
 * Read File/Blob to Base64
 */
export const readDataURL = (file: Blob) => readFile(file, 'DataURL');

export const readBlobURL = (file: Blob) => URL.createObjectURL(file);

export const download = (url: string, name: string) => {
  const link = document.createElement('a');
  link.href = url;
  const nameParts = name.split('.');
  link.download = nameParts[0].concat('-country-riddim').concat('.').concat(nameParts[1]);
  link.click();
};

export const rename = (filename: string, ext: string, stamp?: string) => `${filename.replace(/\.\w+$/, '')}${stamp || ''}.${ext}`;

/**
 * format seconds to [minutes, integer, decimal(2)]
 */
export const formatSeconds = (seconds: number) => [
  formatDigit(Math.floor(seconds / 60)),
  formatDigit(Math.floor(seconds % 60)),
  formatDigit(Math.round((seconds % 1) * 100)),
];

const formatDigit = (num: number) => {
  let str = String(num);
  if (str.length < 2) str = "0".concat(str);
  return str;
}