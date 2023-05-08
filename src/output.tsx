import clsx from 'clsx';
import React, {
  memo,
  useEffect,
  useState,
  useRef,
} from 'react';
import { useRaf } from './hooks';
import { formatSeconds } from './utils';
import Icon from './icon';
import playIcon from './icons/play.svg';
import pauseIcon from './icons/pause.svg';
import dragger from './icons/seeker.png';
import replayIcon from './icons/replay.svg';
import forwardIcon from './icons/forward.svg';
import rewindIcon from './icons/rewind.svg';
import fastForwardIcon from './icons/fast-forward.svg';

interface OutputProps {
  className?: string;
  url: string;
}

function Output({
  className,
  url,
}: OutputProps) {
    const [paused, setPaused] = useState(true);
    const [state, setState] = useState({x: 0, y: 0});
    const [currentTime, setCurrentTime] = useState(0);
    const [currentTimeFormatted, setCurrentTimeFormatted] = useState<string[]>(formatSeconds(0));
    const [math, setMath] = useState({
        widthDurationRatio: 0,
        containerWidth: 0,
        duration: 0,
    })
    const audioRef = useRef<HTMLAudioElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const currentTimeRef = useRef<number>();

    const onLoadedMetadata = () => {
        const width = trackRef.current!.offsetWidth - 20;
        const duration = audioRef.current!.duration!;
        setMath({
            containerWidth: width,
            duration: duration,
            widthDurationRatio: width / duration!,
        });
    };

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
          currentTimeRef.current = currentTime;
          setCurrentTimeFormatted(formatSeconds(currentTime));
          setState({...state, x: currentTime * math.widthDurationRatio});
        }
      }, [currentTime]);

      const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const { currentTime: time } = audioRef.current;
        if (time === currentTime) return;
        // onCurrentTimeChange(time);
        currentTimeRef.current = time;
        setCurrentTimeFormatted(formatSeconds(time));
        setState({...state, x: time * math.widthDurationRatio});
      };

      const handleMouseDown = (e0: React.MouseEvent) => {
        const { screenX, screenY } = e0;
    
        const handleMouseMove = (e: MouseEvent) => {
            const xPos = Math.min(Math.max(e.screenX - screenX + state.x, 0), math.containerWidth);
          setState({
            x: xPos,
            y: e.screenY - screenY + state.y,
          });
          const time = xPos / math.widthDurationRatio;
            setCurrentTime(time);
        };
    
        const handleMouseUp = () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };
    
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      };

      const handleEnded = () => {
        setPaused(true);
      }

      useRaf(handleTimeUpdate);

    return (
        <div className="output-wrapper">
            <audio
                ref={audioRef}
                preload="metadata"
                onLoadedMetadata={onLoadedMetadata}
                src={url}
                onEnded={handleEnded}
            />
            <div className="output-controls-wrapper">
                <div className="output-window">
                    <h3>{`[00] ${currentTimeFormatted[0]}:${currentTimeFormatted[1]}`}</h3>
                </div>
                <div className="output-controls">
                    <div>
                        <button onClick={() => setPaused(false)} id="play-button">
                            <Icon icon={playIcon} />
                        </button>
                        <button onClick={() => setPaused(true)}>
                            <Icon icon={pauseIcon} />
                        </button>
                    </div>
                    <div>
                        <button onClick={() => setCurrentTime(0)}>
                            <Icon icon={replayIcon} />
                        </button>
                        <button onClick={() => setCurrentTime(currentTimeRef.current!-1)}>
                            <Icon icon={rewindIcon} />
                        </button>
                        <button onClick={() => setCurrentTime(currentTimeRef.current!+1)}>
                            <Icon icon={fastForwardIcon} />
                        </button>
                        <button onClick={() => {
                            setCurrentTime(math.duration);
                            }}>
                            <Icon icon={forwardIcon} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="output-player">
                <div className="output-track" ref={trackRef}></div>
                <div
                    className="output-dragger"
                    onMouseDown={handleMouseDown}
                      role="slider"
                      tabIndex={0}
                      style={{
                        left: `${state.x}px`,
                        zIndex: 5,
                      }}>
                    <img src={dragger} />
                </div>
            </div>
        </div>
    );
}

export default memo(Output);
