"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Settings,
  Trash2,
  Calendar,
  FileText,
  CheckSquare,
  Mail,
  Brain,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Position {
  x: number;
  y: number;
}

interface ServiceNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  position: Position;
  connected: boolean;
  currentProvider: string;
  availableProviders: string[];
}

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  offset: Position;
  startPosition: Position;
}

const INITIAL_SERVICES: ServiceNode[] = [
  {
    id: "calendar",
    label: "Calendar",
    icon: <Calendar className="w-5 h-5" />,
    position: { x: 200, y: 100 },
    connected: true,
    currentProvider: "Google Calendar",
    availableProviders: [
      "Google Calendar",
      "Apple Calendar",
      "Outlook Calendar",
      "CalDAV",
    ],
  },
  {
    id: "notes",
    label: "Notes",
    icon: <FileText className="w-5 h-5" />,
    position: { x: 500, y: 150 },
    connected: true,
    currentProvider: "Google Notes",
    availableProviders: [
      "Google Notes",
      "Apple Notes",
      "Notion",
      "Obsidian",
      "Evernote",
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: <CheckSquare className="w-5 h-5" />,
    position: { x: 450, y: 350 },
    connected: true,
    currentProvider: "Todoist",
    availableProviders: [
      "Todoist",
      "Apple Reminders",
      "Microsoft To Do",
      "Any.do",
      "TickTick",
    ],
  },
  {
    id: "email",
    label: "Email",
    icon: <Mail className="w-5 h-5" />,
    position: { x: 150, y: 300 },
    connected: true,
    currentProvider: "Gmail",
    availableProviders: [
      "Gmail",
      "Outlook",
      "Apple Mail",
      "Yahoo Mail",
      "ProtonMail",
    ],
  },
];

const LLM_POSITION = { x: 350, y: 225 };

export default function MCPCanvas() {
  const [services, setServices] = useState<ServiceNode[]>(INITIAL_SERVICES);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  });
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<ServiceNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [panStartPosition, setPanStartPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [panStartOffset, setPanStartOffset] = useState<Position>({
    x: 0,
    y: 0,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId?: string) => {
      e.preventDefault();

      if (nodeId) {
        // Node dragging
        const node = services.find((s) => s.id === nodeId);
        if (!node) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate offset from mouse to node center
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const nodeScreenX = node.position.x + canvasOffset.x;
        const nodeScreenY = node.position.y + canvasOffset.y;

        setDragState({
          isDragging: true,
          nodeId,
          offset: {
            x: mouseX - nodeScreenX,
            y: mouseY - nodeScreenY,
          },
          startPosition: { x: e.clientX, y: e.clientY },
        });
      } else {
        // Canvas panning
        setIsPanningCanvas(true);
        setPanStartPosition({ x: e.clientX, y: e.clientY });
        setPanStartOffset({ ...canvasOffset });
      }
    },
    [services, canvasOffset]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (dragState.isDragging && dragState.nodeId) {
          // Node dragging
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          // Calculate new node position (relative to canvas, not screen)
          const newPosition = {
            x: mouseX - dragState.offset.x - canvasOffset.x,
            y: mouseY - dragState.offset.y - canvasOffset.y,
          };

          setServices((prev) =>
            prev.map((service) =>
              service.id === dragState.nodeId
                ? { ...service, position: newPosition }
                : service
            )
          );
        } else if (isPanningCanvas) {
          // Canvas panning
          const deltaX = e.clientX - panStartPosition.x;
          const deltaY = e.clientY - panStartPosition.y;

          setCanvasOffset({
            x: panStartOffset.x + deltaX,
            y: panStartOffset.y + deltaY,
          });
        }
      });
    },
    [dragState, canvasOffset, isPanningCanvas, panStartPosition, panStartOffset]
  );

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    setDragState({
      isDragging: false,
      nodeId: null,
      offset: { x: 0, y: 0 },
      startPosition: { x: 0, y: 0 },
    });
    setIsPanningCanvas(false);
  }, []);

  useEffect(() => {
    if (dragState.isDragging || isPanningCanvas) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, isPanningCanvas, handleMouseMove, handleMouseUp]);

  const handleNodeClick = (nodeId: string) => {
    // Only handle click if we didn't drag
    if (dragState.isDragging) return;
    setActiveNode(activeNode === nodeId ? null : nodeId);
  };

  const handleEdit = (nodeId: string) => {
    const node = services.find((s) => s.id === nodeId);
    if (node) {
      setEditingNode(node);
      setActiveNode(null);
    }
  };

  const handleDelete = (nodeId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === nodeId ? { ...service, connected: false } : service
      )
    );
    setActiveNode(null);
  };

  const handleConnect = (nodeId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id == nodeId ? { ...service, connected: true } : service
      )
    );
  };

  const handleProviderChange = (newProvider: string) => {
    if (!editingNode) return;

    setServices((prev) =>
      prev.map((service) =>
        service.id === editingNode.id
          ? { ...service, currentProvider: newProvider }
          : service
      )
    );
    setEditingNode(null);
  };

  const getConnectionPath = useCallback((from: Position, to: Position) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const controlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5;

    return `M ${from.x} ${from.y} Q ${from.x + dx / 2 + controlOffset} ${
      from.y + dy / 2
    } ${to.x} ${to.y}`;
  }, []);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
      <div
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${
          isPanningCanvas
            ? "cursor-grabbing"
            : dragState.isDragging
            ? "cursor-grabbing"
            : "cursor-grab"
        }`}
        onMouseDown={(e) => handleMouseDown(e)}
        onClick={() => setActiveNode(null)}
      >
        {/* SVG for connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {services.map((service) => (
            <path
              key={`connection-${service.id}`}
              d={getConnectionPath(
                {
                  x: LLM_POSITION.x + canvasOffset.x,
                  y: LLM_POSITION.y + canvasOffset.y,
                },
                {
                  x: service.position.x + canvasOffset.x,
                  y: service.position.y + canvasOffset.y,
                }
              )}
              stroke={
                service.connected
                  ? hoveredNode === service.id
                    ? "#3b82f6"
                    : "#64748b"
                  : "#cbd5e1"
              }
              strokeWidth={hoveredNode === service.id ? "3" : "2"}
              fill="none"
              opacity={
                service.connected
                  ? hoveredNode === service.id
                    ? 0.8
                    : 0.6
                  : 0.3
              }
              filter={hoveredNode === service.id ? "url(#glow)" : "none"}
              className="transition-all duration-200"
            />
          ))}
        </svg>

        {/* Central LLM Node */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: LLM_POSITION.x + canvasOffset.x,
            top: LLM_POSITION.y + canvasOffset.y,
            transition:
              dragState.isDragging || isPanningCanvas
                ? "none"
                : "all 0.2s ease",
          }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="text-center mt-2">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              LLM
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Core Model
            </div>
          </div>
        </div>

        {/* Service Nodes */}
        {services.map((service) => (
          <div key={service.id}>
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
                dragState.nodeId === service.id
                  ? "scale-110 z-50"
                  : "hover:scale-105 z-30"
              } ${hoveredNode === service.id ? "z-40" : ""}`}
              style={{
                left: service.position.x + canvasOffset.x,
                top: service.position.y + canvasOffset.y,
                transition:
                  dragState.nodeId === service.id || isPanningCanvas
                    ? "none"
                    : "all 0.2s ease",
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, service.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNodeClick(service.id);
              }}
              onMouseEnter={() => setHoveredNode(service.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-3 transition-all duration-200 ${
                  service.connected
                    ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"
                    : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 opacity-60"
                } ${
                  hoveredNode === service.id ? "shadow-xl border-blue-400" : ""
                }`}
              >
                <div
                  className={
                    service.connected
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400"
                  }
                >
                  {service.icon}
                </div>
              </div>
              <div className="text-center mt-2">
                <div
                  className={`text-sm font-medium ${
                    service.connected
                      ? "text-slate-800 dark:text-slate-200"
                      : "text-slate-500"
                  }`}
                >
                  {service.label}
                </div>
                <div
                  className={`text-xs ${
                    service.connected
                      ? "text-slate-600 dark:text-slate-400"
                      : "text-slate-400"
                  }`}
                >
                  {service.currentProvider}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {activeNode === service.id && (
              <div
                className="absolute z-50 flex gap-2"
                style={{
                  left: service.position.x + canvasOffset.x + 40,
                  top: service.position.y + canvasOffset.y - 20,
                }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0 bg-white dark:bg-slate-800 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(service.id);
                  }}
                >
                  <Settings className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-8 h-8 p-0 bg-white dark:bg-slate-800 shadow-lg hover:bg-red-50 hover:border-red-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (service.connected) {
                      handleDelete(service.id);
                    } else {
                      handleConnect(service.id);
                    }
                  }}
                >
                  {service.connected && (
                    <Trash2 className="w-3 h-3 text-red-500" />
                  )}
                  {!!!service.connected && (
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingNode} onOpenChange={() => setEditingNode(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingNode?.label} Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Service Provider
              </label>
              <Select
                value={editingNode?.currentProvider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editingNode?.availableProviders.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
