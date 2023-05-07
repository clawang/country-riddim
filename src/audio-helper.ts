import { range, readArrayBuffer } from './utils';

/**
 * slice AudioBuffer from start byte to end byte
 */
export function sliceAudioBuffer(audioBuffer: AudioBuffer, start = 0, end = audioBuffer.length) {
  const newBuffer = new AudioContext().createBuffer(
    audioBuffer.numberOfChannels,
    end - start,
    audioBuffer.sampleRate,
  );

  for (let i = 0; i < audioBuffer.numberOfChannels; i += 1) {
    newBuffer.copyToChannel(audioBuffer.getChannelData(i).slice(start, end), i);
  }

  return newBuffer;
}

/**
 * serialize AudioBuffer for message send
 */
export function serializeAudioBuffer(audioBuffer: AudioBuffer) {
  return {
    channels: range(0, audioBuffer.numberOfChannels - 1)
      .map((i) => audioBuffer.getChannelData(i)),
    sampleRate: audioBuffer.sampleRate,
    length: audioBuffer.length,
  };
}

export async function decodeAudioBuffer(blob: Blob) {
  const arrayBuffer = await readArrayBuffer(blob);
  const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);

  return audioBuffer;
}

export async function fetchAudioBuffer(file: RequestInfo | URL) {
  const audioContext = new AudioContext();

  try {
    const response = await fetch(file);
    console.log(response);
    const arrayBuffer = await response.arrayBuffer();
    return audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error(error);
  }
};

export function concatAudioBuffer(buffers: AudioBuffer[]): AudioBuffer {
  window.AudioContext = window.AudioContext || (window as any).webkitAudioContext || (window as any).mozAudioContext;
  const context = new AudioContext();
  const output = context.createBuffer(
    Math.max(...buffers.map((buffer) => buffer.numberOfChannels)),
    buffers.map((buffer) => buffer.length).reduce((a, b) => a + b, 0),
    context.sampleRate
  );
  let offset = 0;

  buffers.forEach((buffer) => {
    for (let channelNumber = 0; channelNumber < buffer.numberOfChannels; channelNumber++) {
      output.getChannelData(channelNumber).set(buffer.getChannelData(channelNumber), offset);
    }

    offset += buffer.length;
  });

  return output;
}