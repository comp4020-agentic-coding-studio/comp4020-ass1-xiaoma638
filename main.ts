const EARTH_RADIUS_KM = 6371;
const ASTRONOMICAL_UNIT_KM = 149_597_870.7;
const ORBITAL_ECCENTRICITY = 0.0167;
const DAYS_IN_YEAR = 365.2422;

export type SolarInput = {
  date: string;
  latitude: number;
  morningHour: number;
};

export type SolarComparison = {
  morningDistanceKm: number;
  noonDistanceKm: number;
  rotationContributionKm: number;
  orbitContributionKm: number;
  totalContributionKm: number;
  verdict: "morning" | "noon" | "tie";
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function dayOfYear(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  return Math.round((current - start) / 86_400_000);
}

/** The rotation instrument holds date and latitude fixed so only the hour varies. */
const ROTATION_DAY = 79;
const ROTATION_LATITUDE = 35;

/**
 * Screen angle of the direction pointing at the sun. Zero puts the sun due
 * right, which squares the whole frame up: the equator draws horizontal, the
 * terminator vertical, and Δx horizontal. Everything solar is derived from this
 * one angle — the rays, the terminator perpendicular to them, the lit
 * hemisphere, and the axis Δx is measured along — so they cannot drift out of
 * agreement. Keep in sync with --sun-tilt in styles.css.
 */
const SUN_TILT_DEG = 0;

/** Globe radius as a percentage of .rotation-earth's width — its drawn limb. */
const EARTH_RADIUS_PCT = 50;

/**
 * Width of .earth-texture as a multiple of the globe, and how far it slides
 * across the whole 06:00→12:00 spin (in globe-width %). The texture is a photo
 * of one hemisphere, so it can only ever be slid, not re-projected; oversizing
 * it keeps the photo's own dark limb outside the globe for the whole slide.
 * Both mirror values in styles.css — raising the drift needs the scale raised
 * with it, or the photo's edge creeps into view near noon.
 */
const EARTH_TEXTURE_SCALE = 1.58;
const EARTH_DRIFT_PCT = 40;

function solarDeclinationRadians(day: number): number {
  return degreesToRadians(23.44) * Math.sin((2 * Math.PI * (day - 80)) / DAYS_IN_YEAR);
}

function solarAltitudeDegrees(day: number, latitude: number, hour: number): number {
  const latitudeRadians = degreesToRadians(latitude);
  const declination = solarDeclinationRadians(day);
  const hourAngle = degreesToRadians((hour - 12) * 15);
  const sinAltitude =
    Math.sin(latitudeRadians) * Math.sin(declination) +
    Math.cos(latitudeRadians) * Math.cos(declination) * Math.cos(hourAngle);
  return Math.asin(clamp(sinAltitude, -1, 1)) * (180 / Math.PI);
}

function observerTowardSunKm(day: number, latitude: number, hour: number): number {
  const altitude = solarAltitudeDegrees(day, latitude, hour);
  return EARTH_RADIUS_KM * Math.max(0, Math.sin(degreesToRadians(altitude)));
}

export function earthSunDistanceKm(day: number, hour = 12): number {
  const orbitPosition = (2 * Math.PI * (day - 3 + (hour - 12) / 24)) / DAYS_IN_YEAR;
  return ASTRONOMICAL_UNIT_KM * (1 - ORBITAL_ECCENTRICITY * Math.cos(orbitPosition));
}

export function calculateComparison(input: SolarInput): SolarComparison {
  const day = dayOfYear(input.date);
  const morningOrbitDistance = earthSunDistanceKm(day, input.morningHour);
  const noonOrbitDistance = earthSunDistanceKm(day, 12);
  const morningProjection = observerTowardSunKm(day, input.latitude, input.morningHour);
  const noonProjection = observerTowardSunKm(day, input.latitude, 12);
  const morningDistanceKm = morningOrbitDistance - morningProjection;
  const noonDistanceKm = noonOrbitDistance - noonProjection;
  const rotationContributionKm = noonProjection - morningProjection;
  const orbitContributionKm = morningOrbitDistance - noonOrbitDistance;
  const totalContributionKm = morningDistanceKm - noonDistanceKm;
  const verdict = totalContributionKm > 25 ? "noon" : totalContributionKm < -25 ? "morning" : "tie";

  return {
    morningDistanceKm,
    noonDistanceKm,
    rotationContributionKm,
    orbitContributionKm,
    totalContributionKm,
    verdict,
  };
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(value);
}

function formatSignedKm(value: number): string {
  const direction = value >= 0 ? "Noon" : "Morning";
  return `${direction} by ${formatNumber(Math.abs(value))} km`;
}

function formatHour(hour: number): string {
  const wholeHours = Math.floor(hour);
  const minutes = Math.round((hour - wholeHours) * 60);
  return `${String(wholeHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing required element: ${selector}`);
  return element;
}

function setText(selector: string, value: string): void {
  getElement<HTMLElement>(selector).textContent = value;
}

/**
 * The observer's projection toward the sun, as a fraction of Earth's radius.
 * With the declination near zero this is cos(φ)·cos(H), so it runs from 0 at
 * dawn to cos(φ) at noon — the same quantity the panel reports in kilometres,
 * which is what keeps the drawn Δx in step with the number beside it.
 */
function sunwardFraction(hour: number): number {
  const altitude = solarAltitudeDegrees(ROTATION_DAY, ROTATION_LATITUDE, hour);
  return Math.sin(degreesToRadians(Math.max(0, altitude)));
}

/**
 * How far Earth has turned since 06:00, in degrees of longitude — 15° an hour,
 * so 90° by local solar noon. Every part of the spin is driven from this one
 * angle: the texture's drift, the meridian grid, and the observer's own
 * meridian, which is why they can't slide out of step with each other.
 */
function spinDegrees(hour: number): number {
  return (hour - 6) * 15;
}

/**
 * Sweep the observer's meridian. A meridian λ degrees round from the one facing
 * us projects, under this view, onto an ellipse a full radius tall and R·|sin λ|
 * wide — so it swells from an edge-on line at dawn to the full limb at noon. We
 * draw only the near half, pole to pole, because the far half is behind the
 * globe. It passes through the observer by construction: at latitude φ the
 * half-width is cos(φ)·sin(spin), which is precisely sin(altitude).
 */
function updateMeridians(spin: number): void {
  const halfWidth = Math.max(0.01, 100 * Math.sin(degreesToRadians(spin)));
  getElement<SVGPathElement>("#observer-meridian").setAttribute(
    "d",
    `M 0 -100 A ${halfWidth.toFixed(2)} 100 0 0 1 0 100`,
  );
}

function updateRotationVisual(hour: number): void {
  const day = ROTATION_DAY;
  const latitude = ROTATION_LATITUDE;
  const altitude = solarAltitudeDegrees(day, latitude, hour);
  const projection = observerTowardSunKm(day, latitude, hour);
  const noonProjection = observerTowardSunKm(day, latitude, 12);
  const spin = spinDegrees(hour);
  const observer = getElement<HTMLElement>("#observer-dot");
  const earthSpin = getElement<HTMLElement>("#earth-spin");
  const radiusLine = getElement<HTMLElement>("#rotation-radius");
  const distanceLine = getElement<HTMLElement>("#rotation-distance-line");
  const radiusLabel = getElement<HTMLElement>("#rotation-radius-label");
  const distanceLabel = getElement<HTMLElement>("#rotation-distance-label");
  const sunTilt = degreesToRadians(SUN_TILT_DEG);
  /*
   * We look at the globe from a direction lying in the equatorial plane, which
   * is why the equator draws as a straight line and the terminator as another.
   * Under that view a circle of latitude collapses to a straight track parallel
   * to the equator, offset R·sin(φ) along the polar axis. So spinning Earth
   * slides the observer along that fixed track — it never carries them toward
   * a pole, which is exactly what an in-plane rotation of the whole disc did.
   */
  const axisOffset = EARTH_RADIUS_PCT * Math.sin(degreesToRadians(latitude));
  const footX = 50 + (axisOffset * Math.sin(sunTilt));
  const footY = 50 - (axisOffset * Math.cos(sunTilt));
  // Δx runs parallel to the rays, from the terminator plane out to the observer.
  const distanceLength = EARTH_RADIUS_PCT * sunwardFraction(hour);
  const x = footX + (distanceLength * Math.cos(sunTilt));
  const y = footY + (distanceLength * Math.sin(sunTilt));
  const radiusLength = Math.hypot(x - 50, y - 50);
  const radiusAngle = (Math.atan2(y - 50, x - 50) * 180) / Math.PI;
  // Slide the photo along the equator to match. sin(spin) is how far a feature
  // that faced us at 06:00 has travelled toward the limb; the −0.5 just centres
  // the excursion so neither end of the drag runs out of photo.
  const drift = ((Math.sin(degreesToRadians(spin)) - 0.5) * EARTH_DRIFT_PCT) / EARTH_TEXTURE_SCALE;

  earthSpin.style.setProperty("--drift-x", `${drift * Math.cos(sunTilt)}%`);
  earthSpin.style.setProperty("--drift-y", `${drift * Math.sin(sunTilt)}%`);
  updateMeridians(spin);
  observer.style.left = `${x}%`;
  observer.style.top = `${y}%`;
  // The observer stands on the surface, so their "up" points radially outward.
  observer.style.setProperty("--observer-tilt", `${radiusAngle + 90}deg`);
  radiusLine.style.width = `${radiusLength}%`;
  radiusLine.style.transform = `rotate(${radiusAngle}deg)`;
  distanceLine.style.left = `${footX}%`;
  distanceLine.style.top = `${footY}%`;
  distanceLine.style.width = `${distanceLength}%`;
  distanceLine.style.transform = `rotate(${SUN_TILT_DEG}deg)`;
  /*
   * Both labels sit beside their line rather than on it, offset along the
   * line's normal. Halving the along-line fraction matters near dawn, when R is
   * short and Δx is nothing at all: a label pinned to the far end of a stub
   * lands on top of the observer, which is what it used to do on the phone.
   * The gaps are quoted in pixels because the labels and the observer figure
   * are a fixed size — a flat percentage is generous on the desktop globe and
   * too tight on the phone's, which is the other half of the same collision.
   */
  const earthWidth = getElement<HTMLElement>(".rotation-earth").getBoundingClientRect().width;
  const labelGap = (pixels: number): number => (pixels / (earthWidth || 420)) * 100;
  const radiusNormal = degreesToRadians(radiusAngle + 90);
  radiusLabel.style.left = `${50 + ((x - 50) * 0.36) + (labelGap(32) * Math.cos(radiusNormal))}%`;
  radiusLabel.style.top = `${50 + ((y - 50) * 0.36) + (labelGap(32) * Math.sin(radiusNormal))}%`;
  // Δx's normal is the polar axis, so its label rides north of the segment.
  distanceLabel.style.left = `${((footX + x) / 2) + (labelGap(72) * Math.sin(sunTilt))}%`;
  distanceLabel.style.top = `${((footY + y) / 2) - (labelGap(72) * Math.cos(sunTilt))}%`;
  setText("#rotation-hour-output", formatHour(hour));
  setText("#rotation-altitude", `${formatNumber(Math.max(0, altitude), 1)}°`);
  setText("#rotation-projection", `${formatNumber(projection)} km`);
  setText("#rotation-difference", `${formatNumber(noonProjection - projection)} km less`);
}

function orbitDateForDay(day: number): Date {
  return new Date(Date.UTC(2026, 0, Math.round(clamp(day, 1, 365))));
}

function updateOrbitVisual(day: number): void {
  const selectedDay = clamp(day, 1, 365);
  const theta = (2 * Math.PI * (selectedDay - 3)) / DAYS_IN_YEAR;
  const orbitVisual = getElement<HTMLElement>(".orbit-visual");
  const visualBounds = orbitVisual.getBoundingClientRect();
  const orbitRadiusX = Math.min(visualBounds.width * 0.39, 250);
  const orbitRadiusY = Math.min(visualBounds.height * 0.28, 135);
  const x = 50 + Math.cos(theta) * ((orbitRadiusX / visualBounds.width) * 100);
  const y = 50 + Math.sin(theta) * ((orbitRadiusY / visualBounds.height) * 100);
  const distance = earthSunDistanceKm(selectedDay);
  const tomorrow = earthSunDistanceKm(selectedDay + 1);
  const trend = tomorrow > distance ? "Moving away from the sun" : "Moving toward the sun";
  const selectedDate = orbitDateForDay(selectedDay);
  const dateString = selectedDate.toISOString().slice(0, 10);
  const displayDate = new Intl.DateTimeFormat("en-GB", { month: "long", day: "numeric" }).format(
    selectedDate,
  );
  const earth = getElement<HTMLButtonElement>("#orbit-earth");
  const dateLabel = getElement<HTMLElement>("#orbit-date-label");

  /*
   * Which way the sun lies from here, as a screen angle, so the globe's day side
   * faces it all the way round the orbit. It has to be worked out in pixels
   * rather than from the percentages above: those are percentages of the box's
   * width and of its height, which are different lengths, so an angle taken from
   * them would be sheared. The sun sits at the focus, offset from the ellipse's
   * centre — the same 4% --orbit-focus-offset the stylesheet places it at.
   */
  const sunwardDegrees =
    (Math.atan2(
      -Math.sin(theta) * orbitRadiusY,
      visualBounds.width * 0.04 - (Math.cos(theta) * orbitRadiusX),
    ) *
      180) /
    Math.PI;

  earth.style.left = `${x}%`;
  earth.style.top = `${y}%`;
  earth.style.setProperty("--sun-dir", `${sunwardDegrees.toFixed(1)}deg`);
  dateLabel.style.left = `${x}%`;
  dateLabel.style.top = `${y}%`;
  /*
   * Park the date beside the globe on whichever side has room. Pinned to the
   * right it runs off the panel near perihelion on a phone, where the orbit
   * comes close to the edge. Percentages inside a translate resolve against the
   * label's own width, so this swings it fully clear without measuring it, and
   * the gap itself stays in the stylesheet where each breakpoint sets it.
   */
  dateLabel.style.setProperty(
    "--label-dx",
    x > 50 ? "calc(-100% - var(--label-gap))" : "var(--label-gap)",
  );
  earth.setAttribute("aria-label", `Drag Earth along its orbit — current date ${displayDate}`);
  setText("#orbit-date-output", dateString);
  setText("#orbit-date-label", displayDate);
  setText("#orbit-distance", `${formatNumber(distance / 1_000_000, 3)} million km`);
  setText("#orbit-average", `${distance >= ASTRONOMICAL_UNIT_KM ? "+" : "-"}${formatNumber(Math.abs(distance - ASTRONOMICAL_UNIT_KM))} km`);
  setText("#orbit-trend", trend);
}

function updateVerdict(): void {
  const date = getElement<HTMLInputElement>("#comparison-date").value;
  const latitude = Number(getElement<HTMLInputElement>("#latitude").value);
  const morningHour = Number(getElement<HTMLInputElement>("#morning-hour").value);
  const comparison = calculateComparison({ date, latitude, morningHour });
  const verdictMain = getElement<HTMLElement>("#verdict-main");
  const verdictDetail = getElement<HTMLElement>("#verdict-detail");

  setText("#latitude-output", `${latitude}°N`);
  setText("#morning-hour-output", formatHour(morningHour));
  setText("#rotation-contribution", formatSignedKm(comparison.rotationContributionKm));
  setText("#orbit-contribution", formatSignedKm(comparison.orbitContributionKm));
  setText("#total-contribution", formatSignedKm(comparison.totalContributionKm));

  if (comparison.verdict === "tie") {
    verdictMain.textContent = "They're almost equally close";
    verdictDetail.textContent = "In this teaching model, the two effects almost exactly cancel out.";
    return;
  }

  const closer = comparison.verdict === "noon" ? "Noon" : "Morning";
  verdictMain.textContent = `${closer} is closer to the sun`;
  verdictDetail.textContent = `Estimated difference: ${formatNumber(Math.abs(comparison.totalContributionKm))} km — rotation and orbit are having a little tug-of-war.`;
}

function initPage(): void {
  const rotationInput = getElement<HTMLInputElement>("#rotation-hour");
  const observer = getElement<HTMLButtonElement>("#observer-dot");
  const rotationEarth = getElement<HTMLElement>(".rotation-earth");
  const orbitEarth = getElement<HTMLButtonElement>("#orbit-earth");
  const orbitVisual = getElement<HTMLElement>(".orbit-visual");
  const comparisonDateInput = getElement<HTMLInputElement>("#comparison-date");
  const latitudeInput = getElement<HTMLInputElement>("#latitude");
  const morningInput = getElement<HTMLInputElement>("#morning-hour");
  const illusion = getElement<HTMLElement>("#ebbinghaus-illusion");
  const illusionButton = getElement<HTMLButtonElement>("#illusion-reveal");

  const updateRotationHour = (hour: number): void => {
    const snappedHour = Math.round(clamp(hour, 6, 12) * 4) / 4;
    rotationInput.value = String(snappedHour);
    updateRotationVisual(snappedHour);
  };
  const refreshRotation = (): void => updateRotationHour(Number(rotationInput.value));
  let selectedOrbitDay = dayOfYear("2026-03-20");
  const updateOrbitDay = (day: number): void => {
    selectedOrbitDay = clamp(day, 1, 365);
    updateOrbitVisual(selectedOrbitDay);
  };
  const refreshOrbit = (): void => updateOrbitDay(selectedOrbitDay);
  const refreshVerdict = (): void => updateVerdict();

  /**
   * Read the drag the way the globe turns: project the pointer onto the ray
   * direction to get how far past the terminator it lies, in radii, then invert
   * sunwardFraction numerically over the 6–12 range. Cheap, and clamping the
   * projection means a pointer that wanders onto the night side or off the limb
   * simply parks the globe at dawn or noon instead of jumping.
   */
  const hourFromPointer = (event: PointerEvent): number => {
    const bounds = rotationEarth.getBoundingClientRect();
    const x = event.clientX - (bounds.left + (bounds.width / 2));
    const y = event.clientY - (bounds.top + (bounds.height / 2));
    const sunTilt = degreesToRadians(SUN_TILT_DEG);
    const target = clamp(
      ((x * Math.cos(sunTilt)) + (y * Math.sin(sunTilt))) / (bounds.width / 2),
      0,
      1,
    );
    let bestHour = 6;
    let smallestGap = Infinity;
    for (let hour = 6; hour <= 12.001; hour += 0.05) {
      const gap = Math.abs(sunwardFraction(hour) - target);
      if (gap < smallestGap) {
        smallestGap = gap;
        bestHour = hour;
      }
    }
    return bestHour;
  };

  let activePointerId: number | null = null;
  rotationEarth.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activePointerId = event.pointerId;
    rotationEarth.setPointerCapture(event.pointerId);
    rotationEarth.dataset.dragging = "true";
    updateRotationHour(hourFromPointer(event));
  });
  rotationEarth.addEventListener("pointermove", (event) => {
    if (activePointerId === event.pointerId) updateRotationHour(hourFromPointer(event));
  });
  const finishObserverDrag = (event: PointerEvent): void => {
    if (activePointerId !== event.pointerId) return;
    if (rotationEarth.hasPointerCapture(event.pointerId)) rotationEarth.releasePointerCapture(event.pointerId);
    activePointerId = null;
    delete rotationEarth.dataset.dragging;
  };
  rotationEarth.addEventListener("pointerup", finishObserverDrag);
  rotationEarth.addEventListener("pointercancel", finishObserverDrag);
  observer.addEventListener("keydown", (event) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 0.25 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -0.25 : 0;
    if (step === 0) return;
    event.preventDefault();
    updateRotationHour(Number(rotationInput.value) + step);
  });

  const orbitDayFromPointer = (event: PointerEvent): number => {
    const bounds = orbitVisual.getBoundingClientRect();
    const orbitRadiusX = Math.min(bounds.width * 0.39, 250);
    const orbitRadiusY = Math.min(bounds.height * 0.28, 135);
    const angle = Math.atan2((event.clientY - (bounds.top + (bounds.height / 2))) / orbitRadiusY, (event.clientX - (bounds.left + (bounds.width / 2))) / orbitRadiusX);
    const normalizedAngle = angle < 0 ? angle + (2 * Math.PI) : angle;
    return 3 + ((normalizedAngle / (2 * Math.PI)) * DAYS_IN_YEAR);
  };
  let activeOrbitPointerId: number | null = null;
  orbitEarth.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    activeOrbitPointerId = event.pointerId;
    orbitEarth.setPointerCapture(event.pointerId);
    orbitEarth.dataset.dragging = "true";
    updateOrbitDay(orbitDayFromPointer(event));
  });
  orbitEarth.addEventListener("pointermove", (event) => {
    if (activeOrbitPointerId === event.pointerId) updateOrbitDay(orbitDayFromPointer(event));
  });
  const finishOrbitDrag = (event: PointerEvent): void => {
    if (activeOrbitPointerId !== event.pointerId) return;
    if (orbitEarth.hasPointerCapture(event.pointerId)) orbitEarth.releasePointerCapture(event.pointerId);
    activeOrbitPointerId = null;
    delete orbitEarth.dataset.dragging;
  };
  orbitEarth.addEventListener("pointerup", finishOrbitDrag);
  orbitEarth.addEventListener("pointercancel", finishOrbitDrag);
  orbitEarth.addEventListener("keydown", (event) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    updateOrbitDay(selectedOrbitDay + step);
  });

  rotationInput.addEventListener("input", refreshRotation);
  window.addEventListener("resize", refreshOrbit);
  comparisonDateInput.addEventListener("input", refreshVerdict);
  latitudeInput.addEventListener("input", refreshVerdict);
  morningInput.addEventListener("input", refreshVerdict);
  illusionButton.addEventListener("click", () => {
    const isShown = illusion.classList.toggle("show-measure");
    illusionButton.setAttribute("aria-pressed", String(isShown));
    illusionButton.textContent = isShown ? "Hide the guide lines" : "Show that both centres are equal";
  });

  refreshRotation();
  refreshOrbit();
  refreshVerdict();
}

if (typeof document !== "undefined") {
  initPage();
}
