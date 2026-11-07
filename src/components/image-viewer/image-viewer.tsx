import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "../button/button";
import { CardActions } from "../card/card";
import { CompactNumber } from "../compact-number/compact-number";
import { SliderRoot, SliderControl, SliderValue } from "../slider/slider";
import { useUI } from "../../providers/ui-provider";
import styles from "./image-viewer.module.css";

type Parts = { body: ReactNode; controls: (children?: ReactNode) => ReactNode };
const ImageViewerContext = createContext<Parts | null>(null);
function useImageViewer() {
  const value = useContext(ImageViewerContext);
  if (!value) throw new Error("Image preview parts require ImageViewer.");
  return value;
}
export function ImageViewerViewport() {
  return useImageViewer().body;
}
export function ImageViewerControls({ children }: { children?: ReactNode }) {
  return useImageViewer().controls(children);
}

type Point = { x: number; y: number };
const center = { x: 0, y: 0 };
const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

/** Shared image state, composed into the host's existing preview Card. */
export type ImageViewerProps = {
  alt: string;
  load?: (signal: AbortSignal) => Promise<Blob>;
  src?: string;
  children: ReactNode;
};
export function ImageViewer({ alt, load, src, children }: ImageViewerProps) {
  const { t, locale } = useUI();
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  const [chosenZoom, setZoom] = useState<number>();
  const [pan, setPan] = useState<Point>(center);
  const [panning, setPanning] = useState(false);
  const drag = useRef<
    | {
        id: number;
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        pan: Point;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let objectUrl = "";
    setUrl("");
    setNatural({ width: 0, height: 0 });
    setStatus("loading");
    setZoom(undefined);
    setPan(center);
    if (src) {
      setUrl(src);
      return () => {
        active = false;
        controller.abort();
      };
    }
    void Promise.resolve()
      .then(() => {
        if (!load) throw new Error("Provide src or load.");
        return load(controller.signal);
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [load, src, attempt]);
  useLayoutEffect(() => {
    const node = viewport;
    if (!node) return;
    const measure = () =>
      setBox({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [viewport]);

  const fit =
    natural.width && natural.height && box.width && box.height
      ? Math.min(
          100,
          (100 * box.width) / natural.width,
          (100 * box.height) / natural.height,
        )
      : 100;
  const initialZoom = Math.max(0.01, Math.floor(fit * 100) / 100);
  const zoom = chosenZoom ?? initialZoom;
  const minimumZoom = Math.min(1, initialZoom);
  const zoomLabel = zoom.toLocaleString(locale, {
    maximumFractionDigits: 2,
  });
  const width = (natural.width * zoom) / 100;
  const height = (natural.height * zoom) / 100;
  const limitX = Math.max(0, (width - box.width) / 2);
  const limitY = Math.max(0, (height - box.height) / 2);
  const position = { x: clamp(pan.x, limitX), y: clamp(pan.y, limitY) };
  const canPan = status === "ready" && (limitX > 0 || limitY > 0);
  const endDrag = () => {
    drag.current = undefined;
    setPanning(false);
  };

  const body = (
    <div
      ref={setViewport}
      className={styles.viewport}
      data-image-viewport
      data-can-pan={canPan || undefined}
      data-panning={panning || undefined}
      role="region"
      aria-label={t("Image preview")}
      aria-description={t("Drag to move the image when zoomed in.")}
      aria-busy={status === "loading"}
      tabIndex={0}
      onPointerDown={(event) => {
        if (!canPan || event.button !== 0) return;
        event.preventDefault();
        const node = event.currentTarget;
        node.focus({ preventScroll: true });
        const bounds = node.getBoundingClientRect();
        drag.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          scaleX: bounds.width / node.clientWidth,
          scaleY: bounds.height / node.clientHeight,
          pan: position,
        };
        node.setPointerCapture(event.pointerId);
        setPanning(true);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        setPan({
          x: clamp(
            start.pan.x + (event.clientX - start.x) / start.scaleX,
            limitX,
          ),
          y: clamp(
            start.pan.y + (event.clientY - start.y) / start.scaleY,
            limitY,
          ),
        });
      }}
      onPointerUp={(event) => {
        if (drag.current?.id !== event.pointerId) return;
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId);
        endDrag();
      }}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={(event) => {
        if (!canPan || event.target !== event.currentTarget) return;
        const movement = {
          ArrowLeft: [-32, 0],
          ArrowRight: [32, 0],
          ArrowUp: [0, -32],
          ArrowDown: [0, 32],
        }[event.key];
        if (movement) {
          event.preventDefault();
          setPan({
            x: clamp(position.x + movement[0], limitX),
            y: clamp(position.y + movement[1], limitY),
          });
        } else if (event.key === "Home") {
          event.preventDefault();
          setPan(center);
        }
      }}
    >
      {url && (
        <img
          key={`${url}:${attempt}`}
          src={url}
          alt={alt}
          draggable={false}
          className={styles.image}
          style={{
            width,
            height,
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
            visibility: status === "ready" ? "visible" : "hidden",
          }}
          onLoad={(event) => {
            setNatural({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            });
            setStatus("ready");
          }}
          onError={() => setStatus("error")}
        />
      )}
      {status !== "ready" && (
        <div className={styles.status}>
          {status === "loading" ? (
            <p role="status">{t("Loading image…")}</p>
          ) : (
            <>
              <p role="alert">{t("The image could not be loaded.")}</p>
              <Button onClick={() => setAttempt((value) => value + 1)}>
                {t("Retry")}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
  const controls = (children?: ReactNode) => (
    <CardActions>
      <SliderRoot
        className={styles.zoom}
        label={t("Image zoom")}
        value={zoom}
        min={minimumZoom}
        max={400}
        step="any"
        disabled={status !== "ready"}
        onChange={(value) => {
          const next = Math.max(minimumZoom, Math.round(value * 100) / 100);
          endDrag();
          setZoom(next);
          setPan({
            x: clamp(
              position.x,
              Math.max(0, ((natural.width * next) / 100 - box.width) / 2),
            ),
            y: clamp(
              position.y,
              Math.max(0, ((natural.height * next) / 100 - box.height) / 2),
            ),
          });
        }}
      >
        <SliderControl aria-valuetext={`${zoomLabel}%`} />
        <SliderValue className={styles.zoomValue}>
          {Number.isInteger(zoom) ? (
            <CompactNumber
              value={zoom}
              mode="integer"
              digits={3}
              label={`${zoom}%`}
            />
          ) : (
            zoomLabel
          )}
          %
        </SliderValue>
      </SliderRoot>
      {children}
    </CardActions>
  );
  return (
    <ImageViewerContext value={{ body, controls }}>
      {children}
    </ImageViewerContext>
  );
}
