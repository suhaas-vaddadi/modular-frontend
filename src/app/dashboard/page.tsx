"use client";
import { ChatForm } from "@/components/chat-form";
import MCPCanvas from "@/components/mcpgraph";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useState } from "react";

export default function Page() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div style={{ height: "100vh" }}>
      <Allotment separator={true}>
        <Allotment.Pane preferredSize="50%" minSize={0} maxSize={Infinity}>
          <MCPCanvas />
          {rightCollapsed && (
            <button onClick={() => setRightCollapsed(false)}>
              Reopen Right Panel
            </button>
          )}
        </Allotment.Pane>
        <Allotment.Pane preferredSize="50%" minSize={0} maxSize={Infinity}>
          <div style={{ padding: "20px", height: "100%" }}>
            <ChatForm />
            {leftCollapsed && (
              <button onClick={() => setLeftCollapsed(false)}>
                Reopen Left Panel
              </button>
            )}
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
