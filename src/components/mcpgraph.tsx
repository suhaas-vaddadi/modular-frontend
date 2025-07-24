"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Settings,
  Calendar,
  FileText,
  CheckSquare,
  Mail,
  Brain,
} from "lucide-react";

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
  color: string;
}

interface LLMNode {
  id: string;
  label: string;
  currentProvider: string;
  availableProviders: string[];
  availableModels: { [provider: string]: string[] };
  position: Position;
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
    connected: false,
    color: "#fb923c",
  },
  {
    id: "notes",
    label: "Notes",
    icon: <FileText className="w-5 h-5" />,
    position: { x: 500, y: 150 },
    connected: false,
    color: "#f87171",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: <CheckSquare className="w-5 h-5" />,
    position: { x: 450, y: 350 },
    connected: false,
    color: "#fbbf24",
  },
  {
    id: "google",
    label: "Google",
    icon: <Mail className="w-5 h-5" />,
    position: { x: 150, y: 300 },
    connected: false,
    color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
];

const INITIAL_LLM: LLMNode = {
  id: "llm",
  label: "LLM Core",
  currentProvider: "Claude Sonnet 4",
  availableProviders: ["Google", "OpenAI", "Claude"],
  availableModels: {
    Google: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5.pro",
    ],
    OpenAI: ["o4-mini", "o3", "o3-mini", "o3-pro", "GPT-4o"],
    Claude: ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"],
  },
  position: { x: 350, y: 225 },
};

export default function MCPCanvas() {
  const [services, setServices] = useState<ServiceNode[]>(INITIAL_SERVICES);
  const [llmNode, setLlmNode] = useState<LLMNode>(INITIAL_LLM);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    offset: { x: 0, y: 0 },
    startPosition: { x: 0, y: 0 },
  });
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<ServiceNode | null>(null);
  const [editingLLM, setEditingLLM] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [canvasOffset, setCanvasOffset] = useState<Position>({ x: 0, y: 0 });
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [panStartPosition, setPanStartPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [userClientId, setUserClientId] = useState<string>();
  const [userClientSecret, setUserClientSecret] = useState<string>();

  const [LLMNodeActive, setLLMNodeActive] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [models, setModels] = useState<string[]>([]);

  const [LLMApiKey, setLLMApiKey] = useState<string>("");
  const [panStartOffset, setPanStartOffset] = useState<Position>({
    x: 0,
    y: 0,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, nodeId?: string) => {
      e.preventDefault();

      if (nodeId) {
        // Node dragging
        let nodePosition: Position;

        if (nodeId === "llm") {
          nodePosition = llmNode.position;
        } else {
          const node = services.find((s) => s.id === nodeId);
          if (!node) return;
          nodePosition = node.position;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        // Calculate offset from mouse to node center
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const nodeScreenX = nodePosition.x + canvasOffset.x;
        const nodeScreenY = nodePosition.y + canvasOffset.y;

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
    [services, llmNode, canvasOffset]
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

          if (dragState.nodeId === "llm") {
            setLlmNode((prev) => ({ ...prev, position: newPosition }));
          } else {
            setServices((prev) =>
              prev.map((service) =>
                service.id === dragState.nodeId
                  ? { ...service, position: newPosition }
                  : service
              )
            );
          }
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

  const handleEdit = async (nodeId: string) => {
    const node = services.find((s) => s.id === nodeId);
    if (node) {
      setEditingNode(node);
      setActiveNode(null);
    }
  };

  const handleEditLLM = () => {
    setEditingLLM(true);
    setActiveNode(null);
  };

  const handleLLMProviderChange = (newProvider: string) => {
    setLlmNode((prev) => ({ ...prev, currentProvider: newProvider }));
    const newModels = llmNode.availableModels[newProvider];
    setModels(newModels);
    if (newModels && newModels.length > 0) {
      setSelectedModel(newModels[0]);
    }
  };

  const handleLLMChange = async () => {
    setEditingLLM(false);

    if (!selectedModel || !LLMApiKey) {
      return;
    }

    try {
      const res = await fetch("/api/chat", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: llmNode.currentProvider,
          model: selectedModel,
          apiKey: LLMApiKey,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      setLLMNodeActive(true);
      setEditingLLM(false);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Failed to save changes: ${error.message}`);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

  const getConnectionPath = useCallback((from: Position, to: Position) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const controlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5;

    return `M ${from.x} ${from.y} Q ${from.x + dx / 2 + controlOffset} ${
      from.y + dy / 2
    } ${to.x} ${to.y}`;
  }, []);

  async function handleNodeSubmit(editingNode: ServiceNode): Promise<void> {
    if (editingNode.label == "Google") {
      const res = await fetch("/api/mcp-servers/calendar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: userClientId,
          client_secret: userClientSecret,
        }),
      });
      if (!res.ok) {
        alert(
          "Error in setting up Gsuite connection. Check client credentials"
        );
      } else {
        editingNode.connected = true;
        setEditingNode(null);
      }
    }
  }

  return (
    <div
      className="w-full h-screen bg-gradient-to-br overflow-hidden relative"
      style={{ backgroundColor: "#2C2C2C" }}
    >
      {/* Animated background dots */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div
          className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-10 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

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
            <linearGradient
              id="connectionGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
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
                  x: llmNode.position.x + canvasOffset.x,
                  y: llmNode.position.y + canvasOffset.y,
                },
                {
                  x: service.position.x + canvasOffset.x,
                  y: service.position.y + canvasOffset.y,
                }
              )}
              stroke={
                service.connected
                  ? hoveredNode === service.id
                    ? "url(#connectionGradient)"
                    : "#64748b"
                  : "#374151"
              }
              strokeWidth={hoveredNode === service.id ? "3" : "2"}
              fill="none"
              opacity={
                service.connected
                  ? hoveredNode === service.id
                    ? 0.9
                    : 0.6
                  : 0.3
              }
              filter={
                hoveredNode === service.id
                  ? "url(#strongGlow)"
                  : service.connected
                  ? "url(#glow)"
                  : "none"
              }
              className="transition-all duration-300 ease-out"
            />
          ))}
        </svg>

        {/* Central LLM Node */}
        <div
          className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
            dragState.nodeId === "llm"
              ? "scale-110 z-50"
              : "hover:scale-105 z-30"
          } ${hoveredNode === "llm" ? "z-40" : ""}`}
          style={{
            left: llmNode.position.x + canvasOffset.x,
            top: llmNode.position.y + canvasOffset.y,
            transition:
              dragState.nodeId === "llm" || isPanningCanvas
                ? "none"
                : "all 0.3s ease-out",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(e, "llm");
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleNodeClick("llm");
          }}
          onMouseEnter={() => setHoveredNode("llm")}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div
            className={`w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-blue-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-700 relative overflow-hidden ${
              LLMNodeActive ? "" : "opacity-50"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-300/30 to-transparent rounded-full"></div>
            <Brain className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
          </div>
          <div className="text-center mt-3">
            <div
              className={`text-lg font-bold text-white drop-shadow-lg ${
                LLMNodeActive ? "" : "opacity-50"
              }`}
            >
              {llmNode.label}
            </div>
            <div
              className={`text-sm text-slate-300 ${
                LLMNodeActive ? "" : "opacity-50"
              }`}
            >
              {LLMNodeActive ? `${llmNode.currentProvider}` : "Select LLM"}
            </div>
          </div>
        </div>

        {/* LLM Action Buttons */}
        {activeNode === "llm" && (
          <div
            className="absolute z-50 flex gap-2"
            style={{
              left: llmNode.position.x + canvasOffset.x + 60,
              top: llmNode.position.y + canvasOffset.y - 20,
            }}
          >
            <button
              className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-md shadow-xl hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                handleEditLLM();
              }}
            >
              <Settings className="w-3 h-3 text-slate-200" />
            </button>
          </div>
        )}

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
                    : "all 0.3s ease-out",
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, service.id);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingNode(service);
              }}
              onMouseEnter={() => setHoveredNode(service.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div
                className={`w-18 h-18 rounded-full flex items-center justify-center shadow-xl border-3 transition-all duration-300 relative overflow-hidden ${
                  service.connected
                    ? `border-slate-600`
                    : `border-slate-500 opacity-50`
                } ${
                  hoveredNode === service.id ? "shadow-2xl border-blue-400" : ""
                }`}
                style={{
                  background: service.color,
                  boxShadow: service.connected
                    ? hoveredNode === service.id
                      ? `0 0 30px ${service.color}40, 0 20px 40px rgba(0,0,0,0.4)`
                      : `0 0 20px ${service.color}30, 0 10px 30px rgba(0,0,0,0.3)`
                    : "0 5px 20px rgba(0,0,0,0.2)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                <div className="absolute inset-0 bg-gradient-to-tl from-white/10 to-transparent rounded-full"></div>
                <div
                  className={`relative z-10 ${
                    service.connected
                      ? "text-slate-800 drop-shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {service.icon}
                </div>
              </div>
              <div className="text-center mt-2">
                <div
                  className={`text-sm font-semibold ${
                    service.connected
                      ? "text-white drop-shadow-lg"
                      : "text-slate-400"
                  }`}
                >
                  {service.label}
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
                <button
                  className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-md shadow-xl hover:bg-slate-700 hover:border-slate-500 transition-all duration-200 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(service.id);
                  }}
                >
                  <Settings className="w-3 h-3 text-slate-200" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Service Modal */}
      {editingNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-4">
              Configure {editingNode.label} Service
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2"></label>
              </div>

              {editingNode.label == "Google" && (
                <div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Gsuite Client Id
                    </label>
                    <div className="space-y-3">
                      <input
                        placeholder="Paste your client id here..."
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                        onChange={(e) => {
                          setUserClientId(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Gsuite Client Secret
                    </label>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Paste your client secret key here..."
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                        onChange={(e) => {
                          setUserClientSecret(e.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      You will have to verify access to GSuite services later
                    </label>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingNode(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleNodeSubmit(editingNode)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit LLM Modal */}
      {editingLLM && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-white mb-6">
              Edit {llmNode.label}
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  LLM Provider
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {llmNode.availableProviders.map((provider) => (
                    <button
                      key={provider}
                      onClick={() => handleLLMProviderChange(provider)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${
                        llmNode.currentProvider === provider
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                          : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:border-slate-500"
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-300 mb-3">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  API Key
                </label>
                <div className="space-y-3">
                  <input
                    type="password"
                    placeholder="Paste your API key here..."
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
                    onChange={(e) => {
                      setLLMApiKey(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditingLLM(false)}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  onClick={() => {
                    handleLLMChange();
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
