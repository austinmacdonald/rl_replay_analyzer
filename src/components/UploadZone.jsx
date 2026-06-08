import { useRef, useState } from "react";

function isReplayFile(file) {
  return file?.name?.toLowerCase().endsWith(".replay");
}

export default function UploadZone({ onUpload, loading, statusMessage }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState([]);
  const [visibility, setVisibility] = useState("private");

  function addFiles(incoming) {
    const list = Array.from(incoming).filter(isReplayFile);
    if (list.length === 0) {
      alert("Please select .replay files.");
      return;
    }

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      for (const file of list) {
        const key = `${file.name}:${file.size}`;
        if (!existing.has(key)) {
          existing.add(key);
          merged.push(file);
        }
      }
      return merged;
    });
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (files.length > 0 && !loading) onUpload(files, visibility);
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <section className="upload-card">
      <form onSubmit={handleSubmit}>
        <div
          className={`dropzone ${dragOver ? "dropzone-active" : ""} ${files.length > 0 ? "dropzone-has-file" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".replay"
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {files.length > 0 ? (
            <>
              <span className="dropzone-icon">📁</span>
              <strong>
                {files.length} replay{files.length !== 1 ? "s" : ""} selected
              </strong>
              <span className="muted">{(totalSize / 1024 / 1024).toFixed(2)} MB total</span>
            </>
          ) : (
            <>
              <span className="dropzone-icon">⬆</span>
              <strong>Drop .replay files here</strong>
              <span className="muted">or click to browse — select one or many</span>
            </>
          )}
        </div>

        {files.length > 0 && (
          <ul className="file-list">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}`} className="file-list-item">
                <span className="file-list-name">{file.name}</span>
                <span className="file-list-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={loading}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="upload-controls">
          <label className="visibility-select">
            Visibility on Ballchasing
            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={loading}>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
              <option value="public">Public</option>
            </select>
          </label>

          <button type="submit" className="btn-primary" disabled={files.length === 0 || loading}>
            {loading
              ? "Analyzing…"
              : files.length <= 1
                ? "Upload & Analyze"
                : `Upload & Average ${files.length} Replays`}
          </button>
        </div>

        {statusMessage && <p className="status-message">{statusMessage}</p>}
      </form>
    </section>
  );
}
