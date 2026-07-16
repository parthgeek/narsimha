"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const chantAudio = "/om-namo-narayanaya-108.mp3";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.5v11M16 6.5v11" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 7 8 5-8 5Z" />
    </svg>
  );
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10v4h3l4 3V7L8 10H5Z" />
      {muted ? (
        <path d="m16 10 4 4m0-4-4 4" />
      ) : (
        <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10" />
      )}
    </svg>
  );
}

export default function ChantPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;

    const startAudio = async () => {
      try {
        await audio.play();
      } catch {
        // Audible autoplay can be blocked. The first visitor interaction retries it.
      }
    };

    const startAfterInteraction = () => {
      if (audio.paused) void startAudio();
      window.removeEventListener("pointerdown", startAfterInteraction);
      window.removeEventListener("keydown", startAfterInteraction);
    };

    void startAudio();
    window.addEventListener("pointerdown", startAfterInteraction, { once: true });
    window.addEventListener("keydown", startAfterInteraction, { once: true });

    return () => {
      audio.pause();
      window.removeEventListener("pointerdown", startAfterInteraction);
      window.removeEventListener("keydown", startAfterInteraction);
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const handleSeek = (value: string) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const nextTime = (Number(value) / 100) * duration;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const progressStyle = {
    "--chant-progress": `${progress}%`,
  } as CSSProperties;

  return (
    <>
      <audio
        ref={audioRef}
        src={chantAudio}
        autoPlay
        preload="auto"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onCanPlay={() => setAudioError(false)}
        onError={() => {
          setAudioError(true);
          setPlaying(false);
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
      />

      {!expanded ? (
        <button
          type="button"
          className={`chant-dock${playing ? " is-playing" : ""}`}
          onClick={() => setExpanded(true)}
          aria-label="Open Om Namo Narayanaya chant controls"
        >
          <span className="chant-dock-avatar" aria-hidden="true">
            <img src="/icon.png" alt="" />
            <span className="chant-dock-status" />
          </span>
          <span>Chant</span>
        </button>
      ) : (
        <aside
          className={`chant-player${playing ? " is-playing" : ""}${audioError ? " has-error" : ""}`}
          aria-label="Sacred chant audio player"
          onMouseLeave={() => setExpanded(false)}
        >
          <div className="chant-player-accent" aria-hidden="true" />
          <button
            type="button"
            className="chant-play"
            onClick={togglePlayback}
            disabled={audioError}
            aria-label={playing ? "Pause Om Namo Narayanaya chant" : "Play Om Namo Narayanaya chant"}
          >
            <PlayIcon playing={playing} />
          </button>

          <div className="chant-content">
            <div className="chant-heading">
              <div aria-live="polite">
                <span className="chant-eyebrow">
                  {audioError ? "Audio unavailable" : "108 Repetitions · Sacred Audio"}
                </span>
                <strong>{audioError ? "Please try again later" : "Om Namo Narayanaya"}</strong>
              </div>
              <button
                type="button"
                className="chant-minimize"
                onClick={() => setExpanded(false)}
                aria-label="Minimize chant player"
              >
                <span aria-hidden="true" />
              </button>
            </div>

            <div className="chant-timeline">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={(event) => handleSeek(event.target.value)}
                disabled={audioError}
                style={progressStyle}
                aria-label="Chant playback position"
              />
              <div className="chant-time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="chant-volume"
            onClick={toggleMute}
            aria-label={muted ? "Unmute chant" : "Mute chant"}
          >
            <VolumeIcon muted={muted} />
          </button>
        </aside>
      )}
    </>
  );
}
