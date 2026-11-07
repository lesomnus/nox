import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useRef } from "react";
import {
  Button,
  ImageViewer,
  ImageViewerViewport,
  ImageViewerControls,
} from "@lesomnus/nox";
import docs from "../../../docs/image-viewer.md?raw";
const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000"><rect x="80" y="80" width="1440" height="840" rx="120" fill="#678d82" fill-opacity=".6"/><circle cx="800" cy="500" r="260" fill="#b3ab72"/><text x="800" y="530" text-anchor="middle" font-size="72" fill="#222">Actual size: 1600 × 1000</text></svg>';
const src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
const meta = {
  title: "Components/ImageViewer",
  component: ImageViewer,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  args: { alt: "Transparent illustration", src, children: null },
  render: (args) => (
    <ImageViewer {...args}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 540,
          height: 340,
        }}
      >
        <ImageViewerViewport />
        <ImageViewerControls>
          <Button>Done</Button>
        </ImageViewerControls>
      </div>
    </ImageViewer>
  ),
} satisfies Meta<typeof ImageViewer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LoadAndRetry: Story = {
  render: function Example() {
    const attempt = useRef(0);
    const load = useCallback(async (signal: AbortSignal) => {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, 800);
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
      if (!attempt.current++) {
        throw new Error("Unavailable");
      }
      return new Blob([svg], { type: "image/svg+xml" });
    }, []);
    return (
      <ImageViewer alt="Loaded illustration" load={load}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 540,
            height: 340,
          }}
        >
          <ImageViewerViewport />
          <ImageViewerControls />
        </div>
      </ImageViewer>
    );
  },
};
