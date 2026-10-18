import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";
import type { IScannerControls } from "@zxing/browser";
import type {
  VendingDose,
  VendingOrder,
  VendingProduct,
  VendingEligibility,
  PharmacistReferral,
} from "../../../packages/shared/src/types/Vending";
import { colors } from "../../../packages/shared/src/theme/colors";
import { PillPattern } from "./PillPattern";
import { Icon } from "./Icon";
import "./style.css";

type Session = { token: string; firstName: string };
type KioskData = {
  schedule: (VendingDose & { dispensing: VendingEligibility })[];
  pharmacistReferral: PharmacistReferral;
  syncedAt: string;
  timezone: string;
  today: string;
  catalog: VendingProduct[];
  hardware: { mode: string; connected: boolean; label: string };
};
const money = (cents: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(
    cents / 100,
  );
const niceDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
async function api<T>(
  path: string,
  session: Session | null,
  body?: unknown,
  method = body ? "POST" : "GET",
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`/vending${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(session ? { Authorization: `Kiosk ${session.token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const result = await response.json();
    if (!response.ok)
      throw new Error(
        result.error || "Something went wrong. Please try again.",
      );
    return result;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        "The machine took too long to respond. Please try again.",
      );
    if (error instanceof TypeError)
      throw new Error("Unable to connect. Please try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <i />
      </span>
      <span>
        Medmobi Kiosk
        {!compact && (
          <span className="brand-small">A LITTLE CARE, EVERY DAY.</span>
        )}
      </span>
    </div>
  );
}
function Camera({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let controls: IScannerControls | undefined;
    let active = true;
    let found = false;
    const preview = video.current;
    const releaseVideo = () => {
      (preview?.srcObject as MediaStream | null)
        ?.getTracks()
        .forEach((track) => track.stop());
      if (preview) preview.srcObject = null;
    };
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera scanning needs localhost or HTTPS. You can still enter your code.",
      );
      return;
    }
    void import("@zxing/browser")
      .then(({ BrowserQRCodeReader }) => {
        if (!active || !preview) return;
        const reader = new BrowserQRCodeReader();
        return reader
          .decodeFromVideoDevice(
            undefined,
            preview,
            (result, _error, currentControls) => {
              if (!active || found || !result) return;
              const text = result.getText().trim().toUpperCase();
              if (!/^(?:(?:MEDMOBI|MEDIMOBI|INTELLIMED):)?[A-Z0-9]{5}$/.test(text)) return;
              found = true;
              currentControls.stop();
              onCode(text.replace(/^(?:MEDMOBI|MEDIMOBI|INTELLIMED):/, ""));
            },
          )
          .then((value) => {
            controls = value;
            if (!active) controls.stop();
          });
      })
      .catch(() => {
        releaseVideo();
        if (active)
          setError(
            "Could not open the webcam. Allow camera access or enter your code instead.",
          );
      });
    return () => {
      active = false;
      controls?.stop();
      releaseVideo();
    };
  }, [onCode]);
  return (
    <div className="modal-backdrop">
      <section
        className="dialog scanner"
        role="dialog"
        aria-modal="true"
        aria-label="Scan vending QR code"
      >
        <div className="camera-frame">
          <video ref={video} autoPlay muted playsInline />
          <span aria-hidden="true" />
          <button className="close" onClick={onClose} aria-label="Close camera">
            ×
          </button>
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="secondary wide" onClick={onClose}>
          Enter code instead
        </button>
      </section>
    </div>
  );
}
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [code, setCode] = useState("");
  const [camera, setCamera] = useState(false);
  const [keypad, setKeypad] = useState(false);
  const [data, setData] = useState<KioskData | null>(null);
  const [tab, setTab] = useState<"schedule" | "shop" | "dispense">("schedule");
  const [startDate, setStartDate] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [days, setDays] = useState(7);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [order, setOrder] = useState<VendingOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lastActivity = useRef(Date.now());
  const sessionVersion = useRef(0);
  const working = order?.status === "queued" || order?.status === "dispensing";

  function logout() {
    sessionVersion.current++;
    setBusy(false);
    if (session)
      void api("/session", session, undefined, "DELETE").catch(() => {});
    setSession(null);
    setData(null);
    setOrder(null);
    setCart({});
    setCode("");
    setError("");
    setTab("schedule");
    setCamera(false);
    setKeypad(false);
    setStartDate("");
    setScheduleDate("");
    setDays(7);
  }
  useEffect(() => {
    if (!session) return;
    lastActivity.current = Date.now();
    const update = () => {
      lastActivity.current = Date.now();
    };
    document.addEventListener("pointerdown", update);
    document.addEventListener("keydown", update);
    const timer = setInterval(() => {
      if (!working && Date.now() - lastActivity.current > 120000) logout();
    }, 5000);
    return () => {
      clearInterval(timer);
      document.removeEventListener("pointerdown", update);
      document.removeEventListener("keydown", update);
    };
  }, [session, working]);
  useEffect(() => {
    if (!session || !order || !["queued", "dispensing"].includes(order.status))
      return;
    let active = true;
    let inFlight = false;
    const timer = setInterval(() => {
      if (inFlight) return;
      inFlight = true;
      void api<VendingOrder>(`/orders/${order.id}`, session)
        .then((next) => {
          if (active) {
            setOrder(next);
            if (next.status === "completed" && next.plan.kind === "purchase") setCart({});
          }
        })
        .catch((caught) => {
          if (active) setError(caught.message);
        }).finally(() => { inFlight = false; });
    }, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [session, order?.id, order?.status]);
  async function refresh(current = session) {
    if (!current) return;
    const version = sessionVersion.current;
    const result = await api<KioskData>("/kiosk", current);
    if (version !== sessionVersion.current) return;
    setData(result);
    setStartDate((value) => value || result.today);
    setScheduleDate((value) => value || result.today);
  }
  async function login(value: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setCamera(false);
    try {
      const result = await api<Session>("/session", null, { code: value });
      await refresh(result);
      setSession(result);
      setKeypad(false);
      lastActivity.current = Date.now();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not open your session.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function review(kind: "schedule" | "purchase") {
    if (!session || busy) return;
    const version = sessionVersion.current;
    setBusy(true);
    setError("");
    try {
      const next = await api<VendingOrder>(
          "/orders",
          session,
          kind === "schedule"
            ? { kind, days, startDate }
            : {
                kind,
                cart: Object.entries(cart)
                  .filter(([, quantity]) => quantity > 0)
                  .map(([productId, quantity]) => ({ productId, quantity })),
              },
        );
      if (version === sessionVersion.current) setOrder(next);
    } catch (caught) {
      if (version === sessionVersion.current) setError((caught as Error).message);
    } finally {
      if (version === sessionVersion.current) setBusy(false);
    }
  }
  async function confirm() {
    if (!session || !order || busy) return;
    const version = sessionVersion.current;
    setBusy(true);
    setError("");
    try {
      const next = await api<VendingOrder>(`/orders/${order.id}/confirm`, session, {});
      if (version === sessionVersion.current) {
        setOrder(next);
        if (next.status === "completed" && next.plan.kind === "purchase") setCart({});
      }
    } catch (caught) {
      if (version === sessionVersion.current) setError((caught as Error).message);
    } finally {
      if (version === sessionVersion.current) setBusy(false);
    }
  }
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const total =
    data?.catalog.reduce(
      (sum, item) => sum + item.priceCents * (cart[item.id] || 0),
      0,
    ) || 0;
  const viewedDate = scheduleDate || data?.today || "";
  const selectedDoses = data?.schedule.filter((dose) => dose.date === viewedDate) || [];
  const nextScheduledDate = data?.schedule.filter(dose => dose.date > viewedDate).map(dose => dose.date).sort()[0];
  const pickupEnd = new Date(`${startDate}T12:00:00Z`);
  pickupEnd.setUTCDate(pickupEnd.getUTCDate() + days - 1);
  const pickupEndDate = Number.isNaN(pickupEnd.getTime()) ? "" : pickupEnd.toISOString().slice(0, 10);
  const pickupDoses = data?.schedule.filter(dose => dose.date >= startDate && dose.date <= pickupEndDate && dose.status !== "taken" && !/as needed/i.test(dose.time)) || [];
  const pickupGroups = [...pickupDoses.reduce((groups, dose) => {
    const key = `${dose.name}\u0000${dose.dosage}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, { name: dose.name, dosage: dose.dosage, dispensing: dose.dispensing, count: 1 });
    return groups;
  }, new Map<string, { name: string; dosage: string; dispensing: VendingEligibility; count: number }>()).entries()];
  const readyCount = pickupDoses.filter(dose => dose.dispensing.eligible).length;
  const theme = {
    "--blue": colors.primary,
    "--cream": colors.background,
    "--muted": colors.textMuted,
    "--border": colors.border,
    "--accent": colors.accent,
    "--secondary": colors.secondary,
    "--surface-muted": colors.surfaceMuted,
    color: colors.text,
    backgroundColor: colors.background,
  } as CSSProperties;

  return (
    <div className={`app-shell ${session ? "has-session" : ""}`} style={theme}>
      <PillPattern />
      {!session ? (
        <main className="welcome-minimal">
          <Brand compact />
          <div className="welcome-choices">
            <button
              className="welcome-choice"
              disabled={busy}
              onClick={() => {
                setKeypad(true);
                setError("");
              }}
            >
              <span className="welcome-icon">
                <Icon name="keyboard" />
              </span>
              <strong>Enter code</strong>
            </button>
            <button
              className="welcome-choice"
              disabled={busy}
              onClick={() => {
                setCamera(true);
                setError("");
              }}
            >
              <span className="welcome-icon scan">
                <Icon name="qr" />
              </span>
              <strong>Scan QR code</strong>
            </button>
          </div>
          {error && !keypad && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </main>
      ) : (
        <div className="signed-in-layout">
          <main className="main-content">
            {error && !order && (
              <p role="alert" className="error error-banner">
                {error}
              </p>
            )}
            {tab === "schedule" && (
              <>
                <div className="schedule-controls">
                  <label className="schedule-date" htmlFor="schedule-date">
                    Schedule date
                    <input id="schedule-date" type="date" min={data?.today} value={viewedDate} onChange={event => setScheduleDate(event.target.value)} />
                  </label>
                  <div className="schedule-actions">
                    <button
                      className="secondary"
                      disabled={busy}
                      onClick={() => {
                        setBusy(true);
                        void refresh()
                          .catch((caught) => setError(caught.message))
                          .finally(() => setBusy(false));
                      }}
                    >
                      Refresh
                    </button>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => { setStartDate(viewedDate); setTab("dispense"); }}
                    >
                      Pick up medicines
                    </button>
                  </div>
                </div>
                <div className="dose-grid">
                  {selectedDoses.map((dose) => (
                    <article className="dose-card" key={dose.id}>
                      <span
                        className={`dose-icon ${dose.dispensing.eligible ? "pink" : "sky"}`}
                      >
                        <Icon name="plus" />
                      </span>
                      <div>
                        <p className="dose-time">{dose.time}</p>
                        <h3>{dose.name}</h3>
                        <p>{dose.dosage}</p>
                        <p
                          className={`eligibility ${dose.dispensing.eligible ? "otc" : "referral"}`}
                        >
                          {dose.status === "taken"
                            ? "Already taken"
                            : dose.date < data!.today
                              ? "Past dose"
                              : dose.dispensing.eligible
                                ? "Available for pickup"
                                : dose.dispensing.message}
                        </p>
                        {dose.dispensing.classification?.sourceUrl && <a className="classification-source" href={dose.dispensing.classification.sourceUrl} target="_blank" rel="noreferrer">Health Canada classification ↗</a>}
                      </div>
                    </article>
                  ))}
                </div>
                {!selectedDoses.length && (
                  <div className="empty-state">
                    <p>
                      No doses scheduled for {niceDate(viewedDate)}.
                    </p>
                    {nextScheduledDate ? <button className="secondary" onClick={() => setScheduleDate(nextScheduledDate)}>
                      View next doses · {niceDate(nextScheduledDate)}
                    </button> : <p>Check the dates and selected weekdays in your app, then refresh your schedule.</p>}
                  </div>
                )}
              </>
            )}
            {tab === "shop" && (
              <>
                <div className="product-grid">
                  {data?.catalog.map((product) => (
                    <article key={product.id} className="product-card">
                      <div
                        className={`product-art ${product.color}`}
                        aria-hidden="true"
                      >
                        <span className="bottle">
                          <i />✚
                        </span>
                      </div>
                      <h3>{product.name}</h3>
                      <p>{product.detail}</p>
                      <div className="product-bottom">
                        <strong>{money(product.priceCents)}</strong>
                        <div className="quantity">
                          <button
                            aria-label={`Remove ${product.name}`}
                            disabled={!cart[product.id]}
                            onClick={() =>
                              setCart({
                                ...cart,
                                [product.id]: Math.max(
                                  0,
                                  (cart[product.id] || 0) - 1,
                                ),
                              })
                            }
                          >
                            −
                          </button>
                          <span aria-live="polite">
                            {cart[product.id] || 0}
                          </span>
                          <button
                            aria-label={`Add ${product.name}`}
                            disabled={(cart[product.id] || 0) >= 10}
                            onClick={() =>
                              setCart({
                                ...cart,
                                [product.id]: (cart[product.id] || 0) + 1,
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="checkout-bar">
                  <div>
                    <strong>
                      {cartCount} {cartCount === 1 ? "item" : "items"} ·{" "}
                      {money(total)}
                    </strong>
                  </div>
                  <button
                    className="primary"
                    disabled={!cartCount || busy}
                    onClick={() => void review("purchase")}
                  >
                    {busy ? "Preparing…" : "Review purchase →"}
                  </button>
                </div>
              </>
            )}
            {tab === "dispense" && (
              <>
                <section className="dispense-card">
                  <div className="dispense-options">
                    <label htmlFor="start-date">Start date</label>
                    <input
                      id="start-date"
                      type="date"
                      min={data?.today}
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                    />
                    <label>How many days?</label>
                    <div className="day-options">
                      {[1, 3, 7, 14, 30].map((value) => (
                        <button
                          key={value}
                          className={days === value ? "active" : ""}
                          aria-pressed={days === value}
                          onClick={() => setDays(value)}
                        >
                          {value}
                          <small>{value === 1 ? "day" : "days"}</small>
                        </button>
                      ))}
                    </div>
                    <label htmlFor="custom-days">
                      Or choose a duration (1–30 days)
                    </label>
                    <input
                      id="custom-days"
                      type="number"
                      min="1"
                      max="30"
                      value={days}
                      onChange={(event) => setDays(Number(event.target.value))}
                    />
                    <p className="option-note">
                      Only available over-the-counter doses are included.
                    </p>
                    <div className="pickup-summary" aria-live="polite">
                      {pickupGroups.length ? <>
                        <p className="pickup-count">{readyCount} {readyCount === 1 ? "dose available" : "doses available"} for pickup</p>
                        {pickupGroups.map(([key, item]) => <div className="pickup-line" key={key}>
                          <strong>{item.name}</strong>
                          <span>{item.dosage} · {item.count} {item.count === 1 ? "dose" : "doses"}</span>
                          <span className={`eligibility ${item.dispensing.eligible ? "otc" : "referral"}`}>
                            {item.dispensing.eligible ? "Available for pickup" : item.dispensing.message}
                          </span>
                          {item.dispensing.classification?.sourceUrl && <a className="classification-source" href={item.dispensing.classification.sourceUrl} target="_blank" rel="noreferrer">Health Canada classification ↗</a>}
                        </div>)}
                      </> : <p>No untaken scheduled doses in this date range. Choose the dates shown in your app. As-needed medicines are not included in scheduled pickup.</p>}
                    </div>
                    <button
                      className="primary wide"
                      disabled={
                        busy ||
                        !startDate ||
                        !Number.isInteger(days) ||
                        days < 1 ||
                        days > 30 ||
                        readyCount === 0
                      }
                      onClick={() => void review("schedule")}
                    >
                      {busy ? "Preparing…" : "Review pickup"}
                    </button>
                  </div>
                </section>
              </>
            )}
          </main>
          <nav className="kiosk-tabs" aria-label="Vending navigation">
            {(
              [
                ["schedule", "schedule", "Schedule"],
                ["shop", "shop", "Shop"],
                ["dispense", "pickup", "Pickup"],
              ] as const
            ).map(([id, icon, label]) => (
              <button
                key={id}
                className={tab === id ? "selected" : ""}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => {
                  setTab(id);
                  setError("");
                }}
              >
                <span>
                  <Icon name={icon} />
                  {id === "shop" && cartCount > 0 && <b>{cartCount}</b>}
                </span>
                {label}
              </button>
            ))}
            <button
              className="end-session"
              disabled={!!working || busy}
              onClick={logout}
            >
              <span>
                <Icon name="exit" />
              </span>
              End session
            </button>
          </nav>
        </div>
      )}
      {keypad && !session && (
        <div className="modal-backdrop">
          <section
            className="dialog keypad-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Enter vending code"
          >
            <button
              className="close"
              disabled={busy}
              aria-label="Close keypad"
              onClick={() => setKeypad(false)}
            >
              ×
            </button>
            <input
              className="code-input touch-code"
              aria-label="Five-character vending code"
              value={code}
              maxLength={5}
              inputMode="none"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="A1B2C"
              disabled={busy}
              onChange={(event) => {
                setCode(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                );
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && code.length === 5)
                  void login(code);
              }}
            />
            <div className="touch-keypad" aria-label="Code keypad">
              {"1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((key) => (
                <button
                  key={key}
                  aria-label={`Code character ${key}`}
                  disabled={busy || code.length === 5}
                  onClick={() => {
                    setCode((value) =>
                      value.length < 5 ? value + key : value,
                    );
                    setError("");
                  }}
                >
                  {key}
                </button>
              ))}
              <button
                className="keypad-edit"
                disabled={busy || !code}
                onClick={() => {
                  setCode("");
                  setError("");
                }}
              >
                Clear
              </button>
              <button
                className="keypad-edit"
                aria-label="Delete last character"
                disabled={busy || !code}
                onClick={() => {
                  setCode((value) => value.slice(0, -1));
                  setError("");
                }}
              >
                ⌫
              </button>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <div className="keypad-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => {
                  setKeypad(false);
                  setCamera(true);
                }}
              >
                Scan QR instead
              </button>
              <button
                className="primary"
                disabled={busy || code.length !== 5}
                onClick={() => void login(code)}
              >
                {busy ? "Opening…" : "Continue →"}
              </button>
            </div>
          </section>
        </div>
      )}
      {camera && <Camera onCode={login} onClose={() => setCamera(false)} />}
      {order && (
        <div className="modal-backdrop">
          <section
            className="dialog order-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-title"
          >
            {!working && !busy && (
              <button
                className="close"
                aria-label="Close order"
                onClick={() => {
                  setOrder(null);
                  setError("");
                }}
              >
                ×
              </button>
            )}
            <div className="order-scroll">
              <h2 id="order-title">
                {order.status === "review"
                  ? "Review order"
                  : order.status === "completed"
                    ? "Collect your items"
                    : order.status === "failed"
                      ? "Unable to dispense"
                      : "Dispensing…"}
              </h2>
              <p>
                {order.plan.kind === "schedule"
                  ? `${niceDate(order.plan.startDate!)} – ${niceDate(order.plan.endDate!)} · ${order.plan.days} ${order.plan.days === 1 ? "day" : "days"}`
                  : "Over-the-counter purchase"}
              </p>
              <div className="order-items">
                {order.plan.items.map((item, index) => (
                  <div key={item.id} className="order-item">
                    <span
                      className={`item-check ${order.progress > index ? "done" : ""}`}
                    >
                      {order.progress > index ? "✓" : index + 1}
                    </span>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.description}</span>
                    </div>
                    <b>×{item.doses}</b>
                  </div>
                ))}
              </div>
              {order.plan.referrals?.length > 0 && (
                <div className="excluded-items">
                  <p>Not available for pickup. Please see a pharmacist:</p>
                  {order.plan.referrals.map((item) => (
                    <p key={item.id}>
                      <strong>{item.name}</strong> · {item.description} ×
                      {item.doses}
                    </p>
                  ))}
                  {data && (
                    <p className="referral-location">
                      {data.pharmacistReferral.name} ·{" "}
                      {data.pharmacistReferral.area}
                    </p>
                  )}
                </div>
              )}
              <div className="order-total">
                <span>
                  {order.plan.totalDoses}{" "}
                  {order.plan.kind === "purchase"
                    ? order.plan.totalDoses === 1
                      ? "pack"
                      : "packs"
                    : order.plan.totalDoses === 1
                      ? "scheduled dose"
                      : "scheduled doses"}
                </span>
                <strong>
                  {order.plan.kind === "purchase"
                    ? money(order.plan.totalCents)
                    : "Schedule pickup"}
                </strong>
              </div>
              {working && (
                <>
                  <progress
                    max={order.plan.items.length}
                    value={order.progress}
                  />
                  <p role="status">
                    {order.status === "queued"
                      ? "Connecting to the dispenser…"
                      : `${order.progress} of ${order.plan.items.length} items prepared`}
                  </p>
                </>
              )}
              {order.status === "completed" && (
                <p role="status" className="success">
                  ✓ Your items are ready. Please collect them below.
                </p>
              )}
              {(error || order.error) && (
                <p role="alert" className="error">
                  {/arduino|lcd|serial|usb|i²c/i.test(
                    error || order.error || "",
                  )
                    ? "This machine is unavailable. Please try again shortly."
                    : error || order.error}
                </p>
              )}
            </div>
            <div className="order-actions">
              {order.status === "review" && (
                <button
                  className="primary wide"
                  disabled={busy}
                  onClick={() => void confirm()}
                >
                  {busy ? "Confirming…" : "Confirm & dispense →"}
                </button>
              )}
              {order.status === "completed" && (
                <button className="primary wide" onClick={logout}>
                  Finish & end session
                </button>
              )}
              {order.status === "failed" && (
                <button
                  className="secondary wide"
                  onClick={() => {
                    setOrder(null);
                    setError("");
                  }}
                >
                  Back to review
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
