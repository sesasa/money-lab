import { test, expect } from "@playwright/test";
test("scenarios, playback, sliders, ledger, notes and CSV export work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The economy, in motion." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Advance one step" }).click();
  await page.getByRole("tab", { name: "Transaction ledger" }).click();
  await expect(page.getByText("Final sale", { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(8);
  await page.getByRole("tab", { name: "Live network" }).click();
  await page.getByRole("button", { name: /03 Excess money creation/ }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".metric.purple .metric-value")).toContainText(
    "1.500",
  );
  await expect(page.locator(".metric.green .metric-value")).toContainText(
    "150.0",
  );
  await page.getByRole("button", { name: /04 Velocity increase/ }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".metric.purple .metric-value")).toContainText(
    "1.200",
  );
  await expect(page.locator(".metric.green .metric-value")).toContainText(
    "100.0",
  );
  await page.getByRole("button", { name: "Reset to baseline" }).click();
  await page.getByRole("switch", { name: "Auto Stabilize Prices" }).click();
  await page.getByRole("slider", { name: "Money supply · M" }).fill("150");
  await page.getByRole("slider", { name: "Money supply · M" }).press("Tab");
  await expect(page.locator(".metric.purple .metric-value")).toContainText(
    "1.500",
  );
  await page.getByRole("button", { name: "Inspect Manufacturer" }).click();
  await expect(page.locator(".inspector-name strong")).toHaveText(
    "Manufacturer",
  );
  await page.getByRole("button", { name: "Model notes" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download timeline as CSV" }).click();
  expect((await download).suggestedFilename()).toBe("money-lab-timeline.csv");
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("healthy growth settles and fixed-money growth falls in price", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /02 Growth, fixed money/ }).click();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator(".metric.purple .metric-value")).toContainText(
    "0.833",
  );
  await expect(page.locator(".metric.orange .metric-value")).toContainText(
    "120.0",
  );
  await page
    .getByRole("button", { name: /01 Healthy economic growth/ })
    .click();
  await page.getByLabel("Simulation speed").selectOption("4");
  await expect(page.locator(".metric.green .metric-value")).toContainText(
    "120.0",
    { timeout: 9000 },
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const before = await page.locator(".time-display").textContent();
  await page.waitForTimeout(400);
  expect(await page.locator(".time-display").textContent()).toEqual(before);
});
test("mobile has no page overflow and reduced-motion controls remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Advance one step" }).click();
  await page.getByRole("switch", { name: "Auto Stabilize Prices" }).click();
  await page.getByRole("slider", { name: "Production capacity" }).fill("0");
  await page.getByRole("slider", { name: "Production capacity" }).press("Tab");
  await expect(page.locator(".metric.purple .metric-value")).toContainText("—");
  await expect(page.getByText("No final sales; P is undefined.")).toBeVisible();
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("a slider drag commits once; price targets and keyboard navigation work", async ({
  page,
}) => {
  await page.goto("/");
  const slider = page.getByRole("slider", { name: "Productivity" });
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + box.width / 3, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, {
    steps: 12,
  });
  await expect(page.locator(".time-display")).toContainText("0.0");
  await page.mouse.up();
  await expect(page.locator(".time-display")).toContainText("0.1");
  const target = page.getByLabel("Target price level");
  await target.fill("0.8");
  await expect(page.locator(".time-display")).toContainText("0.1");
  await target.press("Enter");
  await expect(target).toHaveValue("0.8");
  await expect(page.locator(".time-display")).toContainText("0.2");
  const tabs = page.getByRole("tab", { name: "Live network" });
  await tabs.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    "tab-ledger",
  );
  const notes = page.getByRole("button", { name: "Model notes" });
  await notes.click();
  await page.keyboard.press("Escape");
  await expect(notes).toBeFocused();
});
