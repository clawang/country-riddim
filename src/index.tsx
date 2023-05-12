import React from 'react';
import ReactDOM from 'react-dom';
import Player from './player';
import FilePicker from './file';
import Icon from './icon';
import Output from './output';
import Window from './window';
import {
  isAudio, readBlobURL, download, rename,
} from './utils';
import { decodeAudioBuffer, sliceAudioBuffer, fetchAudioBuffer, concatAudioBuffer } from './audio-helper';
import encode from './worker-client';
import './index.less';
import { formatSeconds } from './utils';
import playIcon from './icons/play.svg';
import pauseIcon from './icons/pause.svg';
import replayIcon from './icons/replay.svg';
import forwardIcon from './icons/forward.svg';
import musicIcon from './icons/music.svg';
import rewindIcon from './icons/rewind.svg';
import fastForwardIcon from './icons/fast-forward.svg';
import drop from './country-riddim.mp3';
import logo from './icons/logo.png';
import { useClassicState } from './hooks';
import { SUpportedFormat } from './types';
import output from './output';

function App() {
  const [state, setState] = useClassicState<{
    file: File | null;
    decoding: boolean;
    audioBuffer: AudioBuffer | null;
    countryRiddim: AudioBuffer | null;
    outputUrl: string | null,
    paused: boolean;
    startTime: number;
    currentTime: number;
    processing: boolean;
    start: boolean;
    displayTime: string;
    outputScreen: boolean;
  }>({
    file: null,
    decoding: false,
    audioBuffer: null,
    countryRiddim: null,
    outputUrl: null,
    paused: true,
    startTime: 0,
    currentTime: 0,
    processing: false,
    start: false,
    displayTime: "Drop Time: 00:00 m:s",
    outputScreen: false,
  });

  React.useEffect(() => {
    fetchAudioBuffer(drop).then((audioBuffer) => {
      setState({
        countryRiddim: audioBuffer,
      });
    });
  }, [setState]);

  React.useEffect(() => {
    const time = formatSeconds(state.startTime);
    let str = "Drop time: ";
    str = str.concat(time[0])
    str = str.concat(":").concat(time[1]);
    str = str.concat(".").concat(time[2]);
    setState({displayTime: str});
  }, [state.startTime]);

  React.useEffect(() => {
    if (!state.outputScreen) {
      document.getElementById('main')?.classList.remove('fourtet');
    }
  }, [state.outputScreen]);

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
    });
  };

  const handleStartTimeChange = (time: number) => {
    setState({
      startTime: time,
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

  const handleForwardClick = () => {
    setState({
      currentTime: state.startTime - 1,
      paused: false,
    });
  };

  const handleEncode = (type: SUpportedFormat) => {
    const {
      startTime, audioBuffer, file,
    } = state;
    if (!audioBuffer || !file) return;
    if (startTime <= 0) {
      alert("You need to select part of the song!");
      return;
    }

    const { length, duration, sampleRate } = audioBuffer;

    const audioSlices: AudioBuffer[] = new Array(2);

    audioSlices[0] = sliceAudioBuffer(
      audioBuffer,
      0,
      Math.floor(startTime * sampleRate),
    );

    audioSlices[1] = state.countryRiddim!;

    const audioResult = concatAudioBuffer(audioSlices);

    setState({
      processing: true,
      outputScreen: true,
    });

    encode(audioResult, type)
      .then(readBlobURL)
      .then((url) => {
        setState({
          outputUrl: url,
        });
      })
      .catch((e) => console.error(e))
      .then(() => {
        setState({
          processing: false,
        });
      });
  };

  const displaySeconds = (seconds: number) => `${seconds.toFixed(2)}s`;

  const reset = () => {
    setState({
      decoding: false,
      audioBuffer: null,
      processing: false,
      outputUrl: null,
    });
  }

  return (
    <div className="container">
      {
        state.audioBuffer || state.decoding ? (
          !state.outputScreen ? (
              <Window id="audio-editor" title="Audio Editor">
                {
                  state.decoding ? (
                    <div className="player-loading-wrapper">
                      <div className="loading-wrapper">
                        <div className="loading">
                          <div className="loading-bar"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                    <div className="player-wrapper">
                      <p>Use the time slider to mark when you want the country riddim drop to start.</p>
                      <Player
                        audioBuffer={state.audioBuffer!}
                        blob={state.file!}
                        paused={state.paused}
                        startTime={state.startTime}
                        currentTime={state.currentTime}
                        onStartTimeChange={handleStartTimeChange}
                        onCurrentTimeChange={handleCurrentTimeChange}
                        onEnd={handleEnd}
                      />
                    </div>
                    <div className="controllers">
                      <div className="player-controls">
                        <div className="player-controls-top">
                          <button
                            type="button"
                            className="ctrl-item"
                            title="Replay"
                            onClick={handleReplayClick}
                          >
                            <Icon icon={replayIcon} />
                          </button>
                          <button
                            type="button"
                            className="ctrl-item"
                            title="Play/Pause"
                            onClick={handlePlayPauseClick}
                          >
                            <Icon icon={state.paused ? playIcon : pauseIcon} />
                          </button>
                          <button
                            type="button"
                            className="ctrl-item"
                            title="Forward"
                            onClick={handleForwardClick}
                          >
                            <Icon icon={forwardIcon} />
                          </button>
                        </div>
                        <div id="timestamp">
                          <button onClick={() => setState({startTime: state.startTime-0.1})}>
                              <Icon icon={rewindIcon} />
                          </button>
                          <input
                            type="text"
                            id="drop-time"
                            readOnly={true}
                            value={state.displayTime} />
                            <button onClick={() => setState({startTime: state.startTime+0.1})}>
                              <Icon icon={fastForwardIcon} />
                            </button>
                        </div>
                      </div>
                      <div className="button-wrapper">
                        <button
                          title="Back"
                          onClick={reset}>
                          Back
                        </button>
                        <button
                          title="Submit"
                          onClick={() => handleEncode('mp3')}>
                          Done
                        </button>
                      </div>
                    </div>
                  </>
                  )
                }
              </Window>
            ): (
              <Window id="audio-output" title="Output">
                {
                  !state.processing ? (
                    <>
                      <Output url={state.outputUrl} dropTime={state.startTime} />
                      <div className="button-wrapper">
                        <button
                          type="button"
                          onClick={() => setState({outputScreen: false})}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => download(state.outputUrl!, rename(state.file!.name, 'mp3'))}
                        >
                          Download
                        </button>
                      </div>
                    </>
                  )
                  :
                  <div className="loading-wrapper">
                    <div className="loading">
                      <div className="loading-bar"></div>
                    </div>
                  </div>
                }
              </Window>
            )
        ) : (
          <Window id="audio-upload" title="Upload" startup={true}>
            <img src={logo} />
            {state.start ?
              <>
                <FilePicker onPick={handleFileChange}>
                  <div className="file-main">
                    <Icon icon={musicIcon} />
                    Upload music file
                  </div>
                </FilePicker>
                <div className="button-wrapper">
                  <button onClick={() => setState({start: false})}>Back</button>
                </div>
              </>
              :
              <div className="start-screen">
                <p>Add a country riddim drop to any song!</p>
                <p>For best results, use on desktop only.</p>
                <div className="start-screen-credits">
                  <p>App by <a href="https://linktr.ee/claireyw" target="_blank">Claire Wang</a></p>
                  <p>Song by <a href="https://linktr.ee/holholhol" target="_blank">Hol!</a></p>
                  <p>Inspired by Four Tet</p>
                </div>
                <p>Not affiliated with Hol! or Four Tet.</p>
                <button onClick={() => setState({start: true})}>Start</button>
              </div>
            }
          </Window>
        )
      }
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('main'));
