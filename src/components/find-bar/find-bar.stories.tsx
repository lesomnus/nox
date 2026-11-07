import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties } from "react";
import {
  Button,
  FindBar,
  FindBarControls,
  FindBarIcon,
  FindBarInput,
  FindBarCounter,
  FindBarOptions,
  FindBarClose,
  FindBarResults,
  FindBarResult,
  FindBarMessage,
} from "@lesomnus/nox";
import docs from "../../../docs/find-bar.md?raw";
function Example({ motion = false }: { motion?: boolean }) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("Menu");
  const [selected, setSelected] = useState(0);
  const [modes, setModes] = useState({
    matchCase: false,
    wholeWord: false,
    useRegex: false,
  });
  const rows = [
    "Menu opens beside the selected value.",
    "Menu options share the same surface.",
    "The menu keeps focus while searching.",
    "Buttons remain the same size.",
  ];
  let error = "";
  let pattern: RegExp | undefined;
  try {
    if (query)
      pattern = new RegExp(
        modes.useRegex ? query : modes.wholeWord ? `\\b${query}\\b` : query,
        modes.matchCase ? "" : "i",
      );
  } catch {
    error = "Invalid regular expression";
  }
  const hits = pattern ? rows.filter((row) => pattern!.test(row)) : [];
  const current = Math.min(selected, Math.max(0, hits.length - 1));
  if (!open) return <Button onClick={() => setOpen(true)}>Open search</Button>;
  return (
    <FindBar
      motion={motion}
      aria-label="Find in example"
      style={{ width: 560 }}
    >
      <FindBarControls>
        <FindBarIcon />
        <FindBarInput
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && hits.length)
              setSelected((current + 1) % hits.length);
          }}
        />
        <FindBarCounter
          current={hits.length ? current + 1 : 0}
          count={hits.length}
        />
        <FindBarOptions
          options={[
            {
              id: "matchCase",
              label: "Match case",
              symbol: "Aa",
              pressed: modes.matchCase,
            },
            {
              id: "wholeWord",
              label: "Match whole word",
              symbol: "ab",
              pressed: modes.wholeWord,
            },
            {
              id: "useRegex",
              label: "Use regular expression",
              symbol: ".*",
              pressed: modes.useRegex,
            },
          ]}
          onChange={(id, pressed) => {
            setModes((old) => ({ ...old, [id]: pressed }));
            setSelected(0);
          }}
        />
        <FindBarClose onClick={() => setOpen(false)} />
      </FindBarControls>
      {error ? (
        <FindBarMessage role="alert">{error}</FindBarMessage>
      ) : hits.length ? (
        <FindBarResults
          style={{ "--search-result-count": hits.length } as CSSProperties}
        >
          {hits.map((hit, index) => (
            <FindBarResult
              key={hit}
              aria-pressed={index === current}
              onClick={() => setSelected(index)}
            >
              {hit}
            </FindBarResult>
          ))}
        </FindBarResults>
      ) : query ? (
        <FindBarMessage>No matches</FindBarMessage>
      ) : null}
    </FindBar>
  );
}
const meta = {
  title: "Components/FindBar",
  component: FindBar,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: docs } } },
  render: (args) => <Example motion={args.motion} />,
} satisfies Meta<typeof FindBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const Overlay: Story = { args: { motion: true } };
