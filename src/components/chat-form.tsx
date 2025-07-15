"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ArrowUpIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AutoResizeTextarea } from "./autoresize-textarea";

export function ChatForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [showError, setShowError] = useState(false);

  const { messages, input, setInput, append, setMessages } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error);
      setShowError(true);

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Error while chatting. Please check your API key/config and try again.",
        },
      ]);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      void append({ content: input, role: "user" });
      setInput("");
    } catch (error) {
      console.error("Submit error:", error);
      setShowError(true);

      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Error while chatting. Please check your API key/config and try again.",
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const header = (
    <header className="m-auto flex max-w-96 flex-col gap-5 text-center text-slate-200">
      <h1 className="text-2xl font-semibold leading-none tracking-tight">
        Welcome to Modular
      </h1>
      <p className="text-muted-foreground text-sm">
        Start by connecting LLMs and productivity apps of your choice.
      </p>
    </header>
  );

  const messageList = (
    <div className="my-4 flex h-fit min-h-full flex-col gap-4">
      {messages.map((message, index) => (
        <div
          key={index}
          data-role={message.role}
          className="rounded-xl px-3 py-2 text-sm data-[role=assistant]:self-start data-[role=user]:self-end data-[role=assistant]:bg-gray-100 data-[role=user]:bg-blue-500 data-[role=assistant]:text-black data-[role=user]:text-white"
        >
          {message.content}
        </div>
      ))}
    </div>
  );

  const errorModal = (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-red-500 text-white rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 max-w-md">
        <div className="flex-1">
          <p className="text-sm font-medium">Error while chatting</p>
          <p className="text-xs opacity-90">Check API key/config</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowError(false)}
          className="h-6 w-6 p-0 hover:bg-red-600 text-white"
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );

  return (
    <main
      className={cn(
        "ring-none mx-auto flex h-svh max-h-svh w-full flex-col items-stretch border-none",
        className
      )}
      style={{ backgroundColor: "#353535" }}
      {...props}
    >
      <div className="flex-1 content-center overflow-y-auto px-6">
        {messages.length ? messageList : header}
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-input bg-background focus-within:ring-ring/10 relative mx-6 mb-6 flex items-center rounded-[16px] border px-3 py-1.5 pr-8 text-sm focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-0"
      >
        <AutoResizeTextarea
          onKeyDown={handleKeyDown}
          onChange={(v) => setInput(v)}
          value={input}
          placeholder="Enter a message"
          className="placeholder:text-muted-foreground flex-1 bg-transparent focus:outline-none"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute bottom-1 right-1 size-6 rounded-full"
            >
              <ArrowUpIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={12}>Submit</TooltipContent>
        </Tooltip>
      </form>

      {showError && errorModal}
    </main>
  );
}
