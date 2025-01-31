/* eslint-disable jsx-a11y/media-has-caption */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Waver from './waver';
import Dragger, { Pos } from './dragger';
import { formatSeconds } from './utils';
import { useRaf } from './hooks';

let containerWidth = 800;
const containerHeight = 160;

function clamp(x: number, min: number, max: number) {
  if (x < min) {
    return min;
  }

  if (x > max) {
    return max;
  }

  return x;
}

function getClipRect(start: number, end: number) {
  return `rect(0, ${end}px, ${containerHeight}px, ${start}px)`;
}

const color1 = '#01ff00';
const color2 = '#01ff00';
const gray1 = '#ddd';
const gray2 = '#e3e3e3';

interface PlayerProps {
  blob: Blob;
  audioBuffer: AudioBuffer;
  paused: boolean;
  startTime: number;
  currentTime: number;
  onStartTimeChange(time: number): void;
  onCurrentTimeChange(time: number): void;
  onEnd(): void;
}

export default function Player({
  blob,
  audioBuffer,
  startTime,
  currentTime,
  paused,
  onStartTimeChange,
  onCurrentTimeChange,
  onEnd,
}: PlayerProps) {
  const [containerWidth, setContainerWidth] = useState(800);
  const widthDurationRatio = containerWidth / audioBuffer.duration;
  const time2pos = (time: number) => time * widthDurationRatio;
  const audioRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<number>();

  const handleResize = () => {
    if (playerRef.current && playerRef.current!.offsetWidth < 800) {
      setContainerWidth(playerRef.current!.offsetWidth);
    }
  }

  const pos2Time = useCallback(
    (pos: number) => pos / widthDurationRatio,
    [widthDurationRatio],
  );

  const clampTime = useCallback(
    (time: number) => clamp(time, 0, audioBuffer.duration),
    [audioBuffer.duration],
  );

  const start = time2pos(startTime);
  const current = time2pos(currentTime);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    if (startTime <= 0) {
      onStartTimeChange(audioBuffer.duration/2);
    }
  }, [setContainerWidth]);

  const currentTimeFormatted = formatSeconds(currentTime);

  const handleDragStart = useCallback(({ x }: Pos) => {
    onStartTimeChange(clampTime(pos2Time(x)));
    // onCurrentTimeChange(clampTime(pos2Time(x) - 1));
  }, [clampTime, onStartTimeChange, pos2Time]);

  const handleDragCurrent = useCallback(({ x }: Pos) => {
    onCurrentTimeChange(clampTime(pos2Time(x)));
  }, [clampTime, onCurrentTimeChange, pos2Time]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const { currentTime: time } = audioRef.current;
    if (time === currentTime) return;
    onCurrentTimeChange(time);
    if (time >= startTime && currentTime < startTime) {
      onEnd();
    }
    currentTimeRef.current = time;
  };

  const handleEnded = () => {
    onEnd();
  };

  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;

    if (paused) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [paused]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio?.src) return;

    if (currentTimeRef.current !== currentTime) {
      audio.currentTime = currentTime;
    }
  }, [currentTime]);

  useRaf(handleTimeUpdate);

  return (
    <div className="player" ref={playerRef}>
      <audio
        hidden
        src={url}
        ref={audioRef}
        onEnded={handleEnded}
      />
      <div className="clipper" id="original-clipper">
        <Waver
          audioBuffer={audioBuffer}
          width={containerWidth}
          height={containerHeight}
          color1={gray1}
          color2={gray2}
        />
      </div>
      <div
        className="clipper"
        style={{ clip: getClipRect(0, start) }}
      >
        <Waver
          audioBuffer={audioBuffer}
          width={containerWidth}
          height={containerHeight}
          color1={color1}
          color2={color2}
        />
      </div>
      <Dragger
        className="slider"
        x={start}
        value={startTime}
        onDrag={handleDragStart}>
      </Dragger>
      <Dragger
        className="drag-current"
        x={current}
        value={currentTime}
        onDrag={handleDragCurrent}
      >
        <div className="cursor-current">
          <span className="num">{currentTimeFormatted[0]}</span>
          :
          <span className="num">{currentTimeFormatted[1]}</span>
          .
          <span className="num">{currentTimeFormatted[2].toString().padStart(2, '0')}</span>
        </div>
      </Dragger>
    </div>
  );
}
