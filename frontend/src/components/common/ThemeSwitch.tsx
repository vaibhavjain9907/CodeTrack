/**
 * ThemeSwitch.
 *
 * A production port of the Uiverse "animated theme toggle" by
 * rishichawda (sliding sun/moon, drifting cloud, twinkling stars).
 *
 * This is a *controlled, presentational* component: it owns no theme
 * state of its own. `checked` is the current theme (true = dark),
 * `onChange` is called on toggle — both are expected to come from the
 * app's existing theme logic (the `useTheme` hook already living in
 * Topbar, which handles `html.dark`, localStorage, and the initial
 * system-preference check). Wire it up like:
 *
 *   const { isDark, toggle } = useTheme();
 *   <ThemeSwitch checked={isDark} onChange={toggle} />
 *
 * The sun/moon crossfade, cloud fade, star fade, and knob slide are
 * all still driven by the original CSS transitions (see
 * ThemeSwitch.css) via the `:checked` pseudo-class — Framer Motion is
 * only used for the mount-in and hover/tap micro-interactions, as
 * requested, not to reimplement the internal animation.
 */

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { clsx } from "clsx";

import "./ThemeSwitch.css";

interface ThemeSwitchProps {
  /** Current theme — true when dark mode is active. */
  checked: boolean;
  /** Called on toggle; flip the theme in the caller. */
  onChange: () => void;
  className?: string;
}

const STAR_PATHS = [
  "M.774,0,.566.559,0,.539.458.933.25,1.492l.485-.361.458.394L1.024.953,1.509.592.943.572Z",
  "M1.341.529.836.472.736,0,.505.46,0,.4.4.729l-.231.46L.605.932l.4.326L.9.786Z",
  "M.015,1.065.475.9l.285.365L.766.772l.46-.164L.745.494.751,0,.481.407,0,.293.285.658Z",
  "M1.161,1.6,1.059,1,1.574.722.962.607.86,0,.613.572,0,.457.446.881.2,1.454l.516-.274Z",
  "M.873,1.648l.114-.62L1.579.945,1.03.62,1.144,0,.706.464.157.139.438.7,0,1.167l.592-.083Z",
  "M.593,0,.638.724,0,.982l.7.211.045.724.36-.64.7.211L1.342.935,1.7.294,1.063.552Z",
  "M.816,0,.5.455,0,.311.323.767l-.312.455.516-.215.323.456L.827.911,1.343.7.839.552Z",
  "M1.261,0,.774.571.114.3.487.967,0,1.538.728,1.32l.372.662.047-.749.728-.218L1.215.749Z",
];

const STAR_TRANSFORMS = [
  "matrix(-1, 0.017, -0.017, -1, 24.231, 3.055)",
  "matrix(-0.777, 0.629, -0.629, -0.777, 23.185, 12.358)",
  "matrix(0.438, 0.899, -0.899, 0.438, 23.177, 29.735)",
  "translate(12.677 0.388) rotate(104)",
  "matrix(-0.07, 0.998, -0.998, -0.07, 11.066, 15.457)",
  "translate(8.326 28.061) rotate(11)",
  "translate(5.012 5.962) rotate(172)",
  "translate(2.218 14.616) rotate(169)",
];

export function ThemeSwitch({ checked, onChange, className }: ThemeSwitchProps) {
  const prefersReducedMotion = useReducedMotion();
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");

  return (
    <motion.label
      className={clsx("theme-switch", className)}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? "Switch to light theme" : "Switch to dark theme"}
        checked={checked}
        onChange={onChange}
        className="theme-switch__input"
      />

      <svg
        className="theme-switch__svg"
        width={50}
        height={32}
        viewBox="0 0 69.667 44"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <filter id={`${uid}-sun-outer`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={`${uid}-sun`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
          <filter id={`${uid}-moon`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
          <filter id={`${uid}-cloud`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="0.5" />
          </filter>
          <filter id={`${uid}-star`} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="0.45" />
          </filter>
          <filter id={`${uid}-container`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodOpacity="0.25" />
          </filter>
        </defs>

        <g transform="translate(3.5 3.5)">
          {/* Track */}
          <g filter={`url(#${uid}-container)`} transform="matrix(1, 0, 0, 1, -3.5, -3.5)">
            <rect
              className="theme-switch__container"
              transform="translate(3.5 3.5)"
              rx="17.5"
              height="35"
              width="60.667"
            />
          </g>

          {/* Sliding knob group — sun and moon live here so one `transform`
              on this group moves both together. */}
          <g transform="translate(2.333 2.333)" className="theme-switch__button">
            <g className="theme-switch__sun">
              <g filter={`url(#${uid}-sun-outer)`} transform="matrix(1, 0, 0, 1, -5.83, -5.83)">
                <circle
                  fill="#f2b93d"
                  transform="translate(5.83 5.83)"
                  r="15.167"
                  cy="15.167"
                  cx="15.167"
                />
              </g>
              <g filter={`url(#${uid}-sun)`} transform="matrix(1, 0, 0, 1, -5.83, -5.83)">
                <path
                  fill="rgba(255,255,255,0.28)"
                  transform="translate(9.33 9.33)"
                  d="M11.667,0A11.667,11.667,0,1,1,0,11.667,11.667,11.667,0,0,1,11.667,0Z"
                />
              </g>
              <circle fill="#fde9b0" transform="translate(8.167 8.167)" r="7" cy="7" cx="7" />
            </g>

            <g className="theme-switch__moon">
              <g filter={`url(#${uid}-moon)`} transform="matrix(1, 0, 0, 1, -31.5, -5.83)">
                <circle
                  fill="#9aa4af"
                  transform="translate(31.5 5.83)"
                  r="15.167"
                  cy="15.167"
                  cx="15.167"
                />
              </g>
              <g className="theme-switch__patches" fill="#7d8590" transform="translate(-24.415 -1.009)">
                <circle transform="translate(43.009 4.496)" r="2" cy="2" cx="2" />
                <circle transform="translate(39.366 17.952)" r="2" cy="2" cx="2" />
                <circle transform="translate(33.016 8.044)" r="1" cy="1" cx="1" />
                <circle transform="translate(51.081 18.888)" r="1" cy="1" cx="1" />
                <circle transform="translate(33.016 22.503)" r="1" cy="1" cx="1" />
                <circle transform="translate(50.081 10.53)" r="1.5" cy="1.5" cx="1.5" />
              </g>
            </g>
          </g>

          {/* Cloud — light mode only */}
          <g filter={`url(#${uid}-cloud)`} transform="matrix(1, 0, 0, 1, -3.5, -3.5)">
            <path
              className="theme-switch__cloud"
              fill="#eef1f4"
              transform="translate(-3466.47 -160.94)"
              d="M3512.81,173.815a4.463,4.463,0,0,1,2.243.62.95.95,0,0,1,.72-1.281,4.852,4.852,0,0,1,2.623.519c.034.02-.5-1.968.281-2.716a2.117,2.117,0,0,1,2.829-.274,1.821,1.821,0,0,1,.854,1.858c.063.037,2.594-.049,3.285,1.273s-.865,2.544-.807,2.626a12.192,12.192,0,0,1,2.278.892c.553.448,1.106,1.992-1.62,2.927a7.742,7.742,0,0,1-3.762-.3c-1.28-.49-1.181-2.65-1.137-2.624s-1.417,2.2-2.623,2.2a4.172,4.172,0,0,1-2.394-1.206,3.825,3.825,0,0,1-2.771.774c-3.429-.46-2.333-3.267-2.2-3.55A3.721,3.721,0,0,1,3512.81,173.815Z"
            />
          </g>

          {/* Stars — dark mode only */}
          <g className="theme-switch__stars" fill="#dce8f5" transform="translate(3.585 1.325)">
            {STAR_PATHS.map((d, i) => (
              <path
                key={i}
                className="theme-switch__star"
                filter={`url(#${uid}-star)`}
                transform={STAR_TRANSFORMS[i]}
                d={d}
              />
            ))}
          </g>
        </g>
      </svg>
    </motion.label>
  );
}
