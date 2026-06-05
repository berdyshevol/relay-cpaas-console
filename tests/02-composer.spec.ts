import { test, expect } from "@playwright/test";

test("composer sends an outbound message with a delivery status", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("conversation-row").filter({ hasText: "Maya Chen" }).click();

  const unique = `Confirming your demo — ${Date.now()}`;
  await page.getByTestId("composer-input").fill(unique);
  await page.getByTestId("composer-send").click();

  const thread = page.getByTestId("thread-messages");
  const sent = thread.getByTestId("message").filter({ hasText: unique });
  await expect(sent).toBeVisible();
  await expect(sent).toHaveAttribute("data-direction", "outbound");

  // A delivery status pill is shown and progresses to "delivered" in simulator mode.
  await expect(sent.getByTestId("status-pill")).toBeVisible();
  await expect(sent.getByTestId("status-pill")).toHaveAttribute(
    "data-status",
    "delivered",
    { timeout: 8000 },
  );
});
