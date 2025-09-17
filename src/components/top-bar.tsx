import {
  Maximize,
  Minimize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { TopBarProps } from "../types/pdf-reader";

const TopBar = ({
  state,
  handleDurationChange,
  goToPage,
  toggleFullscreen,
  togglePlayPause,
}: TopBarProps) => {
  return (
    <div
      className={`bg-gray-800 rounded-lg p-4 mb-4 ${
        state.isFullscreen ? "rounded-none" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* Duration Controls */}
        <div className="flex items-center gap-2">
          <label className="text-sm">Duration</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={state.duration}
              onChange={(e) =>
                handleDurationChange(parseInt(e.target.value) || 0)
              }
              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-center"
            />
          </div>
        </div>

        {/* Play/Pause Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(state.currentPage - 1)}
            disabled={state.currentPage <= 1 || state.isLoading}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 p-2 rounded transition-colors"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlayPause}
            disabled={!state.file || state.numPages === 0 || state.isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:opacity-50 p-2 rounded transition-colors"
          >
            {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <button
            onClick={() => goToPage(state.currentPage + 1)}
            disabled={state.currentPage >= state.numPages || state.isLoading}
            className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 p-2 rounded transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Page Info */}
        {state.numPages > 0 && (
          <div className="text-sm">
            Page {state.currentPage} of {state.numPages}
          </div>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition-colors ml-auto"
        >
          {state.isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mt-4 p-3 bg-red-800 border border-red-600 rounded-lg text-red-200">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default TopBar;
