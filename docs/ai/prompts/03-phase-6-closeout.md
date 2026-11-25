# Closing out Phase 6

> **Adapted from the original conversation.** Content unchanged; the text was already in English and is lightly tightened.

Before Phase 7, close out Phase 6 with these items. Same rules: one commit per addition, every commit green, no exclusions or disabled rules.

1. **CI on GitHub.** Push the branch and get the full workflow, including the E2E job, green on GitHub (Linux), not only locally. The E2E job installs Chromium with `--with-deps` and waits for both the server and the web app to be healthy. Anything that fails only on Linux (fonts, text widths in the 320 px check, line endings, ports, timing) is fixed at the root cause and explained in the commit body.
2. **Flakiness.** Run the E2E suite with `--repeat-each=5` and report. Pay attention to offline/reconnect and live price tests. Fix flakiness by waiting on real conditions (state, network, DOM), never by adding sleeps or retries.
3. **Build warning.** A visible chunk-size warning looks unattended. Add vendor chunks for stable dependencies, measure again, and if a warning remains set `build.chunkSizeWarningLimit` deliberately with a comment pointing to the ADR. Update the ADR with gzip sizes.
4. **Chart text alternative.** The chart is a labelled figure, but a screen reader cannot tell what it shows. Add a translated text summary linked to it (period, change in %, start and end price, high and low) that updates with the period. Unit tests, and update the axe checks if needed.
5. **Arabic in E2E.** Confirm that the main flow switches to Arabic and checks RTL (direction, layout, Latin digits, chart stays left to right). If not, add it.
6. **Manual accessibility notes.** A keyboard-only pass through every page, listed. Confirm live price updates do not flood screen readers. Write the findings in `docs/testing`.

Then stop and give a short report: CI result with a link, flakiness result, new bundle sizes (raw and gzip), anything changed. Do not start Phase 7.

Result: commits `ebf03f0` to `83d8669`, ADR 0009, `docs/testing/web-a11y.md`.
