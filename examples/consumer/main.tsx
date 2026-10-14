import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  SegmentedControl,
  SettingSlider,
  ValueMenu,
} from "@lesomnus/nox";
import "@lesomnus/nox/styles.css";
import "./style.css";

function App() {
  const [value, setValue] = useState("medium");
  const [detail, setDetail] = useState<number | undefined>(4);
  const options = ["low", "medium", "high"].map((value) => ({
    value,
    label: value,
  }));
  return (
    <main>
      <h1>Nox</h1>
      <p>Consumer preview — {import.meta.env.MODE} connection</p>
      <Button onClick={() => alert("Saved")}>Save</Button>
      <SegmentedControl
        label="Effort"
        options={options}
        value={value}
        onChange={setValue}
      />
      <ValueMenu
        label="Effort menu"
        options={options}
        value={value}
        choose={setValue}
      />
      <SettingSlider
        label="Detail"
        value={detail}
        inherited={3}
        onChange={setDetail}
      />
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
