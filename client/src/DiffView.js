import React from "react";
import { diffLines } from "diff";

function DiffView({ oldContent, newContent }) {
  const diff = diffLines(oldContent, newContent);

  return (
    <div className="diff-view">
      {diff.map((part, index) => (
        <pre
          key={index}
          className={
            part.added ? "bg-green-100" : part.removed ? "bg-red-100" : ""
          }
        >
          {part.value}
        </pre>
      ))}
    </div>
  );
}

export default DiffView;
