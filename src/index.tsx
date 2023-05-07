import React from 'react';
import ReactDOM from 'react-dom';
import Player from './player';
import FilePicker from './file';
import Icon from './icon';
import {
  isAudio, readBlobURL, download, rename,
} from './utils';
import { decodeAudioBuffer, sliceAudioBuffer, fetchAudioBuffer, concatAudioBuffer } from './audio-helper';
import encode from './worker-client';
import './index.less';
import {
  downloadIcon,
  musicIcon,
  pauseIcon,
  playIcon,
  replayIcon,
  spinIcon,
} from './icons';
import playImg from './icons/play.png';
import pauseImg from './icons/pause.png';
import replayImg from './icons/replay.png';
import drop from './country-riddim.mp3';
import { useClassicState } from './hooks';
import { SUpportedFormat } from './types';

function App() {
  const [state, setState] = useClassicState<{
    file: File | null;
    decoding: boolean;
    audioBuffer: AudioBuffer | null;
    countryRiddim: AudioBuffer | null;
    paused: boolean;
    startTime: number;
    endTime: number;
    currentTime: number;
    processing: boolean;
  }>({
    file: null,
    decoding: false,
    audioBuffer: null,
    countryRiddim: null,
    paused: true,
    startTime: 0,
    endTime: Infinity,
    currentTime: 0,
    processing: false,
  });

  React.useEffect(() => {
    fetchAudioBuffer(drop).then((audioBuffer) => {
      setState({
        countryRiddim: audioBuffer,
      });
    });
  }, [setState]);

  const handleFileChange = async (file: File) => {
    if (!isAudio(file)) {
      alert('Please select a valid audio file.');
      return;
    }

    setState({
      file,
      paused: true,
      decoding: true,
      audioBuffer: null,
    });

    const audioBuffer = await decodeAudioBuffer(file);

    setState({
      paused: false,
      decoding: false,
      audioBuffer,
      startTime: 0,
      currentTime: 0,
      endTime: audioBuffer.duration / 2,
    });
  };

  const handleStartTimeChange = (time: number) => {
    setState({
      startTime: time,
    });
  };

  const handleEndTimeChange = (time: number) => {
    setState({
      endTime: time,
    });
  };

  const handleCurrentTimeChange = (time: number) => {
    setState({
      currentTime: time,
    });
  };

  const handleEnd = () => {
    setState({
      paused: true,
    });
  };

  const handlePlayPauseClick = () => {
    setState({
      paused: !state.paused,
    });
  };

  const handleReplayClick = () => {
    setState({
      currentTime: state.startTime,
      paused: false,
    });
  };

  const handleStartInputChange = (evt) => {
    const time = Number(evt.target?.value);
    setState({
      startTime: time,
      currentTime: time-1,
    });
  };

  const handleEndInputChange = (evt) => {
    const time = Number(evt.target?.value);
    setState({
      endTime: time,
      currentTime: time-1,
    });
  };

  const handleEncode = (type: SUpportedFormat) => {
    const {
      startTime, endTime, audioBuffer, file,
    } = state;
    if (!audioBuffer || !file) return;

    const { length, duration } = audioBuffer;

    const audioSlices: AudioBuffer[] = new Array(3);

    audioSlices[0] = sliceAudioBuffer(
      audioBuffer,
      0,
      Math.floor(length * startTime / duration),
    );

    audioSlices[1] = state.countryRiddim!;

    audioSlices[2] = sliceAudioBuffer(
      audioBuffer,
      Math.floor(length * endTime / duration),
    );

    const audioResult = concatAudioBuffer(audioSlices);

    setState({
      processing: true,
    });

    encode(audioResult, type)
      .then(readBlobURL)
      .then((url) => {
        download(url, rename(file.name, type));
      })
      .catch((e) => console.error(e))
      .then(() => {
        setState({
          processing: false,
        });
      });
  };

  const displaySeconds = (seconds: number) => `${seconds.toFixed(2)}s`;

  return (
    <div className="container">
      {
        state.audioBuffer || state.decoding ? (
          <div>
            <h2 className="app-title">CountryRiddim.exe</h2>

            {
              state.decoding ? (
                <div className="player player-landing">
                  DECODING...
                </div>
              ) : (
                <div>
                  <FilePicker className="ctrl-item" onPick={handleFileChange}>
                    <Icon icon={musicIcon} />
                  </FilePicker>
                  <Player
                    audioBuffer={state.audioBuffer!}
                    blob={state.file!}
                    paused={state.paused}
                    startTime={state.startTime}
                    endTime={state.endTime}
                    currentTime={state.currentTime}
                    onStartTimeChange={handleStartTimeChange}
                    onEndTimeChange={handleEndTimeChange}
                    onCurrentTimeChange={handleCurrentTimeChange}
                    onEnd={handleEnd}
                  />
                </div>
              )
            }

            <div className="controllers">
              <div className="player-controls">
                <button
                  type="button"
                  className="ctrl-item"
                  title="Replay"
                  onClick={handleReplayClick}
                >
                  <img src={replayImg} />
                </button>
                <button
                  type="button"
                  className="ctrl-item"
                  title="Play/Pause"
                  onClick={handlePlayPauseClick}
                >
                  {state.paused ?
                    <img src={playImg} />
                    :
                    <img src={pauseImg} />
                  }
                </button>
                <label>
                  Start:
                  <input
                    type="number"
                    value={state.startTime}
                    step="0.01"
                    min="0.00"
                    max={state.audioBuffer?.duration}
                    onChange={handleStartInputChange} />
                </label>
              </div>
              <button
                title="Submit"
                onClick={handlePlayPauseClick}>
                Done
              </button>

              <div className="dropdown list-wrap">
                <button
                  type="button"
                  className="ctrl-item"
                >
                  <Icon icon={state.processing ? spinIcon : downloadIcon} />
                </button>
                {
                  !state.processing && (
                    <ul className="list">
                      <li>
                        <button
                          type="button"
                          onClick={() => handleEncode('wav')}
                        >
                          Wav
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => handleEncode('mp3')}
                          data-type="mp3"
                        >
                          MP3
                        </button>
                      </li>
                    </ul>
                  )
                }
              </div>

              {
                Number.isFinite(state.endTime)
                && (
                <span className="seconds">
                  Select
                  {' '}
                  <span className="seconds-range">
                    {
                    displaySeconds(state.endTime - state.startTime)
                  }
                  </span>
                  {' '}
                  of
                  {' '}
                  <span className="seconds-total">
                    {
                    displaySeconds(state.audioBuffer?.duration ?? 0)
                  }
                  </span>
                  {' '}
                  (from
                  {' '}
                  <span className="seconds-start">
                    {
                    displaySeconds(state.startTime)
                  }
                  </span>
                  {' '}
                  to
                  {' '}
                  <span className="seconds-end">
                    {
                    displaySeconds(state.endTime)
                  }
                  </span>
                  )
                </span>
                )
              }
            </div>
          </div>
        ) : (
          <div className="landing">
            <h2>Audio Cutter</h2>
            <FilePicker onPick={handleFileChange}>
              <div className="file-main">
                <Icon icon={musicIcon} />
                Select music file
              </div>
            </FilePicker>
          </div>
        )
      }
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('main'));
