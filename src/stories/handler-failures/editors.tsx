import { useId, useRef, useState } from "react";
import {
  ActionError,
  Button,
  Calendar,
  ColorPicker,
  DatePicker,
  DescriptionList,
  EditableValue,
  Form,
  FormField,
  PinInput,
  SettingSlider,
  Slider,
  useAsyncAction,
  type RgbColor,
} from "@lesomnus/nox";
import { Example, useCommit, useFailOnce } from "./shared";

export function FormFailureExample() {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const submit = useRef<HTMLButtonElement>(null);
  const failOnce = useFailOnce();
  const [saved, setSaved] = useState("");
  const save = useAsyncAction(async (data: FormData) => {
    await failOnce();
    setSaved(String(data.get("name")));
  });
  return (
    <Example title="Form">
      <Form
        ref={form}
        columns={1}
        aria-label="Workspace form"
        aria-busy={save.pending}
        onSubmit={(event) => {
          event.preventDefault();
          // Capture native values before yielding; the event's currentTarget is transient.
          void save.run(new FormData(event.currentTarget));
        }}
      >
        <FormField label="Workspace name" htmlFor={id}>
          <input
            id={id}
            name="name"
            defaultValue="My workspace"
            required
            readOnly={save.pending}
            aria-describedby={save.error ? `${id}-error` : undefined}
            onChange={save.reset}
          />
        </FormField>
        <Button ref={submit} type="submit" loading={save.pending}>
          Save workspace
        </Button>
      </Form>
      {save.error && (
        <ActionError
          id={`${id}-error`}
          pending={save.pending}
          onRetry={() => {
            submit.current?.focus();
            form.current?.requestSubmit(submit.current ?? undefined);
          }}
        >
          Could not save. Your entered name is preserved.
        </ActionError>
      )}
      <output aria-label="Saved value">{saved || "Not saved"}</output>
    </Example>
  );
}

export function EditableFailureExample() {
  const [value, setValue] = useState("My workspace");
  const failOnce = useFailOnce();
  return (
    <Example title="EditableValue">
      <DescriptionList
        rows={[
          {
            label: "Name",
            value: (
              <EditableValue
                label="Name"
                value={value}
                save={async (next) => {
                  // EditableValue already awaits save, catches rejection and keeps its editor open.
                  await failOnce();
                  setValue(next);
                }}
              />
            ),
          },
        ]}
      />
      <output aria-label="Saved value">{value}</output>
    </Example>
  );
}

export function PinFailureExample() {
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const requested = useRef("");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const failOnce = useFailOnce();
  const verify = useAsyncAction(async (next: string) => {
    requested.current = next;
    await failOnce();
    setVerified(true);
  });
  const run = async (next: string) => {
    if (await verify.run(next)) input.current?.focus();
  };
  return (
    <Example title="PinInput">
      <PinInput
        ref={input}
        label="Verification code"
        value={code}
        length={6}
        readOnly={verify.pending}
        aria-busy={verify.pending}
        aria-describedby={verify.error ? id : undefined}
        onChange={(next) => {
          setCode(next);
          setVerified(false);
          verify.reset();
        }}
        onComplete={(next) => void run(next)}
      />
      {verify.error && (
        <ActionError
          id={id}
          pending={verify.pending}
          onRetry={() => void run(requested.current)}
        >
          Verification could not reach the server. Your code is preserved.
        </ActionError>
      )}
      {verified && <p role="status">Code verified</p>}
    </Example>
  );
}

export function DateFailureExample({
  calendar = false,
}: {
  calendar?: boolean;
}) {
  const state = useCommit<string | null>("2026-10-21");
  const props = {
    label: "Schedule",
    value: state.value,
    onChange: state.change,
    disabled: state.pending,
    "aria-describedby": state.description,
  };
  return (
    <Example title={calendar ? "Calendar" : "DatePicker"}>
      <div ref={state.controlRef}>
        {calendar ? (
          <Calendar {...props} defaultMonth="2026-10-01" />
        ) : (
          <DatePicker {...props} />
        )}
      </div>
      {state.feedback}
      <output aria-label="Saved value">{state.value ?? "No date"}</output>
    </Example>
  );
}

export function DraftFailureExample({
  kind = "color",
}: {
  kind?: "color" | "slider" | "setting-slider";
}) {
  const [color, setColor] = useState<RgbColor>({ r: 217, g: 255, b: 48 });
  const [amount, setAmount] = useState<number | undefined>(4);
  const [saved, setSaved] = useState("Not saved");
  const submit = useRef<HTMLButtonElement>(null);
  const failOnce = useFailOnce();
  const save = useAsyncAction(async (next: string) => {
    await failOnce();
    setSaved(next);
  });
  const draft =
    kind === "color" ? JSON.stringify(color) : String(amount ?? "Inherited");
  const title = {
    color: "ColorPicker",
    slider: "Slider",
    "setting-slider": "SettingSlider",
  }[kind];
  return (
    <Example title={title}>
      <p>Adjust freely, then save. No request runs on every drag frame.</p>
      {kind === "color" && (
        <ColorPicker
          label="Accent color"
          value={color}
          disabled={save.pending}
          onChange={(next) => {
            setColor(next);
            save.reset();
          }}
        />
      )}
      {kind === "slider" && (
        <Slider
          label="Volume"
          min={0}
          max={8}
          value={amount}
          disabled={save.pending}
          onChange={(next) => {
            setAmount(next);
            save.reset();
          }}
        />
      )}
      {kind === "setting-slider" && (
        <SettingSlider
          label="Indent size"
          inherited={4}
          value={amount}
          disabled={save.pending}
          onChange={(next) => {
            setAmount(next);
            save.reset();
          }}
        />
      )}
      <Button
        ref={submit}
        type="button"
        loading={save.pending}
        onClick={() => void save.run(draft)}
      >
        Save changes
      </Button>
      {save.error && (
        <ActionError
          pending={save.pending}
          onRetry={() => {
            submit.current?.focus();
            void save.run(draft);
          }}
        >
          Could not save. Your draft is preserved.
        </ActionError>
      )}
      <output aria-label="Draft value">{draft}</output>
      <output aria-label="Saved value">{saved}</output>
    </Example>
  );
}
