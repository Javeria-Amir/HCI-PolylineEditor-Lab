import {
  DrawAction,
  DRAW_OPTIONS,
  // STROKE_COLOR,
} from "@/constants/Paint.constants";
import { Box, IconButton, Popover, Portal } from "@chakra-ui/react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage, Line, Circle } from "react-konva";

// import type { KonvaEventObject, Node, NodeConfig } from "konva/lib/Node";
import { Stage as StageType } from "konva/lib/Stage";
import { XLg } from "react-bootstrap-icons";
import { SketchPicker } from "react-color";
import { v4 as uuidv4 } from "uuid";
import type { HistoryState, Polyline, Scribble } from "./types/Paint.types";
import { getNumericVal, getRelativePointerPosition } from "@/utilities";
import ShortcutsModal from "./ShortcutsModal";
import { QuestionCircle } from "react-bootstrap-icons";
import "./Paint.css";
import ThemeToggle from "./ThemeToggle";
import NavBar from "./NavBar";

const Paint = () => {
  const [color, setColor] = useState("#fff");
  const [isDark, setIsDark] = useState(true); //state to handle dark/light mode
  const [scribbles, setScribbles] = useState<Scribble[]>([]);
  const [polylines, setPolylines] = useState<Polyline[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [drawAction, setDrawAction] = useState<DrawAction>(DrawAction.Scribble); //specifies the action selected from the button group
  const [selectedPoint, setSelectedPoint] = useState<{
    polyId: string;
    index: number;
  } | null>(null);
  const [{ viewWidth, viewHeight }, setViewMeasures] = useState<{
    viewHeight: number | undefined;
    viewWidth: number | undefined;
  }>({
    viewHeight: undefined,
    viewWidth: undefined,
  });
  const [showShortcuts, setShowShortcuts] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageType | null>(null);
  const currentShapeRef = useRef<string>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hoverRef = useRef<any>(null);

  // UNDO/REDO Functionality
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyStep, setHistoryStep] = useState<number>(-1);

  // Helper to save a new state to history
  const saveHistory = useCallback(
    (newScribbles: Scribble[], newPolylines: Polyline[]) => {
      const snapshot: HistoryState = {
        scribbles: JSON.parse(JSON.stringify(newScribbles)),
        polylines: JSON.parse(JSON.stringify(newPolylines)),
      };

      setHistory((prev) => {
        const trimmed = prev.slice(0, historyStep + 1);
        return [...trimmed, snapshot];
      });

      setHistoryStep((prev) => prev + 1);
    },
    [historyStep],
  );

  const onUndo = useCallback(() => {
    setHistoryStep((prev) => {
      if (prev <= 0) return prev;

      const newStep = prev - 1;
      const state = history[newStep];

      setScribbles(state.scribbles);
      setPolylines(state.polylines);

      return newStep;
    });
  }, [history]);

  const onRedo = useCallback(() => {
    setHistoryStep((prev) => {
      if (prev >= history.length - 1) return prev;

      const newStep = prev + 1;
      const state = history[newStep];

      setScribbles(state.scribbles);
      setPolylines(state.polylines);

      return newStep;
    });
  }, [history]);
  const onClear = useCallback(() => {
    const emptyScribbles: Scribble[] = [];
    const emptyPolylines: Polyline[] = [];

    setScribbles([]);
    setPolylines([]);
    setCurrentId(null);
    setSelectedPoint(null);

    saveHistory(emptyScribbles, emptyPolylines);
  }, [saveHistory]);

  useEffect(() => {
    if (containerRef.current) {
      setViewMeasures({
        viewHeight: containerRef.current.offsetHeight,
        viewWidth: containerRef.current.offsetWidth,
      });
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "b") setDrawAction(DrawAction.Begin);
      if (e.key === "d") setDrawAction(DrawAction.Delete);
      if (e.key === "m") setDrawAction(DrawAction.Move);
      if (e.key === "r") {
        setPolylines([...polylines]);
        setDrawAction(DrawAction.Refresh);
      }
      if (e.key === "q") onClear();
      if (e.ctrlKey) {
        if (e.key === "z") {
          setDrawAction(DrawAction.Undo);
          e.preventDefault();
          onUndo();
        }
        if (e.key === "y") {
          setDrawAction(DrawAction.Redo);
          e.preventDefault();
          onRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [polylines, onClear, onUndo, onRedo]);

  const toggleTheme = () => setIsDark(!isDark);

  // FIND CLOSEST POINT
  const findClosestPoint = useCallback(
    (x: number, y: number) => {
      let minDist = Infinity;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any = null;

      polylines.forEach((poly) => {
        poly.points.forEach((_, i) => {
          if (i % 2 !== 0) return;

          const px = poly.points[i];
          const py = poly.points[i + 1];

          const dist = Math.hypot(px - x, py - y);

          if (dist < minDist) {
            minDist = dist;
            result = { polyId: poly.id, index: i };
          }
        });
      });

      return result;
    },
    [polylines],
  );

  // MOUSE DOWN
  const onStageMouseDown = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    const x = getNumericVal(pos?.x);
    const y = getNumericVal(pos?.y);

    if (drawAction === DrawAction.Scribble) {
      const id = uuidv4();
      currentShapeRef.current = id;
      setScribbles((prevScribbles) => [
        ...prevScribbles,
        {
          id,
          points: [x, y],
          color,
        },
      ]);
    }

    // BEGIN MODE (DRAW)
    if (drawAction === DrawAction.Begin) {
      if (!currentId) {
        const id = uuidv4();
        setCurrentId(id);

        setPolylines((prev) => [...prev, { id, points: [x, y], color: color }]);
      } else {
        setPolylines((prev) =>
          prev.map((p) =>
            p.id === currentId ? { ...p, points: [...p.points, x, y] } : p,
          ),
        );
      }
    }

    // DELETE MODE
    if (drawAction === DrawAction.Delete) {
      const closest = findClosestPoint(x, y);
      if (!closest) return;

      setPolylines((prev) =>
        prev.map((p) => {
          if (p.id !== closest.polyId) return p;

          const newPoints = [...p.points];
          newPoints.splice(closest.index, 2);

          return { ...p, points: newPoints };
        }),
      );
    }

    saveHistory(scribbles, polylines);

    // MOVE MODE
    if (drawAction === DrawAction.Move) {
      const closest = findClosestPoint(x, y);
      if (closest) {
        setSelectedPoint(closest);
      }
    }
  }, [
    drawAction,
    color,
    currentId,
    findClosestPoint,
    polylines,
    scribbles,
    saveHistory,
  ]);

  const onStageMouseMove = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    const x = getNumericVal(pos?.x);
    const y = getNumericVal(pos?.y);

    if (drawAction === DrawAction.Scribble && currentShapeRef.current) {
      const id = currentShapeRef.current;
      setScribbles((prevScribbles) =>
        prevScribbles?.map((prevScribble) =>
          prevScribble.id === id
            ? {
                ...prevScribble,
                points: [...prevScribble.points, x, y],
              }
            : prevScribble,
        ),
      );
    }

    if (drawAction !== DrawAction.Move || !selectedPoint) return;

    setPolylines((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPoint.polyId) return p;

        const newPoints = [...p.points];
        newPoints[selectedPoint.index] = x;
        newPoints[selectedPoint.index + 1] = y;

        return { ...p, points: newPoints };
      }),
    );
  }, [drawAction, selectedPoint]);
  const onStageMouseUp = () => {
    // If we were moving or scribbling, save the state once released
    if (
      drawAction === DrawAction.Scribble ||
      drawAction === DrawAction.Move ||
      drawAction === DrawAction.Delete
    ) {
      saveHistory(scribbles, polylines);
    }
    setSelectedPoint(null);
    currentShapeRef.current = null;
  };

  //We basically create a hidden canvas in the background, paint it white (or any color), slap your drawing on top of it, and then download that.
  const handleSaveImage = () => {
    const stage = stageRef.current;
    if (!stage) return;

    // 1. Convert the Konva Stage to a standard HTML5 Canvas element
    // We use pixelRatio: 2 for that "High Quality" sharpness
    const stageCanvas = stage.toCanvas({ pixelRatio: 2 });

    // 2. Create an off-screen "buffer" canvas in memory
    const bufferCanvas = document.createElement("canvas");
    bufferCanvas.width = stageCanvas.width;
    bufferCanvas.height = stageCanvas.height;
    const ctx = bufferCanvas.getContext("2d"); //method that initializes the drawing surface.

    if (ctx) {
      ctx.fillStyle = color === "#fff" ? "#999ca0" : "#ffffff";
      ctx.fillRect(0, 0, bufferCanvas.width, bufferCanvas.height);

      //Draw your Konva drawing on top of the solid background
      ctx.drawImage(stageCanvas, 0, 0);

      // Trigger the download from the buffer
      const link = document.createElement("a");
      link.download = `canvas-export-${Date.now()}.png`;
      link.href = bufferCanvas.toDataURL("image/png", 1.0);
      link.click();
    }
  };

  return (
    <div className="app-wrapper">
      <NavBar onClick={handleSaveImage} />
      <Box
        ref={containerRef}
        className={`paint-container ${isDark ? "" : "light-mode"}`}
      >
        {/* The Modal */}
        <ShortcutsModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
        <Box className="toolbar">
          {DRAW_OPTIONS.map(({ id, label, icon: Icon }) => (
            <IconButton
              key={id}
              aria-label={label}
              onClick={() => {
                setDrawAction(id);
                switch (id) {
                  case DrawAction.Undo:
                    onUndo();
                    break;
                  case DrawAction.Redo:
                    onRedo();
                    break;
                  case DrawAction.Refresh:
                    setPolylines([...polylines]);
                    break;
                  default:
                    break;
                }
              }}
              className={`tool-btn ${id === drawAction ? "active" : ""}`}
            >
              <Icon />
            </IconButton>
          ))}

          {/* Color Picker */}
          <Popover.Root>
            <Popover.Trigger>
              <Box className="color-preview" bg={color} />
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content width="300px" bg="white" p={2}>
                  <Popover.Arrow />
                  <SketchPicker
                    color={color}
                    onChangeComplete={(c) => setColor(c.hex)}
                  />
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>

          <IconButton className="tool-btn" onClick={onClear}>
            <XLg />
          </IconButton>
          {/* Toggle switch */}
          <ThemeToggle isDark={isDark} toggle={toggleTheme} />
          {/* Info Button */}
          <IconButton
            className="tool-btn"
            onClick={() => setShowShortcuts(true)}
            title="Shortcuts"
          >
            <QuestionCircle />
          </IconButton>
        </Box>
        <Box className="canvas-wrapper">
          <Box className="canvas-box">
            <Stage
              ref={stageRef}
              height={viewHeight}
              width={viewWidth}
              // 3 Event-handler methods to draw stuff on the canvas
              onMouseUp={onStageMouseUp}
              onMouseDown={onStageMouseDown}
              onMouseMove={onStageMouseMove}
            >
              <Layer>
                {scribbles.map((scribble) => (
                  <Line
                    key={scribble.id}
                    id={scribble.id}
                    lineCap="round"
                    lineJoin="round"
                    stroke={scribble?.color}
                    strokeWidth={4}
                    points={scribble.points}
                  />
                ))}
                {polylines.map((poly) => (
                  <Fragment key={poly.id}>
                    {/* LINE */}
                    <Line stroke={color} strokeWidth={2} points={poly.points} />
                    <Circle
                      radius={9}
                      fill={"#afabee"}
                      ref={hoverRef}
                      visible={false}
                    />

                    {/* POINTS */}
                    {poly.points.map((_, i) => {
                      if (i % 2 !== 0) return null;
                      return (
                        <Circle
                          key={`${poly.id}-${i}`}
                          x={poly.points[i]}
                          y={poly.points[i + 1]}
                          radius={4}
                          fill={"#a78bfa"} // purple
                          stroke={"#c4b5fd"}
                          strokeWidth={1}
                          onMouseOver={(e) => {
                            e.target.setAttrs({ fill: "#eee" });
                            document.body.style.cursor = "pointer";
                            hoverRef?.current?.setAttrs({
                              x: e.target.x(),
                              y: e.target.y(),
                              visible: true,
                            });
                          }}
                          onMouseOut={(e) => {
                            e.target.setAttrs({ fill: "white" });
                            document.body.style.cursor = "default";
                            hoverRef?.current?.setAttrs({
                              visible: false,
                            });
                          }}
                        />
                      );
                    })}
                  </Fragment>
                ))}
              </Layer>
            </Stage>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default Paint;
