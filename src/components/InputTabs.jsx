import { useState } from "react";
import ExistingReplayPicker from "./ExistingReplayPicker.jsx";
import UploadZone from "./UploadZone.jsx";

export default function InputTabs({
  onUpload,
  onLoadExisting,
  loading,
  statusMessage,
  tokenConfigured,
}) {
  const [tab, setTab] = useState("upload");

  return (
    <div className="input-tabs">
      <div className="tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "upload"}
          className={tab === "upload" ? "tab-active" : ""}
          onClick={() => setTab("upload")}
          disabled={loading}
        >
          Upload file
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "existing"}
          className={tab === "existing" ? "tab-active" : ""}
          onClick={() => setTab("existing")}
          disabled={loading}
        >
          From Ballchasing
        </button>
      </div>

      {tab === "upload" ? (
        <UploadZone onUpload={onUpload} loading={loading} statusMessage={statusMessage} />
      ) : (
        <ExistingReplayPicker
          onLoad={onLoadExisting}
          loading={loading}
          statusMessage={statusMessage}
          tokenConfigured={tokenConfigured}
        />
      )}
    </div>
  );
}
